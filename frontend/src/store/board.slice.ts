import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { BoardState, Board } from './types';
import { boardService } from '../services/board.service';
import { listService } from '../services/list.service';

const initialState: BoardState = {
    boards: [],
    currentBoard: null,
    isLoading: false,
    error: null,
};

export const fetchBoards = createAsyncThunk(
    'board/fetchBoards',
    async () => {
        return await boardService.getBoards();
    }
);

export const fetchBoard = createAsyncThunk(
    'board/fetchBoard',
    async (id: number) => {
        return await boardService.getBoard(id);
    }
);

export const createBoard = createAsyncThunk(
    'board/createBoard',
    async (data: { title: string; description?: string }) => {
        return await boardService.createBoard(data);
    }
);

export const updateBoard = createAsyncThunk(
    'board/updateBoard',
    async ({ id, data }: { id: number; data: { title?: string; description?: string } }) => {
        return await boardService.updateBoard(id, data);
    }
);

export const deleteBoard = createAsyncThunk(
    'board/deleteBoard',
    async (id: number) => {
        await boardService.deleteBoard(id);
        return id;
    }
);

export const updateList = createAsyncThunk(
    'board/updateList',
    async ({ id, data }: { id: number; data: { title?: string } }) => {
        return await listService.updateList(id, data);
    }
);

export const deleteList = createAsyncThunk(
    'board/deleteList',
    async (id: number) => {
        await listService.deleteList(id);
        return id;
    }
);

const boardSlice = createSlice({
    name: 'board',
    initialState,
    reducers: {
        clearCurrentBoard: (state) => {
            state.currentBoard = null;
        },
        clearError: (state) => {
            state.error = null;
        },
        setCurrentBoard: (state, action) => {
            state.currentBoard = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch Boards
            .addCase(fetchBoards.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchBoards.fulfilled, (state, action) => {
                console.log('Reducer: Setting boards with payload:', action.payload);
                state.isLoading = false;
                state.boards = action.payload;
                console.log('Reducer: New state boards:', state.boards);
            })
            .addCase(fetchBoards.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Failed to fetch boards';
            })
            // Fetch Single Board
            .addCase(fetchBoard.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchBoard.fulfilled, (state, action) => {
                console.log('Board Reducer: Setting current board with payload:', action.payload);
                console.log('Board Reducer: Payload lists:', action.payload.lists);
                state.isLoading = false;
                state.currentBoard = action.payload;
                console.log('Board Reducer: New current board state:', state.currentBoard);
                console.log('Board Reducer: New current board lists:', state.currentBoard?.lists);
            })
            .addCase(fetchBoard.rejected, (state, action) => {
                console.error('Board Reducer: Error fetching board:', action.error);
                state.isLoading = false;
                state.error = action.error.message || 'Failed to fetch board';
            })
            // Create Board
            .addCase(createBoard.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createBoard.fulfilled, (state, action) => {
                state.isLoading = false;
                state.boards.push(action.payload);
            })
            .addCase(createBoard.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Failed to create board';
            })
            // Update Board
            .addCase(updateBoard.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateBoard.fulfilled, (state, action) => {
                state.isLoading = false;
                const index = state.boards.findIndex(board => board.id === action.payload.id);
                if (index !== -1) {
                    state.boards[index] = action.payload;
                }
                if (state.currentBoard?.id === action.payload.id) {
                    state.currentBoard = action.payload;
                }
            })
            .addCase(updateBoard.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Failed to update board';
            })
            // Delete Board
            .addCase(deleteBoard.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(deleteBoard.fulfilled, (state, action) => {
                state.isLoading = false;
                state.boards = state.boards.filter(board => board.id !== action.payload);
                if (state.currentBoard?.id === action.payload) {
                    state.currentBoard = null;
                }
            })
            .addCase(deleteBoard.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Failed to delete board';
            });
    },
});

export const { clearCurrentBoard, clearError, setCurrentBoard } = boardSlice.actions;
export default boardSlice.reducer; 