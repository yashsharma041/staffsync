import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { errMsg } from "../api/axios";

const call = (type, fn) =>
  createAsyncThunk(type, async (arg, { rejectWithValue }) => {
    try {
      return await fn(arg);
    } catch (e) {
      return rejectWithValue(errMsg(e));
    }
  });

export const login = call("auth/login", async (creds) => (await api.post("/auth/login", creds)).data);
export const register = call("auth/register", async (data) => (await api.post("/auth/register", data)).data);
export const loadMe = call("auth/me", async () => (await api.get("/auth/me")).data);

const token = localStorage.getItem("token");

const slice = createSlice({
  name: "auth",
  initialState: { user: null, token, loading: !!token, error: null },
  reducers: {
    logout(state) {
      localStorage.removeItem("token");
      state.user = null;
      state.token = null;
      state.loading = false;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (b) => {
    const onAuth = (s, { payload }) => {
      localStorage.setItem("token", payload.token);
      s.token = payload.token;
      s.user = payload.user;
      s.loading = false;
      s.error = null;
    };
    b.addCase(login.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(login.fulfilled, onAuth)
      .addCase(login.rejected, (s, { payload }) => { s.loading = false; s.error = payload; })
      .addCase(register.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(register.fulfilled, onAuth)
      .addCase(register.rejected, (s, { payload }) => { s.loading = false; s.error = payload; })
      .addCase(loadMe.fulfilled, (s, { payload }) => { s.user = payload.user; s.loading = false; })
      .addCase(loadMe.rejected, (s) => {
        localStorage.removeItem("token");
        s.token = null;
        s.user = null;
        s.loading = false;
      });
  },
});

export const { logout, clearError } = slice.actions;
export default slice.reducer;
