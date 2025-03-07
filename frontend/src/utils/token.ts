const TOKEN_KEY = 'auth_token';
const TOKEN_TYPE_KEY = 'auth_token_type';

export const setToken = (token: string, tokenType: string = 'Bearer'): void => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(TOKEN_TYPE_KEY, tokenType);
};

export const getToken = (): { token: string | null; type: string | null } => {
    return {
        token: localStorage.getItem(TOKEN_KEY),
        type: localStorage.getItem(TOKEN_TYPE_KEY)
    };
};

export const removeToken = (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_TYPE_KEY);
}; 