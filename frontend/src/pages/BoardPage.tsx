import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Navigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DroppableProvided, DraggableProvided } from '@hello-pangea/dnd';
import { RootState, AppDispatch } from '../store';
import { fetchBoard, setCurrentBoard } from '../store/board.slice';
import api from '../api/axios';
import { Board, BoardList, Card } from '../store/types';
import { listService } from '../services/list.service';
import { cardService } from '../services/card.service';
import { 
  Button, 
  Input, 
  Card as UICard,
  ErrorMessage,
  PageContainer,
  PageHeader
} from '../components/ui';

// New components for the board page
const ListCard: React.FC<{
  title: string;
  children: React.ReactNode;
  onAddCard: () => void;
  dragHandleProps?: any;
}> = ({ title, children, onAddCard, dragHandleProps }) => (
  <div className="w-80 flex-shrink-0 bg-gray-100 rounded-lg">
    <div
      {...dragHandleProps}
      className="p-2 font-medium bg-gray-200 rounded-t-lg"
    >
      {title}
    </div>
    {children}
    <div className="p-2">
      <Button
        onClick={onAddCard}
        variant="secondary"
        className="w-full text-left"
      >
        + Add a card
      </Button>
    </div>
  </div>
);

const TaskCard: React.FC<{
  title: string;
  description?: string;
  dragHandleProps?: any;
}> = ({ title, description, dragHandleProps }) => (
  <div
    {...dragHandleProps}
    className="mb-2 p-3 bg-white rounded shadow hover:shadow-md transition-shadow duration-200"
  >
    <div className="font-medium">{title}</div>
    {description && (
      <div className="mt-1 text-sm text-gray-600">{description}</div>
    )}
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

const BoardPage: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => {
    console.log('Auth State:', state.auth);
    return state.auth;
  });
  const { currentBoard, isLoading, error } = useSelector((state: RootState) => {
    console.log('Board State:', JSON.stringify(state.board, null, 2));
    return state.board;
  });
  const [newListTitle, setNewListTitle] = useState('');
  const [isAddingList, setIsAddingList] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [addingCardToList, setAddingCardToList] = useState<number | null>(null);

  useEffect(() => {
    console.log('BoardPage useEffect - params:', { boardId });
    console.log('Current User:', user);
    console.log('Loading board with ID:', boardId);
    if (boardId) {
      console.log('Dispatching fetchBoard with ID:', parseInt(boardId));
      dispatch(fetchBoard(parseInt(boardId)))
        .unwrap()
        .then(async (result) => {
          console.log('Successfully loaded board:', JSON.stringify(result, null, 2));
          // Load cards for each list
          const updatedLists = await Promise.all(
            result.lists.map(async (list) => {
              const cards = await cardService.getListCards(list.id);
              return { ...list, cards };
            })
          );
          dispatch(setCurrentBoard({ ...result, lists: updatedLists }));
        })
        .catch(err => {
          console.error('Error loading board:', err);
        });
    } else {
      console.log('No board ID provided');
    }
  }, [dispatch, boardId, user]);

  console.log('Rendering BoardPage - Current Board:', JSON.stringify(currentBoard, null, 2));
  
  if (!user) {
    console.log('No user found, redirecting to login');
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
    if (!result.destination || !currentBoard) return;

    const { source, destination, type } = result;

    if (type === 'LIST') {
      const lists = Array.from(currentBoard.lists);
      const [removed] = lists.splice(source.index, 1);
      lists.splice(destination.index, 0, removed);

      const updatedLists = lists.map((list, index) => ({
        ...list,
        position: index,
        board_id: currentBoard.id
      }));

      const updatedBoard: Board = {
        ...currentBoard,
        lists: updatedLists
      };
      dispatch(setCurrentBoard(updatedBoard));

      try {
        await api.patch(
          `/lists/${removed.id}`,
          { 
            position: destination.index,
            board_id: currentBoard.id
          }
        );
      } catch (err) {
        console.error('Failed to update list position', err);
      }
    } else {
      const sourceList = currentBoard.lists.find(l => l.id === parseInt(source.droppableId));
      const destList = currentBoard.lists.find(l => l.id === parseInt(destination.droppableId));

      if (!sourceList || !destList) return;

      const sourceCards = Array.from(sourceList.cards);
      const destCards = source.droppableId === destination.droppableId
        ? sourceCards
        : Array.from(destList.cards);

      const [removed] = sourceCards.splice(source.index, 1);
      destCards.splice(destination.index, 0, removed);

      const updatedSourceCards = sourceCards.map((card, index) => ({
        ...card,
        position: index,
        list_id: parseInt(source.droppableId)
      }));

      const updatedDestCards = destCards.map((card, index) => ({
        ...card,
        position: index,
        list_id: parseInt(destination.droppableId)
      }));

      const updatedBoard: Board = {
        ...currentBoard,
        lists: currentBoard.lists.map(list => {
          if (list.id === parseInt(source.droppableId)) {
            return { ...list, cards: updatedSourceCards };
          }
          if (list.id === parseInt(destination.droppableId)) {
            return { ...list, cards: updatedDestCards };
          }
          return list;
        })
      };
      dispatch(setCurrentBoard(updatedBoard));

      try {
        await api.patch(
          `/cards/${removed.id}`,
          {
            list_id: parseInt(destination.droppableId),
            position: destination.index
          }
        );
      } catch (err) {
        console.error('Failed to update card position', err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <PageHeader 
            title={currentBoard.title}
            subtitle={currentBoard.description}
          />
        </div>
      </div>

      <main className="p-6">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="board" direction="horizontal" type="LIST">
            {(provided: DroppableProvided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex space-x-4 overflow-x-auto pb-4"
              >
                {currentBoard.lists.map((list, index) => (
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
                          title={list.title}
                          dragHandleProps={provided.dragHandleProps}
                          onAddCard={() => setAddingCardToList(list.id)}
                        >
                          <Droppable droppableId={list.id.toString()} type="CARD">
                            {(provided: DroppableProvided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className="p-2 min-h-[50px]"
                              >
                                {list.cards.map((card, index) => (
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
                                          title={card.title}
                                          description={card.description}
                                          dragHandleProps={provided.dragHandleProps}
                                        />
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
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

                <div className="w-80 flex-shrink-0">
                  {isAddingList ? (
                    <UICard>
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
                    </UICard>
                  ) : (
                    <Button
                      onClick={() => setIsAddingList(true)}
                      variant="secondary"
                      className="w-full text-left"
                    >
                      + Add another list
                    </Button>
                  )}
                </div>
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </main>
    </div>
  );
};

export default BoardPage; 