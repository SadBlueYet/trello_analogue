import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Navigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DroppableProvided, DraggableProvided } from '@hello-pangea/dnd';
import { RootState, AppDispatch } from '../store';
import { fetchBoard, setCurrentBoard, clearBoardCache, updateBoard } from '../store/board.slice';
import api from '../api/axios';
import { Board, BoardList, Card } from '../store/types';
import { listService } from '../services/list.service';
import { cardService } from '../services/card.service';
import { boardService } from '../services/board.service';
import { 
  Button, 
  Input, 
  Card as UICard,
  ErrorMessage,
  PageContainer,
  PageHeader,
  Modal
} from '../components/ui';
import BoardSettingsForm from '../components/BoardSettingsForm';

// New components for the board page
const ListCard: React.FC<{
  title: string;
  children: React.ReactNode;
  onAddCard: () => void;
  dragHandleProps?: any;
}> = ({ title, children, onAddCard, dragHandleProps }) => (
  <div className="w-80 flex-shrink-0 bg-gray-100 rounded-lg shadow-md border border-gray-200 overflow-hidden">
    <div
      {...dragHandleProps}
      className="p-3 font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg flex justify-between items-center"
    >
      <span>{title}</span>
    </div>
    <div className="max-h-[60vh] overflow-y-auto p-2 space-y-2">
      {children}
    </div>
    <div className="p-3 bg-gray-50 border-t border-gray-200">
      <Button
        onClick={onAddCard}
        variant="secondary"
        className="w-full text-left hover:bg-blue-50 transition-colors duration-200"
      >
        + Add a card
      </Button>
    </div>
  </div>
);

const TaskCard: React.FC<{
  id: number;
  title: string;
  description?: string;
  dragHandleProps?: any;
}> = ({ id, title, description, dragHandleProps }) => (
  <div className="bg-white rounded-md shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
    <div
      {...dragHandleProps}
      className="p-3 cursor-pointer"
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-gray-800">{title}</h4>
        <span className="text-xs font-mono bg-blue-100 text-blue-800 rounded px-2 py-1">TA-{String(id).padStart(3, '0')}</span>
      </div>
      
      {description && (
        <p className="mt-1 text-sm text-gray-600 line-clamp-2">{description}</p>
      )}
      
      <div className="mt-3 flex items-center justify-between">
        <span className="flex items-center text-xs text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Created recently
        </span>
        <div className="flex space-x-1">
          {description && (
            <span className="inline-flex items-center text-xs text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </span>
          )}
        </div>
      </div>
    </div>
  </div>
);

const AddItemForm: React.FC<{
  placeholder: string;
  onSubmit: (e: React.FormEvent) => void;
  value: string;
  onChange: (value: string) => void;
  onCancel: () => void;
}> = ({ placeholder, onSubmit, value, onChange, onCancel }) => (
  <form onSubmit={onSubmit} className="p-2">
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus
    />
    <div className="mt-2 flex space-x-2">
      <Button type="submit" className="w-auto">
        Add
      </Button>
      <Button type="button" variant="secondary" onClick={onCancel} className="w-auto">
        Cancel
      </Button>
    </div>
  </form>
);

// Кеширование загрузки карточек
const cardsCache = new Map<number, { cards: Card[], timestamp: number }>();
const CARDS_CACHE_TIME = 30000; // 30 секунд

// Избегаем дублирования запросов
const pendingCardRequests = new Map<number, Promise<Card[]>>();

// Функция для загрузки карточек списка с кешированием
async function getListCardsWithCache(listId: number): Promise<Card[]> {
  // Проверка на корректный ID
  if (!listId || typeof listId !== 'number' || isNaN(listId)) {
    console.error("Invalid list ID provided to getListCardsWithCache:", listId);
    return [];
  }

  // Проверяем кеш
  const cachedData = cardsCache.get(listId);
  const now = Date.now();
  
  if (cachedData && now - cachedData.timestamp < CARDS_CACHE_TIME) {
    return cachedData.cards;
  }
  
  // Проверяем, есть ли уже запрос на эти карточки
  if (pendingCardRequests.has(listId)) {
    try {
      return await pendingCardRequests.get(listId)!;
    } catch (error) {
      console.error(`Error in pending card request for list ${listId}:`, error);
      return [];
    }
  }
  
  // Создаем новый запрос
  const cardPromise = cardService.getListCards(listId)
    .then(cards => {
      // Проверяем корректность полученных данных
      if (!Array.isArray(cards)) {
        console.error(`Received invalid cards data for list ${listId}:`, cards);
        return [];
      }
      
      // Кешируем результат
      cardsCache.set(listId, { cards, timestamp: Date.now() });
      // Удаляем запрос из списка ожидающих
      setTimeout(() => pendingCardRequests.delete(listId), 0);
      return cards;
    })
    .catch(error => {
      // Удаляем запрос из списка ожидающих в случае ошибки
      setTimeout(() => pendingCardRequests.delete(listId), 0);
      console.error(`Error fetching cards for list ${listId}:`, error);
      return [];
    });
  
  // Сохраняем запрос
  pendingCardRequests.set(listId, cardPromise);
  
  return cardPromise;
}

// Функция для очистки кеша карточек для всех списков
function clearAllCardsCache() {
  // Очищаем весь кеш карточек
  cardsCache.clear();
  // Также очищаем все ожидающие запросы
  pendingCardRequests.clear();
}

// Функция для очистки кеша карточек для конкретного списка
function clearListCardsCache(listId: number) {
  if (listId && !isNaN(listId)) {
    cardsCache.delete(listId);
    pendingCardRequests.delete(listId);
  }
}

const BoardPage: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { currentBoard, isLoading, error } = useSelector((state: RootState) => state.board);
  
  const [newListTitle, setNewListTitle] = useState('');
  const [isAddingList, setIsAddingList] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [addingCardToList, setAddingCardToList] = useState<number | null>(null);
  
  // Добавляем новые состояния для управления модальным окном настроек
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  
  // Избегаем повторной загрузки
  const boardLoadedRef = useRef(false);

  useEffect(() => {
    if (!boardId || boardLoadedRef.current) return;
    
    const loadBoard = async () => {
      // Очищаем весь кеш при загрузке доски
      clearAllCardsCache();
      
      try {
        if (boardId) {
          const parsedBoardId = parseInt(boardId);
          
          try {
            // Загружаем основную информацию о доске
            const boardResult = await dispatch(fetchBoard(parsedBoardId)).unwrap();
            
            if (!boardResult || !Array.isArray(boardResult.lists)) {
              console.error("Invalid board data received:", boardResult);
              return;
            }
            
            // Загружаем карточки для всех списков параллельно
            const listsWithCards = await Promise.all(
              boardResult.lists.map(async (list) => {
                if (!list || typeof list.id !== 'number') {
                  console.error("Invalid list data:", list);
                  return { ...list, cards: [] };
                }
                
                try {
                  const cards = await getListCardsWithCache(list.id);
                  return { ...list, cards: Array.isArray(cards) ? cards : [] };
                } catch (error) {
                  console.error(`Error loading cards for list ${list.id}:`, error);
                  return { ...list, cards: [] }; // Возвращаем пустой список карточек при ошибке
                }
              })
            );
            
            // Обновляем доску с полученными карточками
            dispatch(setCurrentBoard({ ...boardResult, lists: listsWithCards }));
          } catch (error) {
            console.error('Error loading board data:', error);
          }
        }
      } catch (error) {
        console.error('Error processing board ID:', error);
      }
    };
    
    loadBoard();
    boardLoadedRef.current = true;
    
    // Сбрасываем флаг при размонтировании или изменении ID доски
    return () => {
      boardLoadedRef.current = false;
    };
  }, [dispatch, boardId]);
  
  if (!user) {
    return <Navigate to="/login" />;
  }

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center">
          <div className="text-gray-600">Loading board...</div>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <ErrorMessage message={error} />
      </PageContainer>
    );
  }

  if (!currentBoard) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center">
          <div className="text-gray-600">Board not found</div>
        </div>
      </PageContainer>
    );
  }

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim() || !currentBoard) return;

    try {
      const response = await listService.createList(currentBoard.id, {
        title: newListTitle,
        position: currentBoard.lists.length,
        board_id: currentBoard.id
      });

      const newList = {
        ...response,
        cards: []
      };

      // Очищаем кеш доски
      clearBoardCache(currentBoard.id);
      // Очищаем кеш карточек
      clearAllCardsCache();

      const updatedBoard: Board = {
        ...currentBoard,
        lists: [...currentBoard.lists, newList]
      };
      dispatch(setCurrentBoard(updatedBoard));
      setNewListTitle('');
      setIsAddingList(false);
    } catch (err) {
      console.error('Failed to create list', err);
    }
  };

  const handleCreateCard = async (listId: number) => {
    if (!newCardTitle.trim() || !currentBoard) return;

    try {
      const list = currentBoard.lists.find(l => l.id === listId);
      if (!list) return;

      const response = await cardService.createCard(listId, {
        title: newCardTitle,
        position: list.cards.length,
        list_id: listId
      });

      // Очищаем кэш для этого списка
      cardsCache.delete(listId);
      pendingCardRequests.delete(listId);
      // Очищаем кеш доски
      clearBoardCache(currentBoard.id);

      const updatedBoard: Board = {
        ...currentBoard,
        lists: currentBoard.lists.map(list =>
          list.id === listId
            ? { ...list, cards: [...list.cards, response] }
            : list
        )
      };
      dispatch(setCurrentBoard(updatedBoard));
      setNewCardTitle('');
      setAddingCardToList(null);
    } catch (err) {
      console.error('Failed to create card', err);
    }
  };

  const handleDragEnd = async (result: any) => {
    const { destination, source, draggableId, type } = result;
    
    // Если нет места назначения, ничего не делаем
    if (!destination) {
      return;
    }
    
    // Если исходный и целевой индексы совпадают, ничего не делаем
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }
    
    // Проверяем, что currentBoard существует
    if (!currentBoard || !Array.isArray(currentBoard.lists)) {
      console.error("Cannot handle drag end - board or lists are undefined");
      return;
    }
    
    // Если перетаскивается список
    if (type === 'LIST') {
      try {
        // Получаем списки и перемещаемый список
        const lists = [...currentBoard.lists];
        
        if (!Array.isArray(lists)) {
          console.error("Lists array is not valid");
          return;
        }
        
        // Получаем список, который перемещаем
        const movedList = lists[source.index];
        
        if (!movedList) {
          console.error("Moved list is undefined");
          return;
        }
        
        // Удаляем список из исходной позиции
        lists.splice(source.index, 1);
        
        // Вставляем список в новую позицию
        lists.splice(destination.index, 0, movedList);
        
        // Обновляем позиции
        const updatedLists = lists.map((list, index) => ({
          ...list,
          position: index
        }));
        
        // Создаем обновленную доску
        const updatedBoard: Board = {
          ...currentBoard,
          lists: updatedLists
        };
        
        // Обновляем локальное состояние
        dispatch(setCurrentBoard(updatedBoard));
        
        // Отправляем запрос на сервер для обновления позиции списка
        try {
          await listService.reorderList(movedList.id, destination.index);
          // Очищаем весь кеш после перетаскивания списков
          clearAllCardsCache();
          // Очищаем кеш доски
          clearBoardCache(currentBoard.id);
        } catch (err) {
          console.error('Failed to update list position', err);
          // Если была ошибка, загружаем актуальное состояние с сервера
          dispatch(fetchBoard(currentBoard.id));
        }
      } catch (error) {
        console.error("Error handling list drag:", error);
      }
    }
    
    // Если перетаскивается карточка
    if (type === 'CARD') {
      try {
        // Извлекаем ID списков из droppableId
        const sourceListIdMatch = source.droppableId.match(/list-(\d+)/);
        const destListIdMatch = destination.droppableId.match(/list-(\d+)/);
        
        if (!sourceListIdMatch || !destListIdMatch) {
          console.error("Invalid list ID format in droppable IDs");
          return;
        }
        
        const sourceListId = parseInt(sourceListIdMatch[1]);
        const destListId = parseInt(destListIdMatch[1]);
        
        if (isNaN(sourceListId) || isNaN(destListId)) {
          console.error("Invalid list IDs:", sourceListId, destListId);
          return;
        }
        
        // Находим исходный и целевой списки
        const sourceList = currentBoard.lists.find(list => list.id === sourceListId);
        const destList = currentBoard.lists.find(list => list.id === destListId);
        
        if (!sourceList || !destList) {
          console.error("Source or destination list not found");
          return;
        }
        
        // Получаем ID карточки из draggableId
        const cardIdMatch = draggableId.match(/card-(\d+)/);
        
        if (!cardIdMatch) {
          console.error("Invalid card ID format in draggableId");
          return;
        }
        
        const cardId = parseInt(cardIdMatch[1]);
        
        if (isNaN(cardId)) {
          console.error("Invalid card ID:", cardId);
          return;
        }
        
        // Находим карточку, которую перемещаем
        const movedCard = sourceList.cards.find(card => card.id === cardId);
        
        if (!movedCard) {
          console.error("Moved card not found");
          return;
        }
        
        // Копируем массивы карточек, чтобы не изменять оригинальные
        const sourceCards = Array.isArray(sourceList.cards) ? [...sourceList.cards] : [];
        const destCards = Array.isArray(destList.cards) ? [...destList.cards] : [];
        
        // Если перемещение в пределах одного списка
        if (sourceListId === destListId) {
          // Удаляем карточку из исходной позиции
          sourceCards.splice(source.index, 1);
          
          // Вставляем карточку в новую позицию
          sourceCards.splice(destination.index, 0, movedCard);
          
          // Обновляем позиции
          const updatedCards = sourceCards.map((card, index) => ({
            ...card,
            position: index
          }));
          
          // Создаем обновленную доску
          const updatedBoard: Board = {
            ...currentBoard,
            lists: Array.isArray(currentBoard.lists) ? currentBoard.lists.map(list => 
              list.id === sourceListId 
                ? { ...list, cards: updatedCards }
                : list
            ) : []
          };
          
          // Обновляем локальное состояние
          dispatch(setCurrentBoard(updatedBoard));
        } else {
          // Если перемещение между списками
          
          // Удаляем карточку из исходного списка
          sourceCards.splice(source.index, 1);
          
          // Вставляем карточку в целевой список
          destCards.splice(destination.index, 0, { ...movedCard, list_id: destListId });
          
          // Обновляем позиции в обоих списках
          const updatedSourceCards = sourceCards.map((card, index) => ({
            ...card,
            position: index
          }));
          
          const updatedDestCards = destCards.map((card, index) => ({
            ...card,
            position: index,
            list_id: destListId
          }));
          
          // Создаем обновленную доску
          const updatedBoard: Board = {
            ...currentBoard,
            lists: Array.isArray(currentBoard.lists) ? currentBoard.lists.map(list => {
              if (list.id === sourceListId) {
                return { ...list, cards: updatedSourceCards };
              }
              if (list.id === destListId) {
                return { ...list, cards: updatedDestCards };
              }
              return list;
            }) : []
          };
          
          // Обновляем локальное состояние
          dispatch(setCurrentBoard(updatedBoard));
        }
        
        try {
          // Отправляем запрос на сервер
          await cardService.moveCard(
            movedCard.id,
            destListId,
            destination.index
          );
          
          // Очищаем кеш для затронутых списков
          clearListCardsCache(sourceListId);
          if (sourceListId !== destListId) {
            clearListCardsCache(destListId);
          }
          
          // Очищаем кеш доски
          clearBoardCache(currentBoard.id);
        } catch (err) {
          console.error('Failed to update card position', err);
          // Если была ошибка, загружаем актуальное состояние с сервера
          dispatch(fetchBoard(currentBoard.id));
        }
      } catch (error) {
        console.error("Error handling card drag:", error);
      }
    }
  };

  // Добавляем функцию для обновления настроек доски
  const handleSaveSettings = async (updatedSettings: { 
    title: string; 
    description?: string; 
    backgroundColor?: string 
  }) => {
    if (!currentBoard) return;
    
    setIsSavingSettings(true);
    
    try {
      // Переименовываем свойство для соответствия бэкенду
      const apiData = {
        title: updatedSettings.title,
        description: updatedSettings.description,
        background_color: updatedSettings.backgroundColor
      };
      
      // Вызываем сервис для обновления доски
      const updatedBoard = await boardService.updateBoard(currentBoard.id, apiData);
      
      // Обновляем текущую доску в Redux
      // Сохраняем списки и карточки из текущей доски, так как они могут отсутствовать в ответе API
      dispatch(setCurrentBoard({
        ...updatedBoard,
        lists: currentBoard.lists
      }));
      
      // Очищаем кеш досок
      clearBoardCache(currentBoard.id);
      
      // Закрываем модальное окно
      setSettingsModalOpen(false);
    } catch (error) {
      console.error('Failed to update board settings:', error);
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`bg-gradient-to-r ${currentBoard?.background_color || 'from-blue-600 to-indigo-700'} text-white shadow-lg`}>
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {currentBoard?.title || 'Loading board...'}
              </h1>
              {currentBoard?.description && (
                <p className="mt-1 text-sm text-blue-100 max-w-2xl">
                  {currentBoard.description}
                </p>
              )}
            </div>
            <div className="flex space-x-3">
              <Button
                variant="secondary"
                className="text-sm px-3 py-1 bg-white/10 hover:bg-white/20 border-transparent text-white"
                onClick={() => setSettingsModalOpen(true)}
              >
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </span>
              </Button>
              <Button
                variant="secondary"
                className="text-sm px-3 py-1 bg-white/10 hover:bg-white/20 border-transparent text-white"
                onClick={() => {
                  // Можно добавить функциональность поделиться доской
                }}
              >
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно настроек доски */}
      {currentBoard && (
        <Modal
          isOpen={settingsModalOpen}
          onClose={() => setSettingsModalOpen(false)}
          title="Board Settings"
          size="medium"
        >
          <BoardSettingsForm
            board={currentBoard}
            onSave={handleSaveSettings}
            onCancel={() => setSettingsModalOpen(false)}
            isSubmitting={isSavingSettings}
          />
        </Modal>
      )}

      {!currentBoard || !Array.isArray(currentBoard.lists) ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading board data...</div>
        </div>
      ) : (
        <main className="p-6">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="board" direction="horizontal" type="LIST">
              {(provided: DroppableProvided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex space-x-4 overflow-x-auto pb-4"
                >
                  {Array.isArray(currentBoard.lists) && currentBoard.lists.map((list, index) => (
                    <Draggable
                      key={list.id}
                      draggableId={`list-${list.id}`}
                      index={index}
                    >
                      {(provided: DraggableProvided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                        >
                          <ListCard
                            title={list.title || 'Untitled List'}
                            dragHandleProps={provided.dragHandleProps}
                            onAddCard={() => setAddingCardToList(list.id)}
                          >
                            <Droppable droppableId={`list-${list.id}`} type="CARD">
                              {(provided: DroppableProvided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.droppableProps}
                                  className="space-y-2"
                                >
                                  {Array.isArray(list.cards) ? list.cards.map((card, index) => (
                                    <Draggable
                                      key={card.id}
                                      draggableId={`card-${card.id}`}
                                      index={index}
                                    >
                                      {(provided) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                        >
                                          <TaskCard
                                            id={card.id}
                                            title={card.title || 'Untitled Card'}
                                            description={card.description}
                                            dragHandleProps={provided.dragHandleProps}
                                          />
                                        </div>
                                      )}
                                    </Draggable>
                                  )) : (
                                    <div className="p-2 text-gray-500 text-sm">No cards in this list</div>
                                  )}
                                  {provided.placeholder}

                                  {addingCardToList === list.id && (
                                    <AddItemForm
                                      placeholder="Enter card title"
                                      value={newCardTitle}
                                      onChange={setNewCardTitle}
                                      onSubmit={(e) => {
                                        e.preventDefault();
                                        handleCreateCard(list.id);
                                      }}
                                      onCancel={() => {
                                        setAddingCardToList(null);
                                        setNewCardTitle('');
                                      }}
                                    />
                                  )}
                                </div>
                              )}
                            </Droppable>
                          </ListCard>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}

                  {isAddingList ? (
                    <div className="w-80 flex-shrink-0">
                      <AddItemForm
                        placeholder="Enter list title"
                        value={newListTitle}
                        onChange={setNewListTitle}
                        onSubmit={handleCreateList}
                        onCancel={() => {
                          setIsAddingList(false);
                          setNewListTitle('');
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-80 flex-shrink-0">
                      <Button
                        onClick={() => setIsAddingList(true)}
                        className="w-full text-left p-3 bg-gray-100 hover:bg-gray-200 transition-colors duration-200 rounded-lg shadow-sm"
                      >
                        + Add a list
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </main>
      )}
    </div>
  );
};

export default BoardPage; 