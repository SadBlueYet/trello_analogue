import React from 'react';
import { Board } from '../../store/types';

interface BoardCardProps {
    board: Board;
}

const BoardCard: React.FC<BoardCardProps> = ({ board }) => {
    return (
        <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-4 h-32 flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                {board.title}
            </h3>
            {board.description && (
                <p className="text-gray-600 text-sm flex-grow line-clamp-2">
                    {board.description}
                </p>
            )}
            <div className="mt-auto">
                <div className="text-sm text-gray-500">
                    {board.lists.length} {board.lists.length === 1 ? 'list' : 'lists'}
                </div>
            </div>
        </div>
    );
};

export default BoardCard; 