import { useEffect, useState } from 'react';
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

// Board card component with improved design
const BoardCard: React.FC<{ 
  title: string; 
  listsCount?: number; 
  onClick: () => void;
}> = ({ title, listsCount = 0, onClick }) => (
  <Card 
    className="cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 h-full flex flex-col justify-between" 
    onClick={onClick}
  >
    <div>
      <div className="w-full h-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-t-md -mt-8 mb-4"></div>
      <h3 className="text-lg font-semibold text-gray-900 truncate">{title}</h3>
    </div>
    <div className="mt-4 flex items-center text-sm text-gray-500">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      {listsCount} {listsCount === 1 ? 'list' : 'lists'}
    </div>
  </Card>
);

// Improved empty state with illustration
const EmptyState: React.FC<{ onCreateClick: () => void }> = ({ onCreateClick }) => (
  <div className="text-center py-12 px-4 sm:px-6 lg:px-8 bg-white rounded-lg shadow-sm border border-gray-100 max-w-lg mx-auto">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-indigo-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
    <h3 className="mt-4 text-lg font-medium text-gray-900">No boards yet</h3>
    <p className="mt-2 text-base text-gray-500">
      Start organizing your projects by creating your first board
    </p>
    <div className="mt-6">
      <Button onClick={onCreateClick} variant="primary" className="px-8 py-3">
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

// Improved create board form
const CreateBoardForm: React.FC<{
  title: string;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (value: string) => void;
  onCancel: () => void;
}> = ({ title, onSubmit, onChange, onCancel }) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div className="mb-1 flex items-center text-lg font-medium text-gray-900">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      </svg>
      Create a New Board
    </div>
    <Input
      type="text"
      value={title}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Enter a name for your board"
      label="Board Name"
      autoFocus
    />
    <div className="flex gap-4 pt-2">
      <Button type="submit" className="px-4">
        <span className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create Board
        </span>
      </Button>
      <Button type="button" variant="secondary" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  </form>
);

const HomePage = () => {
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { boards, isLoading } = useSelector((state: RootState) => state.board);

  useEffect(() => {
    console.log('Fetching boards...');
    dispatch(fetchBoards())
      .unwrap()
      .then(result => {
        console.log('API Response:', result);
      })
      .catch((err) => {
        console.error('Error fetching boards:', err);
        setError('Failed to fetch boards');
      });
  }, [dispatch]);

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardTitle.trim()) return;

    try {
      const result = await dispatch(createBoard({ title: newBoardTitle })).unwrap();
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
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-12 mb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Organize your projects
              </h1>
              <p className="mt-3 text-lg">
                Create boards, lists, and cards to keep track of your tasks and collaborate with your team.
              </p>
              {!isCreating && !boards.length && (
                <button
                  onClick={() => setIsCreating(true)}
                  className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-indigo-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-700 focus:ring-white transition-colors duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Get Started
                </button>
              )}
            </div>
            <div className="mt-6 md:mt-0 md:ml-10 hidden md:block">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-40 w-40 text-white opacity-75" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Your Boards</h2>
          {!isCreating && boards.length > 0 && (
            <Button onClick={() => setIsCreating(true)} className="w-auto">
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create New Board
              </span>
            </Button>
          )}
        </div>

        <ErrorMessage message={error} />

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            {isCreating && (
              <Card className="mb-8 border border-gray-100 animate-fadeIn">
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
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-fadeIn">
                {boards.map((board) => (
                  <BoardCard
                    key={board.id}
                    title={board.title}
                    listsCount={board.lists?.length || 0}
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