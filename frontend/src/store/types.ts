export interface User {
    id?: number;
    email?: string;
    username: string;
    full_name?: string;
}

export interface Board {
    id: number;
    title: string;
    description?: string;
    background_color?: string;
    owner_id: number;
    lists: BoardList[];
    shared_with?: BoardShare[];
}

export interface BoardShare {
    id: number;
    access_type: string;
    user: User;
}

export interface BoardList {
    id: number;
    title: string;
    position: number;
    board_id: number;
    cards: Card[];
    list_color?: string;
}

export interface Card {
    id: number;
    title: string;
    description?: string;
    position: number;
    list_id: number;
    task_number?: string;
    created_at?: string;
    updated_at?: string;
    card_color?: string;
}

export interface AuthState {
    user: User | null;
    isLoading: boolean;
    error: string | null;
    isAuthenticated?: boolean;
    lastAuthCheck: number | null;
}

export interface BoardState {
    boards: Board[];
    currentBoard: Board | null;
    isLoading: boolean;
    error: string | null;
    lastBoardFetch: number | null;
}

// API response types
export interface LoginResponse {
    access_token: string;
    token_type: string;
    refresh_token?: string;
}

export interface RegisterResponse {
    id: number;
    email: string;
    username: string;
    full_name?: string;
} 