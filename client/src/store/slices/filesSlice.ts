import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export interface FileItem {
  id: number;
  file: string;
  uploaded_at: string;
  id_user: number;
}

interface FilesState {
  items: FileItem[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: FilesState = {
  items: [],
  status: "idle",
  error: null,
};

export const fetchFiles = createAsyncThunk<
  FileItem[],
  { userId: number; token: string }
>("files/fetchFiles", async ({ userId, token }) => {
  const response = await axios.get(`${API_BASE_URL}/api/storage/`, {
    headers: { Authorization: `Token ${token}` },
    params: { id_user: userId },
  });
  return response.data;
});

export const uploadFile = createAsyncThunk<
  FileItem,
  { file: File; userId: number; token: string }
>("files/uploadFile", async ({ file, userId, token }) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("id_user", userId.toString());

  const response = await axios.post(`${API_BASE_URL}/api/storage/`, formData, {
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
});

export const deleteFile = createAsyncThunk<
  number,
  { fileId: number; token: string }
>("files/deleteFile", async ({ fileId, token }) => {
  await axios.delete(`${API_BASE_URL}/api/storage/${fileId}/`, {
    headers: { Authorization: `Token ${token}` },
  });
  return fileId;
});

const filesSlice = createSlice({
  name: "files",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFiles.pending, (state) => {
        state.status = "loading";
      })
      .addCase(
        fetchFiles.fulfilled,
        (state, action: PayloadAction<FileItem[]>) => {
          state.status = "succeeded";
          state.items = action.payload;
        }
      )
      .addCase(fetchFiles.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Failed to fetch files";
      })
      .addCase(
        uploadFile.fulfilled,
        (state, action: PayloadAction<FileItem>) => {
          state.items.push(action.payload);
        }
      )
      .addCase(deleteFile.fulfilled, (state, action: PayloadAction<number>) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
      });
  },
});

export default filesSlice.reducer;
