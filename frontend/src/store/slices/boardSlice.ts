import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Board, BoardState } from '../types';

const initialState: BoardState = {
  boards: [],
  currentBoard: null,
  isLoading: false,
  error: null,
};

const boardSlice = createSlice({
  name: 'board',
  initialState,
  reducers: {
    setBoards: (state, action: PayloadAction<Board[]>) => {
      state.boards = action.payload;
    },
    setCurrentBoard: (state, action: PayloadAction<Board>) => {
      state.currentBoard = action.payload;
    },
    addBoard: (state, action: PayloadAction<Board>) => {
      state.boards.push(action.payload);
    },
    updateBoard: (state, action: PayloadAction<Board>) => {
      const index = state.boards.findIndex((board) => board.id === action.payload.id);
      if (index !== -1) {
        state.boards[index] = action.payload;
      }
      if (state.currentBoard?.id === action.payload.id) {
        state.currentBoard = action.payload;
      }
    },
    deleteBoard: (state, action: PayloadAction<number>) => {
      state.boards = state.boards.filter((board) => board.id !== action.payload);
      if (state.currentBoard?.id === action.payload) {
        state.currentBoard = null;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setBoards,
  setCurrentBoard,
  addBoard,
  updateBoard,
  deleteBoard,
  setLoading,
  setError,
} = boardSlice.actions;

export default boardSlice.reducer;
