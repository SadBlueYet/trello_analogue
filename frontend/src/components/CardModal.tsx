import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, ErrorMessage } from './ui';
import { Card, BoardList } from '../store/types';
import { cardService } from '../services/card.service';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBoard, setCurrentBoard } from '../store/board.slice';
import { AppDispatch, RootState } from '../store';

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
  
  const dispatch = useDispatch<AppDispatch>();
  const currentBoard = useSelector((state: RootState) => state.board.currentBoard);
  
  // Get all available lists from the current board
  const availableLists = currentBoard?.lists || [];

  // Reset form when card changes or modal opens
  useEffect(() => {
    if (card) {
      setTitle(card.title || '');
      setDescription(card.description || '');
      setSelectedColor(card.card_color || '');
      setSelectedListId(card.list_id);
    }
  }, [card, isOpen]);

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
      };
      
      console.log('Saving card with color:', selectedColor, 'and list_id:', selectedListId);
      
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
                  position: list.cards.length // Add to the end of the list
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

  if (!card) return null;
  
  // Generate card identifier
  const cardPrefix = generateBoardPrefix(boardTitle);
  const cardNumber = `${cardPrefix}-${card.card_id}`;
  
  const formattedCreatedDate = card.created_at
    ? new Date(card.created_at).toLocaleDateString('en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : undefined;

  // Find the current list name
  const currentListName = availableLists.find(list => list.id === selectedListId)?.title || listTitle;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="medium">
      <div className="relative">
        {/* Enhanced header section with gradient - with less negative margin to avoid overlapping close button */}
        <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50 -mx-6 -mt-2 mb-6 p-6 border-b border-indigo-100 rounded-t-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Card identifier with icon */}
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-2 rounded-md mr-3 shadow-sm">
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

        <form onSubmit={handleSubmit}>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              rows={4}
              placeholder="Add a more detailed description..."
            />
          </div>

          {/* Color selector */}
          <div className="mb-5">
            <label className="block mb-2 text-sm font-medium text-gray-700 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              Card Color
            </label>
            <div className="flex space-x-3 bg-gray-50 p-3 rounded-md border border-gray-100">
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

          {error && <ErrorMessage message={error} />}

          {/* Action buttons */}
          <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              isLoading={submitting}
              className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default CardModal; 