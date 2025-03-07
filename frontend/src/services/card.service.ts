import api from '../api/axios';
import { Card } from '../store/types';

interface CreateCardData {
    title: string;
    description?: string;
    list_id: number;
    position: number;
}

interface UpdateCardData {
    title?: string;
    description?: string;
    position?: number;
}

interface MoveCardData {
    target_list_id: number;
    new_position: number;
}

export const cardService = {
    async getCard(id: number): Promise<Card> {
        const response = await api.get<Card>(`/cards/${id}`);
        return response.data;
    },

    async createCard(data: CreateCardData): Promise<Card> {
        const response = await api.post<Card>('/cards/', data);
        return response.data;
    },

    async updateCard(id: number, data: UpdateCardData): Promise<Card> {
        const response = await api.put<Card>(`/cards/${id}`, data);
        return response.data;
    },

    async deleteCard(id: number): Promise<void> {
        await api.delete(`/cards/${id}`);
    },

    async moveCard(id: number, data: MoveCardData): Promise<Card> {
        const response = await api.post<Card>(`/cards/${id}/move`, data);
        return response.data;
    }
}; 