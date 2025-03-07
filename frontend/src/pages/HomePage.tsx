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
  PageHeader
} from '../components/ui';

// New components for the boards page
const BoardCard: React.FC<{ 
  title: string; 
  listsCount?: number; 
  onClick: () => void;
}> = ({ title, listsCount = 0, onClick }) => (
  <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200" onClick={onClick}>
    <h3 className="text-lg font-medium text-gray-900 truncate">{title}</h3>
    <p className="mt-1 text-sm text-gray-500">{listsCount} lists</p>
  </Card>
);

const EmptyState: React.FC<{ onCreateClick: () => void }> = ({ onCreateClick }) => (
  <div className="text-center py-12">
    <h3 className="mt-2 text-sm font-medium text-gray-900">No boards</h3>
    <p className="mt-1 text-sm text-gray-500">
      Get started by creating a new board
    </p>
    <div className="mt-6">
      <Button onClick={onCreateClick} variant="primary">
        Create New Board
      </Button>
    </div>
  </div>
);

const CreateBoardForm: React.FC<{
  title: string;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (value: string) => void;
  onCancel: () => void;
}> = ({ title, onSubmit, onChange, onCancel }) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <Input
      type="text"
      value={title}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Enter board title"
      label="Board Title"
      autoFocus
    />
    <div className="flex gap-4">
      <Button type="submit">Create</Button>
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
  const { boards, isLoading } = useSelector((state: RootState) => {
    const boardState = state.board;
    console.log('Full Redux State:', state);
    console.log('Board State:', boardState);
    console.log('Boards Array:', boardState.boards);
    console.log('Is Array?', Array.isArray(boardState.boards));
    console.log('Length:', boardState.boards?.length);
    return boardState;
  });

  useEffect(() => {
    console.log('Fetching boards...');
    dispatch(fetchBoards())
      .unwrap()
      .then(result => {
        console.log('API Response:', result);
        console.log('Current boards in state:', boards);
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
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <PageHeader title="Your Boards" />
          {!isCreating && (
            <Button onClick={() => setIsCreating(true)} className="w-auto">
              Create New Board
            </Button>
          )}
        </div>

        <ErrorMessage message={error} />

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-600">Loading boards...</div>
          </div>
        ) : (
          <>
            {isCreating && (
              <Card className="mb-6">
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