import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { BoardState, Board } from './types';
import { boardService } from '../services/board.service';
import { listService } from '../services/list.service';
import { cardService } from '../services/card.service';

const initialState: BoardState = {
    boards: [],
    currentBoard: null,
    isLoading: false,
    error: null,
    lastBoardFetch: null,
};

// Кэширование запросов доски
let boardsRequestPromise: Promise<Board[]> | null = null;
const boardRequestPromises = new Map<number, Promise<Board>>();
const BOARD_CACHE_TIME = 10000; // 10 секунд - уменьшаем время кеширования для более частого обновления

// Функция для очистки кеша досок
export const clearBoardCache = (boardId?: number) => {
    if (boardId) {
        // Очищаем кеш для конкретной доски
        boardRequestPromises.delete(boardId);
    } else {
        // Очищаем весь кеш
        boardsRequestPromise = null;
        boardRequestPromises.clear();
    }
};

export const fetchBoards = createAsyncThunk(
    'board/fetchBoards',
    async (_, { getState }) => {
        // Используем текущие доски, если они уже загружены
        const state = getState() as { board: BoardState };
        if (state.board.boards.length > 0) {
            return state.board.boards;
        }

        // Повторно используем запрос, если он уже выполняется
        if (boardsRequestPromise) {
            return boardsRequestPromise;
        }

        // Создаем новый запрос и кэшируем его
        boardsRequestPromise = boardService.getBoards()
            .then(boards => {
                // Сбрасываем промис после выполнения
                setTimeout(() => {
                    boardsRequestPromise = null;
                }, 0);
                return boards;
            })
            .catch(error => {
                // Сбрасываем промис после ошибки
                setTimeout(() => {
                    boardsRequestPromise = null;
                }, 0);
                throw error;
            });

        return boardsRequestPromise;
    }
);

export const fetchBoard = createAsyncThunk(
    'board/fetchBoard',
    async (id: number, { getState }) => {
        // Проверяем, есть ли доска уже в state и свежая ли она
        const state = getState() as { board: BoardState };
        const currentBoard = state.board.currentBoard;
        const lastFetch = state.board.lastBoardFetch;
        const now = Date.now();

        // Если доска уже загружена, она та же самая, и прошло меньше BOARD_CACHE_TIME с момента загрузки
        if (currentBoard &&
            currentBoard.id === id &&
            lastFetch &&
            now - lastFetch < BOARD_CACHE_TIME) {
            return currentBoard;
        }

        // Проверяем, есть ли уже запрос для этой доски
        if (boardRequestPromises.has(id)) {
            return boardRequestPromises.get(id)!;
        }

        // Создаем новый запрос
        const boardPromise = boardService.getBoard(id)
            .then(board => {
                // Сбрасываем промис после выполнения
                setTimeout(() => {
                    boardRequestPromises.delete(id);
                }, 0);
                return board;
            })
            .catch(error => {
                // Сбрасываем промис после ошибки
                setTimeout(() => {
                    boardRequestPromises.delete(id);
                }, 0);
                throw error;
            });

        // Сохраняем промис
        boardRequestPromises.set(id, boardPromise);

        return boardPromise;
    }
);

export const createBoard = createAsyncThunk(
    'board/createBoard',
    async (data: { title: string; description?: string; background_color?: string }) => {
        const newBoard = await boardService.createBoard(data);
        // Очищаем кеш досок после создания новой доски
        boardsRequestPromise = null;
        return newBoard;
    }
);

export const updateBoard = createAsyncThunk(
    'board/updateBoard',
    async ({ id, data }: { id: number; data: { title?: string; description?: string; background_color?: string } }) => {
        const updatedBoard = await boardService.updateBoard(id, data);
        // Clear both the specific board cache and the boards list cache
        clearBoardCache();
        return updatedBoard;
    }
);

export const deleteBoard = createAsyncThunk(
    'board/deleteBoard',
    async (id: number) => {
        await boardService.deleteBoard(id);
        // Очищаем кеш досок после удаления
        boardsRequestPromise = null;
        boardRequestPromises.delete(id);
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

export const createList = createAsyncThunk(
    'board/createList',
    async (data: { title: string; board_id: number; position: number }) => {
        const response = await listService.createList(data.board_id, data);
        return response;
    }
);

export const createCard = createAsyncThunk(
    'board/createCard',
    async (data: { title: string; description?: string; position: number; list_id: number }) => {
        const response = await cardService.createCard(data.list_id, data);
        return response;
    }
);

const boardSlice = createSlice({
    name: 'board',
    initialState,
    reducers: {
        clearCurrentBoard: (state) => {
            state.currentBoard = null;
            state.lastBoardFetch = null;
        },
        clearError: (state) => {
            state.error = null;
        },
        setCurrentBoard: (state, action) => {
            state.currentBoard = action.payload;
            state.lastBoardFetch = Date.now();
        },
        clearBoardCacheAction: (state) => {
            // Дополнительная возможность очистки кеша через action
            clearBoardCache();
            state.lastBoardFetch = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Boards
            .addCase(fetchBoards.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchBoards.fulfilled, (state, action) => {
                state.isLoading = false;
                state.boards = action.payload;
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
                state.isLoading = false;
                state.currentBoard = action.payload;
                state.lastBoardFetch = Date.now();
            })
            .addCase(fetchBoard.rejected, (state, action) => {
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
                    // Preserve lists when updating the board in boards array
                    state.boards[index] = {
                        ...action.payload,
                        lists: state.boards[index].lists || []
                    };
                }
                if (state.currentBoard?.id === action.payload.id) {
                    // Preserve lists when updating the current board
                    state.currentBoard = {
                        ...action.payload,
                        lists: state.currentBoard.lists || []
                    };
                    state.lastBoardFetch = Date.now();
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
                    state.lastBoardFetch = null;
                }
            })
            .addCase(deleteBoard.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Failed to delete board';
            })
            // Update List
            .addCase(updateList.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateList.fulfilled, (state, action) => {
                state.isLoading = false;
                const index = state.boards.findIndex(board => board.id === action.payload.id);
                if (index !== -1) {
                    // Preserve lists when updating the board in boards array
                    state.boards[index] = {
                        ...state.boards[index],
                        lists: state.boards[index].lists.map(list =>
                            list.id === action.payload.id ? action.payload : list
                        )
                    };
                }
                if (state.currentBoard?.id === action.payload.id) {
                    // Preserve lists when updating the current board
                    state.currentBoard = {
                        ...state.currentBoard,
                        lists: state.currentBoard.lists.map(list =>
                            list.id === action.payload.id ? action.payload : list
                        )
                    };
                    state.lastBoardFetch = Date.now();
                }
            })
            .addCase(updateList.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Failed to update list';
            })
            // Delete List
            .addCase(deleteList.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(deleteList.fulfilled, (state, action) => {
                state.isLoading = false;
                state.boards = state.boards.map(board => ({
                    ...board,
                    lists: board.lists.filter(list => list.id !== action.payload)
                }));
                if (state.currentBoard) {
                    state.currentBoard = {
                        ...state.currentBoard,
                        lists: state.currentBoard.lists.filter(list => list.id !== action.payload)
                    };
                }
            })
            .addCase(deleteList.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Failed to delete list';
            })
            // Create List
            .addCase(createList.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createList.fulfilled, (state, action) => {
                state.isLoading = false;
                if (state.currentBoard && state.currentBoard.id === action.payload.board_id) {
                    state.currentBoard.lists.push(action.payload);
                }
                // Also update the board in the boards array if exists
                const boardIndex = state.boards.findIndex(b => b.id === action.payload.board_id);
                if (boardIndex !== -1) {
                    if (!state.boards[boardIndex].lists) {
                        state.boards[boardIndex].lists = [];
                    }
                    state.boards[boardIndex].lists.push(action.payload);
                }
            })
            .addCase(createList.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Failed to create list';
            })
            // Create Card
            .addCase(createCard.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createCard.fulfilled, (state, action) => {
                state.isLoading = false;
                if (state.currentBoard) {
                    const list = state.currentBoard.lists.find(list => list.id === action.payload.list_id);
                    if (list) {
                        list.cards.push(action.payload);
                    }
                }
            })
            .addCase(createCard.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Failed to create card';
            });
    },
});

export const { clearCurrentBoard, clearError, setCurrentBoard, clearBoardCacheAction } = boardSlice.actions;
export default boardSlice.reducer;
