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
  const dispatch = useDispatch<AppDispatch>();

  // Reset form when card changes or modal opens
  useEffect(() => {
    if (card) {
      setTitle(card.title || '');
      setDescription(card.description || '');
      setSelectedColor(card.card_color || '');
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
      };
      
      console.log('Saving card with color:', selectedColor);
      
      // First save to backend
      await onSave(updatedCard);
      
      // After successful save, update the current board immediately
      if (card && currentBoard) {
        // For debugging, log the card before update
        console.log('Current card before update:', card);
        
        const updatedBoard = {
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

  // Get the current board directly from the store
  const currentBoard = useSelector((state: RootState) => state.board.currentBoard);
  
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="medium">
      <div className="relative">
        {/* Removed blue gradient stripe */}
        
        {/* Card identifier badge */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <span className="bg-indigo-100 text-indigo-800 font-medium px-3 py-1 rounded-md text-sm">
              {cardNumber}
            </span>
          </div>
          
          {/* Delete button */}
          <button
            onClick={handleDeleteCard}
            disabled={isDeleting}
            className="px-3 py-1 text-sm rounded-md border border-red-200 text-red-600 hover:bg-red-50 transition-colors duration-200 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Card metadata */}
          <div className="flex items-center mb-4 text-sm text-gray-500 flex-wrap gap-2">
            {listTitle && (
              <div className="flex items-center px-3 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-md border border-indigo-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>In: <span className="font-medium text-indigo-700">{listTitle}</span></span>
              </div>
            )}
            
            {formattedCreatedDate && (
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Created: {formattedCreatedDate}</span>
              </div>
            )}
          </div>

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
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Card Color
            </label>
            <div className="flex space-x-3">
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