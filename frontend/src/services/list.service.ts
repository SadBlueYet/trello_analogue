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
    list_color?: string;
}

export const listService = {
    async getBoardLists(boardId: number): Promise<BoardList[]> {
        const response = await api.get<BoardList[]>(API_ENDPOINTS.LISTS.LIST(boardId));
        return response.data;
    },

    async createList(boardId: number, data: CreateListData): Promise<BoardList> {
        const response = await api.post<BoardList>(API_ENDPOINTS.LISTS.CREATE, {
            ...data,
            board_id: boardId
        });
        return response.data;
    },

    async updateList(id: number, data: UpdateListData): Promise<BoardList> {
        const response = await api.put<BoardList>(API_ENDPOINTS.LISTS.UPDATE(id), data);
        return response.data;
    },

    async deleteList(id: number): Promise<void> {
        await api.delete(API_ENDPOINTS.LISTS.DELETE(id));
    },

    async reorderList(id: number, newPosition: number): Promise<BoardList> {
        const response = await api.post<BoardList>(
            API_ENDPOINTS.LISTS.REORDER(id),
            { new_position: newPosition }
        );
        return response.data;
    }
}; 