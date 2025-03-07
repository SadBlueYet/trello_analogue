import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Draggable } from 'react-beautiful-dnd';
import { Card as CardType } from '../../store/types';
import { updateCard, deleteCard } from '../../store/board.slice';
import { AppDispatch } from '../../store/store';

interface CardProps {
    card: CardType;
    index: number;
    listId: number;
}

const Card: React.FC<CardProps> = ({ card, index, listId }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(card.title);
    const [description, setDescription] = useState(card.description || '');
    const dispatch = useDispatch<AppDispatch>();

    const handleUpdate = async () => {
        if (title !== card.title || description !== card.description) {
            try {
                await dispatch(updateCard({
                    id: card.id,
                    data: { title, description }
                })).unwrap();
            } catch (err) {
                setTitle(card.title);
                setDescription(card.description || '');
            }
        }
        setIsEditing(false);
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this card?')) {
            try {
                await dispatch(deleteCard(card.id)).unwrap();
            } catch (err) {
                // Error is handled by the board slice
            }
        }
    };

    return (
        <Draggable draggableId={`card-${card.id}`} index={index}>
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
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdate}
                                    className="px-2 py-1 text-sm text-white bg-indigo-600 rounded hover:bg-indigo-700"
                                >
                                    Save
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