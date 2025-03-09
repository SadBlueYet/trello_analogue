import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchBoards, createBoard } from '../store/board.slice';
import { 
  Button, 
  Input, 
  Card, 
  ErrorMessage,
  Badge
} from '../components/ui';

// Яркие цветовые градиенты для карточек досок
const BOARD_GRADIENTS = [
  'from-indigo-500 to-purple-500',
  'from-pink-500 to-rose-500',
  'from-orange-400 to-pink-500',
  'from-green-400 to-cyan-500',
  'from-blue-500 to-indigo-500',
  'from-purple-500 to-indigo-500',
  'from-yellow-400 to-orange-500',
  'from-red-500 to-pink-500',
  'from-teal-400 to-cyan-500',
];

// Получение градиента на основе ID доски
const getGradientByBoardId = (id: number): string => {
  // Используем ID доски для детерминированного выбора градиента
  const gradientIndex = id % BOARD_GRADIENTS.length;
  return BOARD_GRADIENTS[gradientIndex];
};

// Улучшенная карточка доски с ярким дизайном
const BoardCard: React.FC<{ 
  title: string; 
  listsCount?: number; 
  background?: string;
  boardId: number;
  onClick: () => void;
}> = ({ title, listsCount = 0, background, boardId, onClick }) => {
  // Выбираем градиент на основе ID доски, если он не указан явно
  const gradient = background || getGradientByBoardId(boardId);
  
  return (
    <Card 
      className="cursor-pointer h-full flex flex-col justify-between overflow-hidden p-0 border-none" 
      onClick={onClick}
      hover
    >
      <div className={`h-24 bg-gradient-to-r ${gradient} p-4 text-white flex flex-col justify-between`}>
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-bold truncate">{title}</h3>
          <div className="tag">
            {listsCount} {listsCount === 1 ? 'list' : 'lists'}
          </div>
        </div>
        <div className="mt-auto flex">
          <span className="text-xs text-white/80">Click to open</span>
        </div>
      </div>
      <div className="p-4 bg-white">
        <div className="flex items-center text-sm text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Created recently
        </div>
        <div className="mt-2 flex justify-end">
          <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    </Card>
  );
};

// Улучшенное пустое состояние с анимацией
const EmptyState: React.FC<{ onCreateClick: () => void }> = ({ onCreateClick }) => (
  <div className="text-center py-12 px-6 bg-white rounded-xl shadow-md border border-gray-100 max-w-lg mx-auto">
    <div className="w-24 h-24 mx-auto bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center animate-pulse-soft">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </div>
    <h3 className="mt-6 text-xl font-bold text-gray-900">No boards yet</h3>
    <p className="mt-2 text-base text-gray-600">
      Start organizing your projects by creating your first board
    </p>
    <div className="mt-8">
      <Button onClick={onCreateClick} className="px-8 py-3 text-base">
        <span className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create Your First Board
        </span>
      </Button>
    </div>
  </div>
);

// Улучшенная форма создания доски
const CreateBoardForm: React.FC<{
  title: string;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (value: string) => void;
  onCancel: () => void;
}> = ({ title, onSubmit, onChange, onCancel }) => {
  const [selectedGradient, setSelectedGradient] = useState(BOARD_GRADIENTS[0]);
  
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="flex items-center text-xl font-bold text-gray-900 mb-6">
        <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center shadow-md mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        Create a New Board
      </div>
      
      <Input
        type="text"
        value={title}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter a name for your board"
        label="Board Name"
        autoFocus
        icon={
          <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        }
      />
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Choose Background
        </label>
        <div className="grid grid-cols-5 gap-2">
          {BOARD_GRADIENTS.map((gradient, index) => (
            <button
              key={index}
              type="button"
              className={`h-10 rounded-md bg-gradient-to-r ${gradient} transition-all duration-200 ${selectedGradient === gradient ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'hover:scale-105'}`}
              onClick={() => setSelectedGradient(gradient)}
            />
          ))}
        </div>
      </div>
      
      <div className="flex gap-3 pt-2">
        <Button type="submit" className="min-w-[150px]">
          <span className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Board
          </span>
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

const HomePage = () => {
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { boards, isLoading } = useSelector((state: RootState) => state.board);

  useEffect(() => {
    dispatch(fetchBoards())
      .unwrap()
      .catch((err) => {
        console.error('Error fetching boards:', err);
        setError('Failed to fetch boards');
      });
  }, [dispatch]);

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardTitle.trim()) return;

    try {
      const result = await dispatch(createBoard({ 
        title: newBoardTitle,
        description: 'A new board'
      })).unwrap();
      await dispatch(fetchBoards());
      setNewBoardTitle('');
      setIsCreating(false);
      setTimeout(() => {
        navigate(`/boards/${result.id}`);
      }, 100);
    } catch (err) {
      setError('Failed to create board');
      console.error('Error creating board:', err);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section с новым ярким градиентом */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-14 mb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl mb-2">
                Welcome to TaskFlow
              </h1>
              <div className="h-1 w-20 bg-white/30 rounded-full mb-4"></div>
              <p className="mt-3 text-lg text-white/90">
                Create boards, lists, and cards to keep track of your tasks and collaborate with your team.
              </p>
              {!isCreating && !boards.length && (
                <button
                  onClick={() => setIsCreating(true)}
                  className="mt-8 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-lg text-indigo-700 bg-white hover:bg-gray-50 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-700 focus:ring-white transition-all duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Get Started
                </button>
              )}
            </div>
            <div className="mt-6 md:mt-0 md:ml-10 hidden md:block">
              <div className="h-48 w-48 bg-white/10 rounded-xl p-4 backdrop-blur-sm shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-md bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center shadow-sm mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Your Boards</h2>
          </div>
          
          {!isCreating && boards.length > 0 && (
            <Button onClick={() => setIsCreating(true)} className="w-auto" icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            }>
              Create New Board
            </Button>
          )}
        </div>

        <ErrorMessage message={error} />

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-t-4 border-b-4 border-indigo-500 animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-10 w-10 rounded-full bg-indigo-500 opacity-30 animate-ping"></div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {isCreating && (
              <Card className="mb-8 p-6 shadow-lg">
                <CreateBoardForm
                  title={newBoardTitle}
                  onSubmit={handleCreateBoard}
                  onChange={setNewBoardTitle}
                  onCancel={() => {
                    setIsCreating(false);
                    setNewBoardTitle('');
                  }}
                />
              </Card>
            )}

            {boards.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {boards.map((board) => (
                  <BoardCard
                    key={board.id}
                    title={board.title}
                    listsCount={board.lists?.length || 0}
                    background={board.background_color}
                    boardId={board.id}
                    onClick={() => navigate(`/boards/${board.id}`)}
                  />
                ))}
              </div>
            ) : (
              !isCreating && <EmptyState onCreateClick={() => setIsCreating(true)} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HomePage; 