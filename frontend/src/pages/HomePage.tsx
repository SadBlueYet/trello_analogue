import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchBoards, createBoard } from '../store/board.slice';
import {
  Button,
  Input,
  Card,
  ErrorMessage
} from '../components/ui';
import BoardCard from '../components/board/BoardCard';


const EmptyState: React.FC<{ onCreateClick: () => void }> = ({ onCreateClick }) => (
  <div className="text-center py-12 px-6 bg-white rounded-xl shadow-md border border-gray-100 max-w-lg mx-auto">
    <div className="w-24 h-24 mx-auto bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-full flex items-center justify-center animate-pulse-soft">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </div>
    <h3 className="mt-6 text-xl font-bold text-gray-900">No boards yet</h3>
    <p className="mt-2 text-base text-gray-600">
      Start organizing your projects by creating your first board
    </p>
    <div className="mt-8">
      <Button onClick={onCreateClick} className="px-8 py-3 text-base shadow-lg border border-indigo-700 hover:shadow-xl">
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

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md mr-4 bg-indigo-500">
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

      <div className="flex gap-3 pt-2">
        <Button type="submit" className="px-4 shadow-md border border-indigo-700">
          Create Board
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="border border-indigo-300 hover:border-indigo-400">
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
        description: 'A new board',
        background_color: '#4F46E5' // Default indigo color
      })).unwrap();
      await dispatch(fetchBoards());
      setNewBoardTitle('');
      setIsCreating(false);
      navigate(`/boards/${result.id}`);
    } catch (err) {
      setError('Failed to create board');
      console.error('Error creating board:', err);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section с индиго градиентом */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white py-10 mb-8">
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
                className="px-4 py-2 bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg border border-white hover:border-indigo-100 transition-all duration-200"
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
                    className="text-sm px-3 py-1 border-indigo-300 hover:bg-indigo-50 shadow-sm"
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
                      board={board}
                      onClick={() => navigate(`/boards/${board.id}`)}
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
