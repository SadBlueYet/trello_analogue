import api from '../api/axios';
import { BoardList } from '../store/types';
import { API_ENDPOINTS } from '../config';

interface CreateListData {
    title: string;
    position: number;
    board_id: number;
}

interface UpdateListData {
    title?: string;
    position?: number;
}

export const listService = {
    async getList(id: number): Promise<BoardList> {
        const response = await api.get<any>(`/lists/${id}`);
        return {
            ...response.data,
            cards: response.data.cards || []
        };
    },

    async createList(boardId: number, data: CreateListData): Promise<BoardList> {
        const response = await api.post<any>(API_ENDPOINTS.LISTS.CREATE(boardId), data);
        return {
            ...response.data,
            cards: []
        };
    },

    async updateList(id: number, data: UpdateListData): Promise<BoardList> {
        const response = await api.patch<any>(API_ENDPOINTS.LISTS.UPDATE(id), data);
        return {
            ...response.data,
            cards: response.data.cards || []
        };
    },

    async deleteList(id: number): Promise<void> {
        await api.delete(API_ENDPOINTS.LISTS.DELETE(id));
    },

    async reorderList(id: number, newPosition: number): Promise<BoardList> {
        const response = await api.post<BoardList>(`/lists/${id}/reorder`, {
            new_position: newPosition
        });
        return response.data;
    }
}; 