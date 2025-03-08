import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { AuthState, LoginResponse, RegisterResponse, User } from './types';
import { authService } from '../services/auth.service';
import api from '../api/axios';
import { API_ENDPOINTS } from '../config';

const initialState: AuthState = {
    user: null,
    isLoading: false,
    error: null,
    isAuthenticated: false,
    lastAuthCheck: null,
};

// Кэширование проверки аутентификации
let authCheckPromise: Promise<any> | null = null;
const AUTH_CACHE_TIME = 30000; // 30 секунд

export const login = createAsyncThunk(
    'auth/login',
    async (credentials: { username: string; password: string }, { dispatch }) => {
        // 1. Perform login to get auth cookies
        await authService.login(credentials);
        
        // 2. Immediately fetch user data to confirm login was successful
        const userResponse = await api.get(API_ENDPOINTS.AUTH.ME);
        
        return { user: userResponse.data };
    }
);

export const register = createAsyncThunk(
    'auth/register',
    async (data: { email: string; username: string; password: string; full_name?: string }, { dispatch }) => {
        // 1. Register user
        const response = await authService.register(data);
        
        // 2. Login to get auth cookies
        await authService.login({
            username: data.username,
            password: data.password,
        });
        
        // 3. Fetch user data to confirm
        const userResponse = await api.get(API_ENDPOINTS.AUTH.ME);
        
        return { user: userResponse.data };
    }
);

// Async thunk for logout
export const logoutAsync = createAsyncThunk(
    'auth/logoutAsync',
    async () => {
        await authService.logout();
        // Сбрасываем кэш при выходе
        authCheckPromise = null;
        return {};
    }
);

// Check authentication thunk
export const checkAuth = createAsyncThunk(
    'auth/checkAuth',
    async (_, { getState, rejectWithValue }) => {
        const state = getState() as { auth: AuthState };
        const lastCheck = state.auth.lastAuthCheck;
        const now = Date.now();
        
        // Если аутентификация уже проверена и проверка была недавно, используем кэш
        if (
            state.auth.isAuthenticated && 
            lastCheck && 
            now - lastCheck < AUTH_CACHE_TIME
        ) {
            return { user: state.auth.user };
        }
        
        // Если запрос уже выполняется, возвращаем его
        if (authCheckPromise) {
            try {
                return await authCheckPromise;
            } catch (error) {
                return rejectWithValue('Not authenticated');
            }
        }
        
        try {
            // Создаем новый запрос и кэшируем его
            authCheckPromise = api.get(API_ENDPOINTS.AUTH.ME).then(response => ({ user: response.data }));
            
            // Выполняем запрос
            const result = await authCheckPromise;
            
            // После выполнения запроса сбрасываем промис
            setTimeout(() => {
                authCheckPromise = null;
            }, 0);
            
            return result;
        } catch (error) {
            // После выполнения запроса сбрасываем промис
            setTimeout(() => {
                authCheckPromise = null;
            }, 0);
            
            return rejectWithValue('Not authenticated');
        }
    }
);

// Load user profile
export const loadUserProfile = createAsyncThunk(
    'auth/loadUserProfile',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get(API_ENDPOINTS.AUTH.ME);
            return { user: response.data };
        } catch (error) {
            return rejectWithValue('Failed to load user profile');
        }
    }
);

// Update user profile
export const updateProfile = createAsyncThunk(
    'auth/updateProfile',
    async (userData: Partial<User & { 
        current_password?: string;
        new_password?: string;
    }>, { rejectWithValue }) => {
        try {
            const response = await api.put(API_ENDPOINTS.AUTH.UPDATE_PROFILE, userData);
            return { user: response.data };
        } catch (error: any) {
            if (error.response?.data?.detail) {
                return rejectWithValue(error.response.data.detail);
            }
            return rejectWithValue('Failed to update profile');
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.lastAuthCheck = null;
            // Call the logout API in an effect, not here
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // CheckAuth
            .addCase(checkAuth.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(checkAuth.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload.user;
                state.isAuthenticated = true;
                state.lastAuthCheck = Date.now();
            })
            .addCase(checkAuth.rejected, (state) => {
                state.isLoading = false;
                state.user = null;
                state.isAuthenticated = false;
                state.lastAuthCheck = Date.now();
            })
            // Login
            .addCase(login.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload.user;
                state.isAuthenticated = true;
                state.lastAuthCheck = Date.now();
            })
            .addCase(login.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Failed to login';
            })
            // Register
            .addCase(register.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(register.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload.user;
                state.isAuthenticated = true;
                state.lastAuthCheck = Date.now();
            })
            .addCase(register.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Failed to register';
            })
            // Async Logout
            .addCase(logoutAsync.fulfilled, (state) => {
                state.user = null;
                state.isAuthenticated = false;
                state.lastAuthCheck = null;
            })
            // Load User Profile
            .addCase(loadUserProfile.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(loadUserProfile.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload.user;
                state.isAuthenticated = true;
                state.lastAuthCheck = Date.now();
            })
            .addCase(loadUserProfile.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Failed to load profile';
            })
            // Update Profile
            .addCase(updateProfile.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateProfile.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload.user;
                state.lastAuthCheck = Date.now();
            })
            .addCase(updateProfile.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string || 'Failed to update profile';
            });
    },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer; 