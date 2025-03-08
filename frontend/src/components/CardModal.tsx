import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, ErrorMessage } from './ui';
import { Card } from '../store/types';

// Список предустановленных цветов для карточек
const cardColors = [
  { name: 'Blue', value: 'from-blue-400 to-indigo-500' },
  { name: 'Green', value: 'from-green-400 to-emerald-500' },
  { name: 'Purple', value: 'from-purple-400 to-violet-500' },
  { name: 'Red', value: 'from-red-400 to-pink-500' },
  { name: 'Orange', value: 'from-orange-400 to-amber-500' },
  { name: 'Teal', value: 'from-teal-400 to-cyan-500' },
];

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
  const [selectedColor, setSelectedColor] = useState('');

  // Reset form when card changes or modal opens
  useEffect(() => {
    if (card) {
      setTitle(card.title || '');
      setDescription(card.description || '');
      setSelectedColor(card.card_color || cardColors[0].value);
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
        card_color: selectedColor
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
  
  // Форматируем дату создания, если она есть
  const formattedCreatedDate = card.created_at 
    ? new Date(card.created_at).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit'
      })
    : 'Неизвестно';

  // Используем цвет карточки или дефолтный
  const cardColor = card.card_color || cardColors[0].value;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={isEditing ? "Edit Card" : card.title}
      size="medium"
    >
      <div className="pb-2 relative overflow-hidden">
        {/* Декоративный фоновый элемент */}
        <div className="absolute top-0 right-0 w-full h-64 opacity-5 pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-indigo-600">
            <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625zM7.5 15a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 017.5 15zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H8.25z" clipRule="evenodd" />
            <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" />
          </svg>
        </div>

        {!isEditing && (
          <div className="flex items-center space-x-2 mb-4 relative">
            <div className="inline-flex items-center whitespace-nowrap h-8 px-3 rounded-md text-sm font-medium bg-blue-100 text-blue-800 font-mono">
              {taskNumber}
            </div>
            <div className="inline-flex items-center whitespace-nowrap h-8 px-3 rounded-md text-sm font-medium bg-indigo-50 text-indigo-700">
              {listTitle}
            </div>
            <div className={`ml-auto h-6 w-6 rounded-full bg-gradient-to-r ${cardColor}`}></div>
          </div>
        )}
        
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-5 relative">
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
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Card Color
              </label>
              <div className="grid grid-cols-6 gap-2">
                {cardColors.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`h-8 rounded-md cursor-pointer bg-gradient-to-r ${color.value} flex items-center justify-center ${
                      selectedColor === color.value ? 'ring-2 ring-indigo-500 ring-offset-2' : 'hover:opacity-90'
                    }`}
                    onClick={() => setSelectedColor(color.value)}
                  >
                    {selectedColor === color.value && (
                      <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
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
          <div className="text-gray-700 relative">
            <Button 
              onClick={() => setIsEditing(true)}
              className="text-sm w-full py-2 mb-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
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
                <h3 className="text-sm uppercase tracking-wide font-semibold text-gray-500 mb-3 flex items-center">
                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  Description
                </h3>
                {card.description ? (
                  <div className="p-4 bg-gradient-to-br from-white to-gray-50 rounded-lg border border-gray-100 shadow-sm">
                    <p className="text-gray-700 whitespace-pre-line leading-relaxed">{card.description}</p>
                  </div>
                ) : (
                  <div className="p-4 bg-gradient-to-b from-white to-gray-50 rounded-lg border border-dashed border-gray-200 text-center">
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
              
              <div className="mb-6">
                <h3 className="text-sm uppercase tracking-wide font-semibold text-gray-500 mb-3 flex items-center">
                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Информация
                </h3>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100 p-4 shadow-sm">
                  <dl className="grid grid-cols-1 gap-3 text-sm">
                    <div>
                      <dt className="text-xs font-medium text-gray-500 mb-1">Создано</dt>
                      <dd className="text-gray-700 flex items-center">
                        <svg className="h-3 w-3 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formattedCreatedDate}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-gray-500 mb-1">Цвет карточки</dt>
                      <dd className="text-gray-700 flex items-center">
                        <div className={`h-4 w-12 rounded bg-gradient-to-r ${cardColor}`}></div>
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CardModal; 