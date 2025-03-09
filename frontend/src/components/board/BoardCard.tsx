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
            <div className="flex items-center justify-between mb-1.5 bg-black/15 backdrop-blur-sm rounded-md px-2 py-1 border border-white/10 overflow-hidden">
            <span className="text-xs flex items-center font-medium whitespace-nowrap mr-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="truncate max-w-[80px]">{board.created_at}</span>
            </span>
            
            <span className="text-xs flex items-center font-medium whitespace-nowrap ml-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="truncate">{board.lists.length} {board.lists.length === 1 ? 'list' : 'lists'}</span>
            </span>
          </div>
        </div>
    );
};

export default BoardCard; 