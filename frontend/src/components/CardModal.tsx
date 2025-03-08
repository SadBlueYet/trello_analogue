import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, ErrorMessage } from './ui';
import { Card } from '../store/types';

interface CardModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: Card | null;
  onSave: (updatedCard: Partial<Card>) => Promise<void>;
  listTitle: string;
}

const CardModal: React.FC<CardModalProps> = ({ isOpen, onClose, card, onSave, listTitle }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Reset form when card changes or modal opens
  useEffect(() => {
    if (card) {
      setTitle(card.title || '');
      setDescription(card.description || '');
      setIsEditing(false);
    }
  }, [card, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    
    if (!card) return;
    
    setIsSubmitting(true);
    setError('');
    
    try {
      await onSave({
        id: card.id,
        title: title.trim(),
        description: description.trim() || undefined,
      });
      
      setIsEditing(false);
    } catch (err: any) {
      console.error('Failed to update card:', err);
      setError(err.message || 'Failed to update card');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!card) return null;

  const taskNumber = card.task_number || `TA-${String(card.id).padStart(3, '0')}`;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={isEditing ? "Edit Card" : card.title}
      size="medium"
    >
      <div className="pb-2">
        {!isEditing && (
          <div className="flex items-center space-x-2 mb-4">
            <div className="inline-flex items-center whitespace-nowrap h-8 px-3 rounded-md text-sm font-medium bg-blue-100 text-blue-800 font-mono">
              {taskNumber}
            </div>
            <div className="inline-flex items-center whitespace-nowrap h-8 px-3 rounded-md text-sm font-medium bg-indigo-50 text-indigo-700">
              {listTitle}
            </div>
          </div>
        )}
        
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <ErrorMessage message={error} />}
            
            <Input
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter card title"
              className="text-base font-medium"
              required
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a more detailed description..."
                className="block w-full px-4 py-3 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base transition duration-150 ease-in-out"
                rows={5}
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 mt-6">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsEditing(false)}
                className="px-4"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={isSubmitting}
                className="px-5"
              >
                Save Changes
              </Button>
            </div>
          </form>
        ) : (
          <div className="text-gray-700">
            <Button 
              onClick={() => setIsEditing(true)}
              className="text-sm w-full py-2 mb-4"
            >
              <span className="flex items-center justify-center">
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Edit Card
              </span>
            </Button>
            
            <div className="space-y-5">
              <div className="mb-6">
                <h3 className="text-sm uppercase tracking-wide font-semibold text-gray-500 mb-3">Description</h3>
                {card.description ? (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-gray-700 whitespace-pre-line leading-relaxed">{card.description}</p>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-center">
                    <p className="text-gray-400 italic">No description provided</p>
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      + Add a description
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CardModal; 