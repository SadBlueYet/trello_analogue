// Use window.location.hostname to dynamically determine the API server
// This will allow the frontend to work whether accessed via localhost or IP address
const hostname = import.meta.env.BACKEND_HOSTNAME || window.location.hostname;

// Use same origin to avoid CORS issues with Safari
// This assumes that backend and frontend are served from the same domain (but different ports)
export const API_BASE_URL = `${window.location.protocol}//${hostname}:8000/api/v1`;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `/auth/login`,
    REGISTER: `/auth/register`,
    CURRENT_USER: `/auth/me`,
    REFRESH: `/auth/refresh`,
    LOGOUT: `/auth/logout`,
    ME: `/auth/me`,
    UPDATE_PROFILE: `/auth/update-profile`,
  },
  BOARDS: {
    LIST: `/boards`,
    GET: (id: number) => `/boards/${id}`,
    CREATE: `/boards`,
    UPDATE: (id: number) => `/boards/${id}`,
    DELETE: (id: number) => `/boards/${id}`,
    SHARES: {
      LIST: (boardId: number) => `/boards/${boardId}/share`,
      CREATE: (boardId: number) => `/boards/${boardId}/share`,
      UPDATE: (boardId: number, userId: number) => `/boards/${boardId}/share/${userId}`,
      DELETE: (boardId: number, userId: number) => `/boards/${boardId}/share/${userId}`,
    }
  },
  LISTS: {
    LIST: (boardId: number) => `/lists?board_id=${boardId}`,
    CREATE: `/lists`,
    GET: (id: number) => `/lists/${id}`,
    UPDATE: (id: number) => `/lists/${id}`,
    DELETE: (id: number) => `/lists/${id}`,
    REORDER: (id: number) => `/lists/${id}/reorder`,
  },
  CARDS: {
    LIST: (listId: number) => `/cards?list_id=${listId}`,
    CREATE: `/cards`,
    GET: (id: number) => `/cards/${id}`,
    UPDATE: (id: number) => `/cards/${id}`,
    DELETE: (id: number) => `/cards/${id}`,
    MOVE: (id: number) => `/cards/${id}/move`,
    COMMENTS: {
      LIST: (cardId: number) => `/cards/${cardId}/comments`,
      CREATE: (cardId: number) => `/cards/${cardId}/comments`,
      UPDATE: (cardId: number, commentId: number) => `/cards/${cardId}/comments/${commentId}`,
      DELETE: (cardId: number, commentId: number) => `/cards/${cardId}/comments/${commentId}`,
    }
  },
  USERS: {
    SEARCH: `/users/search`
  }
};
