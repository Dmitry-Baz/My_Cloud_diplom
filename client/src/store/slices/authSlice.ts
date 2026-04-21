// src/store/slices/authSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios, { AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// Типы
interface User {
  id: number;
  username: string;
  full_name: string;  // ← теперь обязательное поле
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
  if (error instanceof Error) {
    return error.message;
  }
  return defaultMsg;
};

export const login = createAsyncThunk(
  'auth/login',
  async ({ username, password }: { username: string; password: string }, { rejectWithValue }) => {
    try {
      const authResponse = await axios.post(`${API_BASE_URL}/auth/token/login/`, {
        username,
        password,
      });
      const auth_token = authResponse.data.auth_token;
      
      const userResponse = await axios.get(`${API_BASE_URL}/api/users/user_info/`, {
        headers: { Authorization: `Token ${auth_token}` },
      });
      const userData = userResponse.data;
      
      return {
        token: auth_token,
        user: {
          id: userData.id_user,
          username: userData.username,
          full_name: userData.full_name || userData.username, // ← добавлено
          email: userData.email,
          is_admin: userData.is_superuser || userData.role === 'admin',
        },
        is_admin: userData.is_superuser || userData.role === 'admin',
      };
    } catch (error) {
      return rejectWithValue(getErrorMsg(error, 'Ошибка входа'));
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData: { username: string; full_name: string; email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register/`, userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMsg(error, 'Ошибка регистрации'));
    }
  }
);

export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      const token = state.auth.token;
      
      if (!token) throw new Error('Нет токена');
      
      const response = await axios.get(`${API_BASE_URL}/api/users/user_info/`, {
        headers: { Authorization: `Token ${token}` },
      });
      const userData = response.data;
      
      return {
        user: {
          id: userData.id_user,
          username: userData.username,
          full_name: userData.full_name || userData.username,
          email: userData.email,
          is_admin: userData.is_superuser || userData.role === 'admin',
        },
        is_admin: userData.is_superuser || userData.role === 'admin',
      };
    } catch (error) {
      return rejectWithValue(getErrorMsg(error, 'Ошибка проверки'));
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
      state.error = null;
      localStorage.removeItem('token');
      localStorage.removeItem('isAdmin');
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;  // ← теперь типы совпадают
        state.isAdmin = action.payload.is_admin;
        localStorage.setItem('token', action.payload.token);
        localStorage.setItem('isAdmin', String(action.payload.is_admin));
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAdmin = action.payload.is_admin;
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAdmin = false;
        state.error = action.payload as string;
        localStorage.removeItem('token');
        localStorage.removeItem('isAdmin');
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
