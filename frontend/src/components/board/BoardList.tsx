import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchBoards } from '../../store/board.slice';
import { RootState, AppDispatch } from '../../store/store';
import BoardCard from './BoardCard';
import CreateBoardForm from './CreateBoardForm';

const BoardList: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { boards, isLoading, error } = useSelector((state: RootState) => state.board);

    useEffect(() => {
        dispatch(fetchBoards());
    }, [dispatch]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-600">Loading boards...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-red-500">{error}</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Your Boards</h1>
                <CreateBoardForm />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {boards.map((board) => (
                    <Link key={board.id} to={`/boards/${board.id}`}>
                        <BoardCard board={board} />
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default BoardList;
