export const API_BASE_URL = 'http://localhost:8000/api/v1';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    CURRENT_USER: `${API_BASE_URL}/auth/me`,
    REFRESH: `${API_BASE_URL}/auth/refresh`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    ME: `${API_BASE_URL}/auth/me`,
    UPDATE_PROFILE: `${API_BASE_URL}/auth/update-profile`,
  },
  BOARDS: {
    LIST: `${API_BASE_URL}/boards`,
    GET: (id: number) => `${API_BASE_URL}/boards/${id}`,
    CREATE: `${API_BASE_URL}/boards`,
    UPDATE: (id: number) => `${API_BASE_URL}/boards/${id}`,
    DELETE: (id: number) => `${API_BASE_URL}/boards/${id}`,
    SHARES: {
      LIST: (boardId: number) => `${API_BASE_URL}/boards/${boardId}/share`,
      CREATE: (boardId: number) => `${API_BASE_URL}/boards/${boardId}/share`,
      UPDATE: (boardId: number, userId: number) => `${API_BASE_URL}/boards/${boardId}/share/${userId}`,
      DELETE: (boardId: number, userId: number) => `${API_BASE_URL}/boards/${boardId}/share/${userId}`,
    }
  },
  LISTS: {
    LIST: (boardId: number) => `${API_BASE_URL}/lists?board_id=${boardId}`,
    CREATE: `${API_BASE_URL}/lists`,
    GET: (id: number) => `${API_BASE_URL}/lists/${id}`,
    UPDATE: (id: number) => `${API_BASE_URL}/lists/${id}`,
    DELETE: (id: number) => `${API_BASE_URL}/lists/${id}`,
    REORDER: (id: number) => `${API_BASE_URL}/lists/${id}/reorder`,
  },
  CARDS: {
    LIST: (listId: number) => `${API_BASE_URL}/cards?list_id=${listId}`,
    CREATE: `${API_BASE_URL}/cards`,
    GET: (id: number) => `${API_BASE_URL}/cards/${id}`,
    UPDATE: (id: number) => `${API_BASE_URL}/cards/${id}`,
    DELETE: (id: number) => `${API_BASE_URL}/cards/${id}`,
    MOVE: (id: number) => `${API_BASE_URL}/cards/${id}/move`,
  },
  USERS: {
    SEARCH: `${API_BASE_URL}/users/search`
  }
}; 