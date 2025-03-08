import api from '../api/axios';
import { Card } from '../store/types';
import { API_ENDPOINTS } from '../config';

interface CreateCardData {
    title: string;
    description?: string;
    position: number;
    list_id: number;
}

interface UpdateCardData {
    title?: string;
    description?: string;
    card_color?: string;
}

export const cardService = {
    async getListCards(listId: number): Promise<Card[]> {
        const response = await api.get<Card[]>(API_ENDPOINTS.CARDS.LIST(listId));
        return response.data;
    },

    async createCard(listId: number, data: CreateCardData): Promise<Card> {
        const response = await api.post<Card>(API_ENDPOINTS.CARDS.CREATE, {
            ...data,
            list_id: listId
        });
        return response.data;
    },

    async updateCard(cardId: number, data: UpdateCardData): Promise<Card> {
        const response = await api.put<Card>(API_ENDPOINTS.CARDS.UPDATE(cardId), data);
        return response.data;
    },

    async deleteCard(cardId: number): Promise<void> {
        await api.delete(API_ENDPOINTS.CARDS.DELETE(cardId));
    },

    async moveCard(cardId: number, targetListId: number, newPosition: number): Promise<Card> {
        const response = await api.post<Card>(
            API_ENDPOINTS.CARDS.MOVE(cardId),
            {
                target_list_id: targetListId,
                new_position: newPosition
            }
        );
        return response.data;
    }
}; 