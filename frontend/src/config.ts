export const API_BASE_URL = 'http://localhost:8000/api/v1';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    CURRENT_USER: `${API_BASE_URL}/auth/me`,
  },
  BOARDS: {
    LIST: `${API_BASE_URL}/boards`,
    GET: (id: number) => `${API_BASE_URL}/boards/${id}`,
    CREATE: `${API_BASE_URL}/boards`,
    UPDATE: (id: number) => `${API_BASE_URL}/boards/${id}`,
    DELETE: (id: number) => `${API_BASE_URL}/boards/${id}`,
  },
  LISTS: {
    CREATE: (boardId: number) => `${API_BASE_URL}/boards/${boardId}/lists`,
    UPDATE: (id: number) => `${API_BASE_URL}/lists/${id}`,
    DELETE: (id: number) => `${API_BASE_URL}/lists/${id}`,
  },
  CARDS: {
    CREATE: (listId: number) => `${API_BASE_URL}/lists/${listId}/cards`,
    UPDATE: (id: number) => `${API_BASE_URL}/cards/${id}`,
    DELETE: (id: number) => `${API_BASE_URL}/cards/${id}`,
  },
}; 