import api from '../api/axios';
import { LoginResponse, RegisterResponse } from '../store/types';
import { API_ENDPOINTS } from '../config';

interface LoginData {
    username: string;
    password: string;
}

interface RegisterData {
    email: string;
    username: string;
    password: string;
    full_name?: string;
}

// Retry function to handle Safari CORS issues
async function retryRequest<T>(requestFn: () => Promise<T>, maxRetries = 1): Promise<T> {
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await requestFn();
        } catch (error) {
            console.log(`Request attempt ${attempt + 1} failed`);
            lastError = error;
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 100));
                console.log('Retrying...');
            }
        }
    }
    throw lastError;
}

export const authService = {
    async login(data: LoginData): Promise<LoginResponse> {
        const formData = new URLSearchParams();
        formData.append('username', data.username);
        formData.append('password', data.password);
        formData.append('grant_type', 'password');
        
        // Use retry for Safari first-request CORS issues
        const response = await retryRequest(async () => {
            return api.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, formData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
        });
        
        return response.data;
    },

    async register(data: RegisterData): Promise<RegisterResponse> {
        // Use retry for Safari first-request CORS issues
        const response = await retryRequest(async () => {
            return api.post<RegisterResponse>(API_ENDPOINTS.AUTH.REGISTER, data);
        });
        
        return response.data;
    },
    
    async logout(): Promise<void> {
        await api.post(API_ENDPOINTS.AUTH.LOGOUT);
    },
    
    async refreshToken(): Promise<LoginResponse> {
        const response = await api.post<LoginResponse>(API_ENDPOINTS.AUTH.REFRESH);
        return response.data;
    }
}; 