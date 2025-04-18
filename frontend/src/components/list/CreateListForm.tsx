import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { createList } from "../../store/board.slice"
import { AppDispatch } from '../../store';

interface CreateListFormProps {
    boardId: number;
    position: number;
}

const CreateListForm: React.FC<CreateListFormProps> = ({ boardId, position }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [title, setTitle] = useState('');
    const dispatch = useDispatch<AppDispatch>();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await dispatch(createList({
                title,
                board_id: boardId,
                position
            })).unwrap();
            setTitle('');
            setIsOpen(false);
        } catch (err) {
            console.error('Error creating list:', err);
        }
    };

    if (!isOpen) {
        return (
            <button onClick={() => setIsOpen(true)} className="w-full text-left px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 focus:outline-none">
                + Add another list
            </button>
        );
    }

    return (
        <div className="bg-gray-100 rounded-lg p-4">
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter list title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                    autoFocus
                />
                <div className="mt-2 flex justify-end space-x-2">
                    <button
                        type="button"
                        onClick={() => {
                            setTitle('');
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
                        Add List
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateListForm;
