import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { createCard } from '../../store/board.slice';
import { AppDispatch } from '../../store';

interface CreateCardFormProps {
    listId: number;
    position: number;
}

const CreateCardForm: React.FC<CreateCardFormProps> = ({ listId, position }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const dispatch = useDispatch<AppDispatch>();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await dispatch(createCard({
                title,
                description,
                list_id: listId,
                position
            })).unwrap();
            setTitle('');
            setDescription('');
            setIsOpen(false);
        } catch (err) {
            console.error('Error creating card:', err);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="w-full text-left px-3 py-2 text-gray-600 hover:bg-gray-200 rounded-md focus:outline-none"
            >
                + Add a card
            </button>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter card title"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
                autoFocus
            />
            <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
            />
            <div className="flex justify-end space-x-2">
                <button
                    type="button"
                    onClick={() => {
                        setTitle('');
                        setDescription('');
                        setIsOpen(false);
                    }}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 focus:outline-none"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-3 py-1.5 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                    Add Card
                </button>
            </div>
        </form>
    );
};

export default CreateCardForm;
