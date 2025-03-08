import api from '../api/axios';
import { User } from '../store/types';
import { API_ENDPOINTS } from '../config';

export const userService = {
    async searchUsers(query: string, limit: number = 10): Promise<User[]> {
        try {
            const response = await api.get<User[]>(
                `${API_ENDPOINTS.USERS.SEARCH}?query=${encodeURIComponent(query)}&limit=${limit}`
            );
            return response.data;
        } catch (error) {
            console.error('Error searching users:', error);
            return [];
        }
    }
}; 