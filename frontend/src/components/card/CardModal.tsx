import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, ErrorMessage } from '../ui';
import { Card, BoardList, BoardShare, Comment } from '../../store/types';
import { cardService } from '../../services/card.service';
import { boardService } from '../../services/board.service';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBoard, setCurrentBoard } from '../../store/board.slice';
import { AppDispatch, RootState } from '../../store';

// Card color presets that match commonly used tailwind colors
const CARD_COLORS = [
  { value: '', label: 'Default', color: '#ffffff' },
  { value: '#ef4444', label: 'Red', color: '#ef4444' },        // red-500
  { value: '#3b82f6', label: 'Blue', color: '#3b82f6' },       // blue-500
  { value: '#10b981', label: 'Green', color: '#10b981' },      // emerald-500
  { value: '#f59e0b', label: 'Yellow', color: '#f59e0b' },     // amber-500
  { value: '#8b5cf6', label: 'Purple', color: '#8b5cf6' },     // violet-500
  { value: '#ec4899', label: 'Pink', color: '#ec4899' },       // pink-500
];

interface CardModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: Card | null;
  onSave: (updatedCard: Partial<Card>) => Promise<void>;
  listTitle: string;
  boardId: number;
  boardTitle: string;
}

const CardModal: React.FC<CardModalProps> = ({ isOpen, onClose, card, onSave, listTitle, boardId, boardTitle }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<number | null>(null);
  const [boardUsers, setBoardUsers] = useState<BoardShare[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const currentBoard = useSelector((state: RootState) => state.board.currentBoard);
  const currentUser = useSelector((state: RootState) => state.auth.user);

  // Get all available lists from the current board
  const availableLists = currentBoard?.lists || [];

  // Reset form when card changes or modal opens
  useEffect(() => {
    if (card) {
      setTitle(card.title || '');
      setDescription(card.description || '');
      setSelectedColor(card.card_color || '');
      setSelectedListId(card.list_id);
      setSelectedAssigneeId(card.assignee_id || null);
    }
  }, [card, isOpen]);

  // Load users who have access to the board
  useEffect(() => {
    if (isOpen && boardId) {
      loadBoardUsers();
    }
  }, [isOpen, boardId]);

  // Load comments when card changes
  useEffect(() => {
    if (card && isOpen) {
      // If comments are already loaded from the card object, use them
      if (card.comments && card.comments.length > 0) {
        setComments(card.comments);
      } else {
        // Otherwise fetch them from the API
        const fetchComments = async () => {
          try {
            const commentsData = await cardService.getCardComments(card.id);
            setComments(commentsData);
          } catch (error) {
            console.error('Error loading comments:', error);
          }
        };
        fetchComments();
      }
    }
  }, [card, isOpen]);

  const loadBoardUsers = async () => {
    setLoadingUsers(true);
    try {
      const shares = await boardService.getBoardShares(boardId);

      // Check if we have a valid response with users
      if (!shares || shares.length === 0) {
        // If the current user is available and current board is loaded, at least include them
        if (currentUser && currentBoard) {
          // Include owner separately if available
          const usersToInclude = [];

          // Add the board owner if available
          if (currentBoard.owner && currentBoard.owner.id) {
            usersToInclude.push({
              id: -1, // Temporary ID for fallback
              user: currentBoard.owner,
              access_type: "owner",
              board_id: boardId
            });
          }

          // Add current user if they're not the owner
          if (currentUser.id !== (currentBoard.owner?.id || null)) {
            usersToInclude.push({
              id: -2, // Temporary ID for fallback
              user: currentUser,
              access_type: "viewer", // Default to viewer when API fails
              board_id: boardId
            });
          }

          setBoardUsers(usersToInclude);
        }
      } else {
        // Normal case - API returned valid users
        setBoardUsers(shares);
      }
    } catch (error) {
      console.error('Error loading board users:', error);

      // Try to load from localStorage as fallback
      try {
        if (currentUser && currentBoard?.owner) {
          // Minimal fallback with just owner and current user
          const fallbackUsers = [];

          // Add owner
          if (currentBoard.owner) {
            fallbackUsers.push({
              id: -1, // Temporary ID for fallback
              user: currentBoard.owner,
              access_type: "owner",
              board_id: boardId
            });
          }

          // Add current user if not owner
          if (currentUser.id !== currentBoard.owner?.id) {
            fallbackUsers.push({
              id: -2, // Temporary ID for fallback
              user: currentUser,
              access_type: "viewer",
              board_id: boardId
            });
          }

          console.log("Using minimal fallback users:", fallbackUsers);
          setBoardUsers(fallbackUsers);
        }
      } catch (localErr) {
        console.error("Failed to load cached board shares:", localErr);
      }
    } finally {
      setLoadingUsers(false);
    }
  };

  // Refetch board shares whenever current board changes (if it has updated users)
  useEffect(() => {
    if (isOpen && boardId && currentBoard) {
      loadBoardUsers();
    }
  }, [isOpen, currentBoard, boardId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title cannot be empty');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const updatedCard = {
        title: title.trim(),
        description: description.trim() || undefined,
        card_color: selectedColor,
        list_id: selectedListId || card?.list_id, // Include changed list_id if it was modified
        assignee_id: selectedAssigneeId === null ? undefined : selectedAssigneeId, // Convert null to undefined for API compatibility
      };

      console.log('Saving card with data:', JSON.stringify(updatedCard, null, 2));
      console.log('Selected assignee ID:', selectedAssigneeId);

      // First save to backend
      await onSave(updatedCard);

      // After successful save, update the current board immediately
      if (card && currentBoard) {
        // For debugging, log the card before update
        console.log('Current card before update:', card);

        const oldListId = card.list_id;
        const newListId = selectedListId || oldListId;
        const isMovingLists = oldListId !== newListId;

        let updatedBoard;

        if (isMovingLists) {
          // If the card is moving to a different list
          updatedBoard = {
            ...currentBoard,
            lists: currentBoard.lists.map((list: BoardList) => {
              if (list.id === oldListId) {
                // Remove card from old list
                return {
                  ...list,
                  cards: list.cards.filter((c: Card) => c.id !== card.id)
                };
              }
              if (list.id === newListId) {
                // Add card to new list
                const updatedCardObj = {
                  ...card,
                  title: updatedCard.title,
                  description: updatedCard.description,
                  card_color: updatedCard.card_color,
                  list_id: newListId,
                  position: list.cards.length, // Add to the end of the list
                  assignee_id: selectedAssigneeId,
                  assignee: selectedAssigneeId ? boardUsers.find((u: BoardShare) => u.user.id === selectedAssigneeId)?.user : undefined,
                };

                return {
                  ...list,
                  cards: [...list.cards, updatedCardObj]
                };
              }
              return list;
            })
          };
        } else {
          // If the card is just being updated without changing lists
          updatedBoard = {
            ...currentBoard,
            lists: currentBoard.lists.map((list: BoardList) => {
              if (list.id === card.list_id) {
                return {
                  ...list,
                  cards: list.cards.map((c: Card) => {
                    if (c.id === card.id) {
                      const updatedCardObj = {
                        ...c,
                        title: updatedCard.title,
                        description: updatedCard.description,
                        card_color: updatedCard.card_color,
                        assignee_id: selectedAssigneeId,
                        assignee: selectedAssigneeId ? boardUsers.find((u: BoardShare) => u.user.id === selectedAssigneeId)?.user : undefined,
                      };
                      console.log('Updated card object:', updatedCardObj);
                      return updatedCardObj;
                    }
                    return c;
                  }),
                };
              }
              return list;
            }),
          };
        }

        console.log('Dispatching updated board to Redux');
        dispatch(setCurrentBoard(updatedBoard));

        // Fetch the board again to ensure we have the latest data
        setTimeout(() => {
          dispatch(fetchBoard(currentBoard.id));
        }, 300);
      }

      onClose();
    } catch (err) {
      setError('Error saving card');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      if (!card) return;

      const createdComment = await cardService.createComment(card.id, newComment.trim());
      setComments([...comments, createdComment]);
      setNewComment('');
    } catch (error) {
      console.error('Error creating comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!card) return;

    try {
      await cardService.deleteComment(card.id, commentId);
      setComments(comments.filter((comment: Comment) => comment.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  // Generate prefix from board title
  const generateBoardPrefix = (boardTitle: string): string => {
    if (!boardTitle) return 'TA';

    const words = boardTitle.match(/\b\w/g);
    if (!words || words.length === 0) return 'TA';

    return words.join('').toUpperCase();
  };

  // Delete card function
  const handleDeleteCard = async () => {
    if (isDeleting || !card || !currentBoard) return;

    try {
      setIsDeleting(true);
      await cardService.deleteCard(card.id);

      // Create a new board object with the card removed
      const updatedBoard = {
        ...currentBoard,
        lists: currentBoard.lists.map((list: BoardList) => {
          if (list.id === card.list_id) {
            return {
              ...list,
              cards: list.cards.filter((c: Card) => c.id !== card.id)
            };
          }
          return list;
        })
      };

      // Update Redux state with the modified board
      dispatch(setCurrentBoard(updatedBoard));
      onClose();
    } catch (error) {
      console.error('Failed to delete card:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Add a new function to handle keyboard input
  const handleCommentKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && newComment.trim()) {
      e.preventDefault();
      handleCommentSubmit(e as any);
    }
  };

  if (!card) return null;

  // Use the formatted_id from backend or generate if not available
  const cardPrefix = generateBoardPrefix(boardTitle);
  const cardNumber = card.formatted_id || `${cardPrefix}-${card.card_id}`;

  const formattedCreatedDate = card.created_at
    ? new Date(card.created_at).toLocaleDateString('en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : undefined;

  // Find the current list name
  const currentListName = availableLists.find(list => list.id === selectedListId)?.title || listTitle;

  // Find the assignee user object
  const assigneeUser = selectedAssigneeId ?
    boardUsers.find((share: BoardShare) => share.user.id === selectedAssigneeId)?.user :
    undefined;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="large">
      <div className="relative">
        {/* Enhanced header section with gradient */}
        <div className="bg-gradient-to-r from-indigo-50 via-indigo-100 to-indigo-50 -mx-6 -mt-2 mb-6 p-6 border-b border-indigo-100 rounded-t-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Card identifier with icon */}
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white p-2 rounded-md mr-3 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-0.5">Card Reference</div>
                <div className="flex space-x-2 items-center">
                  <span className="text-lg font-bold text-indigo-700">
                    {cardNumber}
                  </span>

                  {/* List selector as a badge */}
                  <div className="relative inline-block">
                    <select
                      value={selectedListId || ''}
                      onChange={(e) => setSelectedListId(Number(e.target.value))}
                      className="appearance-none pl-3 pr-8 py-1 bg-blue-100 text-blue-800 font-medium rounded-md text-sm cursor-pointer border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {availableLists.map((list) => (
                        <option key={list.id} value={list.id}>
                          {list.title}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-blue-700">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card metadata in header */}
            <div className="flex flex-wrap gap-3">
              {/* Created date badge */}
              {formattedCreatedDate && (
                <div className="flex items-center px-3 py-1.5 bg-white rounded-md border border-indigo-100 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-600">{formattedCreatedDate}</span>
                </div>
              )}

              {/* Delete button in header */}
              <button
                onClick={handleDeleteCard}
                disabled={isDeleting}
                className="px-3 py-1.5 text-sm rounded-md border border-red-200 bg-white text-red-600 hover:bg-red-50 transition-colors duration-200 flex items-center shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-6">
          {/* Left column - Main content */}
          <div className="md:w-2/3">
            {/* Title input */}
            <div className="mb-5">
              <Input
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="font-medium text-gray-900"
              />
            </div>

            {/* Description textarea */}
            <div className="mb-5">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent max-h-[300px] overflow-y-auto resize-none"
                rows={6}
                placeholder="Add a more detailed description..."
              />
            </div>

            {/* Comments Section - Moved here */}
            <div className="mt-6 border-t pt-5 border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 flex items-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                Comments
              </h3>

              {/* Comment input with avatar */}
              <div className="mb-4">
                <div className="flex items-start">
                  {currentUser && (
                    <div className="flex-shrink-0 mr-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium">
                        {currentUser.username?.substring(0, 1).toUpperCase()}
                      </div>
                    </div>
                  )}
                  <div className="flex-grow relative">
                    <Input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={handleCommentKeyDown}
                      placeholder="Write a comment..."
                      className="w-full pr-20"
                    />
                    <Button
                      type="button"
                      onClick={handleCommentSubmit}
                      className="absolute right-1 top-1 py-1 px-3 text-sm"
                      disabled={submittingComment || !newComment.trim()}
                    >
                      {submittingComment ? (
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : 'Add'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Comments list with better styling */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {comments.length === 0 ? (
                  <div className="text-center py-5 bg-gray-50 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    <p className="text-gray-500 text-sm">No comments yet</p>
                    <p className="text-gray-400 text-xs mt-1">Be the first to add a comment!</p>
                  </div>
                ) : (
                  comments.map((comment: Comment) => (
                    <div key={comment.id} className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                      <div className="flex">
                        {/* User avatar */}
                        <div className="flex-shrink-0 mr-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium">
                            {comment.user?.username?.substring(0, 1).toUpperCase() || '?'}
                          </div>
                        </div>

                        {/* Comment content */}
                        <div className="flex-1 min-w-0">
                          {/* Comment header with username and time */}
                          <div className="flex justify-between items-start mb-1">
                            <div className="font-medium text-sm text-gray-900 truncate">
                              {comment.user?.username || 'Unknown user'}
                            </div>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              <span className="text-xs text-gray-500">
                                {new Date(comment.created_at).toLocaleString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>

                              {/* Delete button */}
                              {(comment.user_id === currentUser?.id || currentBoard?.owner_id === currentUser?.id) && (
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="text-gray-400 hover:text-red-500 transition-colors"
                                  title="Delete comment"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Comment text */}
                          <div className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                            {comment.text}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right column - Properties and metadata */}
          <div className="md:w-1/3 bg-gray-50 p-4 rounded-lg border border-gray-100">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Card Properties</h3>

            {/* Assignee selector */}
            <div className="mb-5">
              <label className="block mb-2 text-sm font-medium text-gray-700 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Assignee
              </label>
              <div className="bg-white p-3 rounded-md border border-gray-200 shadow-sm">
                {loadingUsers ? (
                  <div className="text-sm text-gray-500 flex items-center justify-center py-2">
                    <svg className="animate-spin h-4 w-4 mr-2 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading users...
                  </div>
                ) : (
                  <>
                    <div className="text-xs text-gray-500 mb-2 flex justify-between">
                      <span>Available users: {boardUsers.length > 0 ? boardUsers.length : 'None found'}</span>
                      {boardUsers.length === 0 && (
                        <button
                          type="button"
                          onClick={loadBoardUsers}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          Reload
                        </button>
                      )}
                    </div>
                    <select
                      value={selectedAssigneeId || ''}
                      onChange={(e) => setSelectedAssigneeId(e.target.value ? Number(e.target.value) : null)}
                      className="w-full bg-white px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-700 appearance-none"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: 'right 0.5rem center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '1.5em 1.5em',
                        paddingRight: '2.5rem'
                      }}
                    >
                      <option value="">Not assigned</option>

                      {/* Board owner */}
                      {currentBoard?.owner && (
                        <option
                          value={currentBoard.owner.id}
                          style={{fontWeight: 'bold'}}
                        >
                          {currentBoard.owner.username} (Owner)
                        </option>
                      )}

                      {/* Current user if not owner */}
                      {currentUser && currentBoard?.owner?.id !== currentUser.id && (
                        <option value={currentUser.id}>
                          {currentUser.username} (You)
                        </option>
                      )}

                      {/* All shared users */}
                      {boardUsers.length > 0 && (
                        <optgroup label="Shared users">
                          {boardUsers.map((share: BoardShare) => {
                            // Skip owner and current user as they're already included above
                            const isOwner = currentBoard?.owner && share.user.id === currentBoard.owner.id;
                            const isCurrentUser = currentUser && share.user.id === currentUser.id;

                            if (isOwner || isCurrentUser) {
                              return null;
                            }

                            return (
                              <option key={share.user.id} value={share.user.id}>
                                {share.user.username} ({share.access_type})
                              </option>
                            );
                          })}
                        </optgroup>
                      )}
                    </select>
                  </>
                )}

                {/* Display selected assignee information */}
                {assigneeUser && (
                  <div className="mt-2 pt-2 border-t border-gray-100 flex items-center">
                    <div className="bg-indigo-100 text-indigo-800 rounded-full w-8 h-8 flex items-center justify-center mr-2">
                      {assigneeUser.username.substring(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium">{assigneeUser.username}</div>
                      <div className="text-xs text-gray-500">{assigneeUser.email}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Color selector */}
            <div className="mb-5">
              <label className="block mb-2 text-sm font-medium text-gray-700 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                Card Color
              </label>
              <div className="flex flex-wrap gap-2 bg-white p-3 rounded-md border border-gray-100">
                {CARD_COLORS.map((colorOption) => (
                  <div
                    key={colorOption.value}
                    className={`w-8 h-8 rounded-md cursor-pointer border shadow-sm transform transition-transform duration-200 ${
                      selectedColor === colorOption.value ? 'ring-2 ring-indigo-500 scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: colorOption.color }}
                    onClick={() => setSelectedColor(colorOption.value)}
                    title={colorOption.label}
                  />
                ))}
              </div>
            </div>

            {/* Additional information section */}
            <div className="mb-5">
              <label className="block mb-2 text-sm font-medium text-gray-700">Location</label>
              <div className="bg-white p-3 rounded-md border border-gray-100 text-sm">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <div>
                    <div className="text-gray-500 text-xs">Board</div>
                    <div className="font-medium">{boardTitle}</div>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-100 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  <div>
                    <div className="text-gray-500 text-xs">List</div>
                    <div className="font-medium">{currentListName}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        {error && <ErrorMessage message={error} />}

        {/* Action buttons - leave this outside the form and after it */}
        <div className="flex justify-end space-x-3 pt-3 mt-3 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            isLoading={submitting}
            className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CardModal;
