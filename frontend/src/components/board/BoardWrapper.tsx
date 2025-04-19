import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { fetchBoard } from '../../store/board.slice';
import BoardPage from '../../pages/BoardPage';
import { AppDispatch } from '../../store';

const BoardWrapper = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (boardId) {
      dispatch(fetchBoard(parseInt(boardId)));
    }
  }, [dispatch, boardId]);

  return <BoardPage />;
};

export default BoardWrapper;
