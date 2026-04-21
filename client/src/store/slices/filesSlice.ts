// src/store/slices/filesSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';

export interface FileItem {
  id: number;
  name: string;
  original_name: string;
  comment: string;
  size: number;
  size_mb: string;
  uploaded_at: string;
  last_downloaded_at: string | null;
  download_url: string;
  share_link?: string;
}

interface FilesState {
  list: FileItem[];
  loading: boolean;
  uploading: boolean;
  error: string | null;
}

const initialState: FilesState = {
  list: [],
  loading: false,
  uploading: false,
  error: null,
};

export const fetchFiles = createAsyncThunk(
  'files/fetchFiles',
  async (userId?: number, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string } };
      const token = state.auth.token;
      
      const url = userId ? `/files/user/${userId}/` : '/files/my/';
      const response = await api.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки файлов');
    }
  }
);

export const uploadFile = createAsyncThunk(
  'files/uploadFile',
  async ({ file, comment }: { file: File; comment: string }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string } };
      const token = state.auth.token;
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('comment', comment);
      
      const response = await api.post('/files/upload/', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки файла');
    }
  }
);

export const renameFile = createAsyncThunk(
  'files/renameFile',
  async ({ fileId, newName }: { fileId: number; newName: string }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string } };
      const token = state.auth.token;
      
      const response = await api.patch(
        `/files/${fileId}/`,
        { name: newName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return { fileId, newName: response.data.name };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка переименования');
    }
  }
);

export const deleteFile = createAsyncThunk(
  'files/deleteFile',
  async (fileId: number, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string } };
      const token = state.auth.token;
      
      await api.delete(`/files/${fileId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return fileId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка удаления');
    }
  }
);

export const generateShareLink = createAsyncThunk(
  'files/generateShareLink',
  async (fileId: number, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string } };
      const token = state.auth.token;
      
      const response = await api.post(
        `/files/${fileId}/share/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return { fileId, shareLink: response.data.share_link };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка создания ссылки');
    }
  }
);

const filesSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    clearFilesError: (state) => {
      state.error = null;
    },
    resetUploading: (state) => {
      state.uploading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchFiles
      .addCase(fetchFiles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFiles.fulfilled, (state, action: PayloadAction<FileItem[]>) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchFiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // uploadFile
      .addCase(uploadFile.pending, (state) => {
        state.uploading = true;
        state.error = null;
      })
      .addCase(uploadFile.fulfilled, (state, action: PayloadAction<FileItem>) => {
        state.uploading = false;
        state.list.unshift(action.payload);
      })
      .addCase(uploadFile.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.payload as string;
      })
      // renameFile
      .addCase(renameFile.fulfilled, (state, action) => {
        const { fileId, newName } = action.payload;
        const file = state.list.find(f => f.id === fileId);
        if (file) {
          file.name = newName;
        }
      })
      // deleteFile
      .addCase(deleteFile.fulfilled, (state, action) => {
        state.list = state.list.filter(f => f.id !== action.payload);
      })
      // generateShareLink
      .addCase(generateShareLink.fulfilled, (state, action) => {
        const { fileId, shareLink } = action.payload;
        const file = state.list.find(f => f.id === fileId);
        if (file) {
          file.share_link = shareLink;
        }
      });
  },
});

export const { clearFilesError, resetUploading } = filesSlice.actions;
export default filesSlice.reducer;
