import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { clearBoardCache } from '../store/board.slice';
import BoardPage from '../pages/BoardPage';

const BoardWrapper: React.FC = () => {
  const dispatch = useDispatch();
  const { boardId } = useParams<{ boardId: string }>();

  // Очищаем кеш при монтировании компонента или изменении boardId
  useEffect(() => {
    if (boardId) {
      // Сбрасываем кеш для этой доски
      clearBoardCache(parseInt(boardId));
      console.log('Board cache cleared for ID:', boardId);
    }
  }, [boardId]);

  return <BoardPage />;
};

export default BoardWrapper;
