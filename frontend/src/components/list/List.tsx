import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Draggable, Droppable } from 'react-beautiful-dnd';
import { BoardList, Card } from '../../store/types';
import { updateList, deleteList } from '../../store/board.slice';
import { AppDispatch } from '../../store/store';
import CardComponent from '../card/Card';
import CreateCardForm from '../card/CreateCardForm';

interface ListProps {
    list: BoardList;
    index: number;
}

const List: React.FC<ListProps> = ({ list, index }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(list.title);
    const dispatch = useDispatch<AppDispatch>();

    const handleUpdateTitle = async () => {
        if (title !== list.title) {
            try {
                await dispatch(updateList({ id: list.id, data: { title } })).unwrap();
            } catch (err) {
                setTitle(list.title);
            }
        }
        setIsEditing(false);
    };

    const handleDeleteList = async () => {
        if (window.confirm('Are you sure you want to delete this list?')) {
            try {
                await dispatch(deleteList(list.id)).unwrap();
            } catch (err) {
                // Error is handled by the board slice
            }
        }
    };

    return (
        <Draggable draggableId={`list-${list.id}`} index={index}>
            {(provided) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className="bg-gray-100 rounded-lg p-4 w-80 flex flex-col max-h-full"
                >
                    <div
                        {...provided.dragHandleProps}
                        className="flex items-center justify-between mb-4"
                    >
                        {isEditing ? (
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onBlur={handleUpdateTitle}
                                onKeyPress={(e) => e.key === 'Enter' && handleUpdateTitle()}
                                className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                autoFocus
                            />
                        ) : (
                            <h3
                                className="text-lg font-semibold text-gray-900 cursor-pointer"
                                onClick={() => setIsEditing(true)}
                            >
                                {list.title}
                            </h3>
                        )}
                        <button
                            onClick={handleDeleteList}
                            className="text-gray-500 hover:text-red-500 focus:outline-none"
                        >
                            <svg
                                className="h-5 w-5"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>

                    <Droppable droppableId={`list-${list.id}`} type="card">
                        {(provided) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className="flex-grow overflow-y-auto space-y-2"
                            >
                                {list.cards.map((card: Card, index: number) => (
                                    <CardComponent
                                        key={card.id}
                                        card={card}
                                        index={index}
                                        listId={list.id}
                                    />
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>

                    <div className="mt-4">
                        <CreateCardForm listId={list.id} position={list.cards.length} />
                    </div>
                </div>
            )}
        </Draggable>
    );
};

export default List; 