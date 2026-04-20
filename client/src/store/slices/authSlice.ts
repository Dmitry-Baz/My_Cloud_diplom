import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface User {
  id_user: number;
  username: string;
  email: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  status: "idle" | "loading" | "failed";
}

const loadState = (): AuthState => {
  try {
    const serializedState = localStorage.getItem("authState");
    if (serializedState === null) {
      return {
        token: null,
        user: null,
        isAuthenticated: false,
        status: "idle",
      };
    }
    return JSON.parse(serializedState);
  } catch (err) {
    return { token: null, user: null, isAuthenticated: false, status: "idle" };
  }
};

const initialState: AuthState = loadState();

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginStart: (state) => {
      state.status = "loading";
    },
    loginSuccess: (
      state,
      action: PayloadAction<{ token: string; user: User }>
    ) => {
      state.status = "idle";
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      localStorage.setItem(
        "authState",
        JSON.stringify({
          token: action.payload.token,
          user: action.payload.user,
          isAuthenticated: true,
          status: "idle",
        })
      );
    },
    loginFailure: (state) => {
      state.status = "failed";
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem("authState");
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.status = "idle";
      localStorage.removeItem("authState");
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout } =
  authSlice.actions;
export default authSlice.reducer;
