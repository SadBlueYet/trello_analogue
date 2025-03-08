import React, { useState } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { Card as CardType } from '../../store/types';
import { cardService } from '../../services/card.service';

interface CardProps {
    card: CardType;
    index: number;
    listId: number;
    onCardUpdate?: () => void;  // Добавляем колбэк для обновления списка
}

const Card: React.FC<CardProps> = ({ card, index, listId, onCardUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(card.title);
    const [description, setDescription] = useState(card.description || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleUpdate = async () => {
        if (title !== card.title || description !== card.description) {
            try {
                setIsSubmitting(true);
                await cardService.updateCard(card.id, { 
                    title, 
                    description: description || undefined 
                });
                // Уведомляем родительский компонент об изменении
                if (onCardUpdate) {
                    onCardUpdate();
                }
            } catch (err) {
                console.error('Failed to update card:', err);
                setTitle(card.title);
                setDescription(card.description || '');
            } finally {
                setIsSubmitting(false);
            }
        }
        setIsEditing(false);
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this card?')) {
            try {
                setIsSubmitting(true);
                await cardService.deleteCard(card.id);
                // Уведомляем родительский компонент об изменении
                if (onCardUpdate) {
                    onCardUpdate();
                }
            } catch (err) {
                console.error('Failed to delete card:', err);
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    return (
        <Draggable draggableId={String(card.id)} index={index}>
            {(provided) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className="bg-white rounded-md shadow p-3 hover:shadow-md transition-shadow duration-200"
                >
                    {isEditing ? (
                        <div className="space-y-2">
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Enter title"
                                autoFocus
                            />
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Enter description (optional)"
                                rows={3}
                            />
                            <div className="flex justify-end space-x-2">
                                <button
                                    onClick={() => {
                                        setTitle(card.title);
                                        setDescription(card.description || '');
                                        setIsEditing(false);
                                    }}
                                    className="px-2 py-1 text-sm text-gray-600 hover:text-gray-900"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdate}
                                    className="px-2 py-1 text-sm text-white bg-indigo-600 rounded hover:bg-indigo-700 disabled:bg-indigo-300"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div onClick={() => setIsEditing(true)}>
                            <h4 className="font-medium text-gray-900">{card.title}</h4>
                            {card.description && (
                                <p className="mt-1 text-sm text-gray-600">{card.description}</p>
                            )}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete();
                                }}
                                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 focus:outline-none"
                                disabled={isSubmitting}
                            >
                                <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
            )}
        </Draggable>
    );
};

export default Card; 