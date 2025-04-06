import { configureStore } from '@reduxjs/toolkit';
import authReducer from './auth.slice';
import boardReducer from './board.slice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    board: boardReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
