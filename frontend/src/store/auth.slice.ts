import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { AuthState, LoginResponse, RegisterResponse } from './types';
import { authService } from '../services/auth.service';
import { setToken, removeToken, getToken } from '../utils/token';
import api from '../api/axios';

const initialState: AuthState = {
    user: null,
    token: null,
    tokenType: null,
    isLoading: false,
    error: null,
};

export const restoreSession = createAsyncThunk(
    'auth/restoreSession',
    async () => {
        const { token, type } = getToken();
        if (token && type) {
            api.defaults.headers.common['Authorization'] = `${type} ${token}`;
            // Create a minimal user object with required fields
            return { 
                token, 
                tokenType: type, 
                user: { 
                    id: 1,
                    username: 'user' // Add required username field
                } 
            };
        }
        throw new Error('No token found');
    }
);

export const login = createAsyncThunk(
    'auth/login',
    async (credentials: { username: string; password: string }) => {
        const response = await authService.login(credentials);
        setToken(response.access_token, response.token_type);
        api.defaults.headers.common['Authorization'] = `${response.token_type} ${response.access_token}`;
        return { token: response.access_token, tokenType: response.token_type, user: { username: credentials.username } };
    }
);

export const register = createAsyncThunk(
    'auth/register',
    async (data: { email: string; username: string; password: string; full_name?: string }) => {
        const response = await authService.register(data);
        const loginResponse = await authService.login({
            username: data.username,
            password: data.password,
        });
        setToken(loginResponse.access_token, loginResponse.token_type);
        api.defaults.headers.common['Authorization'] = `${loginResponse.token_type} ${loginResponse.access_token}`;
        return { token: loginResponse.access_token, tokenType: loginResponse.token_type, user: response };
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.tokenType = null;
            state.error = null;
            removeToken();
            delete api.defaults.headers.common['Authorization'];
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Restore Session
            .addCase(restoreSession.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(restoreSession.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.tokenType = action.payload.tokenType;
            })
            .addCase(restoreSession.rejected, (state) => {
                state.isLoading = false;
                state.user = null;
                state.token = null;
                state.tokenType = null;
            })
            // Login
            .addCase(login.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.tokenType = action.payload.tokenType;
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
                state.token = action.payload.token;
                state.tokenType = action.payload.tokenType;
            })
            .addCase(register.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Failed to register';
            });
    },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer; 