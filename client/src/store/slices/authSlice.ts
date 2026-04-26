
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios, { AxiosError } from 'axios';

// Правильное определение URL
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

interface User {
  id: number;
  username: string;
  full_name: string;
  email: string;
  is_admin: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAdmin: localStorage.getItem('isAdmin') === 'true',
  loading: false,
  error: null,
};

const getErrorMsg = (error: unknown, defaultMsg: string): string => {
  if (error instanceof AxiosError) {
    return error.response?.data?.detail || error.response?.data?.message || defaultMsg;
  }
  return error instanceof Error ? error.message : defaultMsg;
};

export const login = createAsyncThunk(
  'auth/login',
  async ({ username, password }: { username: string; password: string }, { rejectWithValue }) => {
    try {
      // 1. Логин для получения токена
      const authResponse = await axios.post(`${API_BASE_URL}/auth/token/login/`, {
        username,
        password,
      });
      const auth_token = authResponse.data.auth_token;
      
      // 2. Запрос данных пользователя по токену
      const userResponse = await axios.get(`${API_BASE_URL}/api/users/user_info/`, {
        headers: { Authorization: `Token ${auth_token}` },
      });
      
      const userData = userResponse.data;
      
      return {
        token: auth_token,
        user: {
          id: userData.id || userData.id_user, // Обработка разных имен полей
          username: userData.username,
          full_name: userData.full_name || userData.username,
          email: userData.email,
          is_admin: !!(userData.is_superuser || userData.role === 'admin'),
        },
        is_admin: !!(userData.is_superuser || userData.role === 'admin'),
      };
    } catch (error) {
      return rejectWithValue(getErrorMsg(error, 'Ошибка входа'));
    }
  }
);

export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    if (!token) return rejectWithValue('Нет токена');

    try {
      const response = await axios.get(`${API_BASE_URL}/api/users/user_info/`, {
        headers: { Authorization: `Token ${token}` },
      });
      
      const userData = response.data;
      return {
        token: token,
        user: {
          id: userData.id || userData.id_user,
          username: userData.username,
          full_name: userData.full_name || userData.username,
          email: userData.email,
          is_admin: !!(userData.is_superuser || userData.role === 'admin'),
        },
        is_admin: !!(userData.is_superuser || userData.role === 'admin'),
      };
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('isAdmin');
      return rejectWithValue(getErrorMsg(error, 'Сессия истекла'));
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAdmin = false;
      localStorage.removeItem('token');
      localStorage.removeItem('isAdmin');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAdmin = action.payload.is_admin;
        
        // Сохраняем в localStorage для персистентности
        localStorage.setItem('token', action.payload.token);
        localStorage.setItem('isAdmin', String(action.payload.is_admin));
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(checkAuth.fulfilled, (state, action: PayloadAction<any>) => {
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAdmin = action.payload.is_admin;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;

