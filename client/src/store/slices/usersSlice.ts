// src/store/slices/usersSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api'; // ваш axios-инстанс

// Типы данных
export interface User {
  id: number;
  username: string;
  full_name: string;
  email: string;
  is_admin: boolean;
  file_stats?: {
    count: number;
    total_size: number;
  };
}

interface UsersState {
  list: User[];
  loading: boolean;
  error: string | null;
}

const initialState: UsersState = {
  list: [],
  loading: false,
  error: null,
};

// Асинхронные thunk-операции
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string } };
      const token = state.auth.token;
      
      const response = await api.get('/admin/users/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки пользователей');
    }
  }
);

export const toggleAdminStatus = createAsyncThunk(
  'users/toggleAdminStatus',
  async ({ userId, isAdmin }: { userId: number; isAdmin: boolean }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string } };
      const token = state.auth.token;
      
      const response = await api.patch(
        `/admin/users/${userId}/`,
        { is_admin: !isAdmin },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return { userId, is_admin: response.data.is_admin };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка изменения статуса');
    }
  }
);

export const deleteUser = createAsyncThunk(
  'users/deleteUser',
  async (userId: number, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string } };
      const token = state.auth.token;
      
      await api.delete(`/admin/users/${userId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return userId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка удаления пользователя');
    }
  }
);

// Slice
const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearUsersError: (state) => {
      state.error = null;
    },
    clearUsers: (state) => {
      state.list = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchUsers
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action: PayloadAction<User[]>) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // toggleAdminStatus
      .addCase(toggleAdminStatus.fulfilled, (state, action) => {
        const { userId, is_admin } = action.payload;
        const user = state.list.find(u => u.id === userId);
        if (user) {
          user.is_admin = is_admin;
        }
      })
      // deleteUser
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.list = state.list.filter(user => user.id !== action.payload);
      });
  },
});

export const { clearUsersError, clearUsers } = usersSlice.actions;
export default usersSlice.reducer;