import api from '../api/axios';
import { Board } from '../store/types';
import { API_ENDPOINTS } from '../config';

interface CreateBoardData {
    title: string;
    description?: string;
}

interface UpdateBoardData {
    title?: string;
    description?: string;
}

export const boardService = {
    async getBoards(): Promise<Board[]> {
        try {
            console.log('Fetching boards from:', API_ENDPOINTS.BOARDS.LIST);
            const response = await api.get<any[]>(API_ENDPOINTS.BOARDS.LIST);
            console.log('Raw API response:', response.data);
            
            if (!Array.isArray(response.data)) {
                console.error('API response is not an array:', response.data);
                return [];
            }

            const boards = response.data.map(board => ({
                ...board,
                lists: board.lists || []
            }));
            console.log('Processed boards:', boards);
            return boards;
        } catch (error) {
            console.error('Error in getBoards:', error);
            throw error;
        }
    },

    async getBoard(id: number): Promise<Board> {
        console.log('Getting board with ID:', id);
        const response = await api.get<any>(API_ENDPOINTS.BOARDS.GET(id));
        console.log('Raw board response:', JSON.stringify(response.data, null, 2));
        console.log('Response data type:', typeof response.data);
        console.log('Response data keys:', Object.keys(response.data));
        
        const board = {
            ...response.data,
            lists: Array.isArray(response.data.lists) ? response.data.lists.map((list: any) => ({
                ...list,
                cards: list.cards || []
            })) : []
        };
        
        console.log('Processed board data:', JSON.stringify(board, null, 2));
        return board;
    },

    async createBoard(data: CreateBoardData): Promise<Board> {
        const response = await api.post<any>(API_ENDPOINTS.BOARDS.CREATE, data);
        return {
            ...response.data,
            lists: []
        };
    },

    async updateBoard(id: number, data: UpdateBoardData): Promise<Board> {
        const response = await api.put<any>(API_ENDPOINTS.BOARDS.UPDATE(id), data);
        return {
            ...response.data,
            lists: response.data.lists || []
        };
    },

    async deleteBoard(id: number): Promise<void> {
        await api.delete(API_ENDPOINTS.BOARDS.DELETE(id));
    }
}; 