import { useState, useEffect } from 'react';
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
import BoardCard from '../components/BoardCard';

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
  selectedColor: string;
  onColorChange: (color: string) => void;
}> = ({ title, onSubmit, onChange, onCancel, selectedColor, onColorChange }) => {
  
  // Основные цвета для выбора
  const colors = [
    '#4F46E5', // indigo
    '#8B5CF6', // violet
    '#EC4899', // pink
    '#EF4444', // red
    '#F97316', // orange
    '#EAB308', // yellow
    '#22C55E', // green
    '#06B6D4', // cyan
    '#3B82F6', // blue
  ];
  
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md mr-4" 
             style={{ backgroundColor: selectedColor }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-800">Create New Board</h3>
      </div>
      
      <Input
        type="text"
        value={title}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter a name for your board"
        label="Board Name"
        autoFocus
      />
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Board Color
        </label>
        <div className="grid grid-cols-5 sm:grid-cols-9 gap-2">
          {colors.map((color, index) => (
            <button
              key={index}
              type="button"
              className={`aspect-square rounded-md transition-all duration-200 ${
                selectedColor === color ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'hover:scale-105'
              }`}
              style={{ backgroundColor: color }}
              onClick={() => onColorChange(color)}
            />
          ))}
        </div>
      </div>
      
      <div className="flex gap-3 pt-2">
        <Button type="submit" className="px-4">
          Create Board
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
  const [selectedColor, setSelectedColor] = useState('#4F46E5'); // Индиго по умолчанию
  
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
        description: 'A new board',
        background_color: selectedColor
      })).unwrap();
      await dispatch(fetchBoards());
      setNewBoardTitle('');
      setIsCreating(false);
      setSelectedColor('#4F46E5'); // Сбрасываем цвет после создания
      navigate(`/boards/${result.id}`);
    } catch (err) {
      setError('Failed to create board');
      console.error('Error creating board:', err);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section с новым ярким градиентом */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-10 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl mb-2">
                Welcome to TaskFlow
              </h1>
              <div className="h-1 w-20 bg-white/30 rounded-full mb-3"></div>
              <p className="mt-2 text-base text-white/90">
                Organize your tasks with boards, lists, and cards to manage your projects effectively.
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <Button 
                onClick={() => setIsCreating(true)}
                className="px-4 py-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white shadow-lg shadow-purple-700/10 border border-white/10"
              >
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create New Board
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Содержимое страницы */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
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
              <Card className="mb-6 p-5 shadow-lg">
                <CreateBoardForm
                  title={newBoardTitle}
                  onSubmit={handleCreateBoard}
                  onChange={setNewBoardTitle}
                  selectedColor={selectedColor}
                  onColorChange={setSelectedColor}
                  onCancel={() => {
                    setIsCreating(false);
                    setNewBoardTitle('');
                  }}
                />
              </Card>
            )}

            {error && (
              <ErrorMessage message={error} />
            )}

            {boards.length > 0 && (
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">Your Boards</h2>
                {!isCreating && (
                  <Button 
                    onClick={() => setIsCreating(true)}
                    variant="outline" 
                    className="text-sm px-3 py-1"
                  >
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Board
                    </span>
                  </Button>
                )}
              </div>
            )}

            {boards.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {boards.map((board) => (
                  <div className="w-full" key={board.id}>
                    <BoardCard
                      title={board.title}
                      listsCount={board.lists?.length || 0}
                      background={board.background_color}
                      boardId={board.id}
                      description={board.description}
                      onClick={() => navigate(`/boards/${board.id}`)}
                      created_at={board.created_at}
                    />
                  </div>
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