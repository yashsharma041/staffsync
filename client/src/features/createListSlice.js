import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { errMsg } from "../api/axios";

/**
 * Builds a paginated list slice. Dispatch fetchItems({ url?, ...params }).
 * `url` overrides the default endpoint (used for role-specific endpoints).
 */
export default function createListSlice(name, defaultUrl) {
  const fetchItems = createAsyncThunk(`${name}/fetch`, async (arg = {}, { rejectWithValue }) => {
    const { url, ...params } = arg;
    try {
      const { data } = await api.get(url || defaultUrl, { params });
      return data;
    } catch (e) {
      return rejectWithValue(errMsg(e));
    }
  });

  const slice = createSlice({
    name,
    initialState: { items: [], page: 1, pages: 1, total: 0, unread: 0, loading: false, error: null },
    reducers: {},
    extraReducers: (b) => {
      b.addCase(fetchItems.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
        .addCase(fetchItems.fulfilled, (s, { payload }) => {
          s.loading = false;
          s.items = payload.items || [];
          s.page = payload.page || 1;
          s.pages = payload.pages || 1;
          s.total = payload.total ?? s.items.length;
          if (payload.unread !== undefined) s.unread = payload.unread;
        })
        .addCase(fetchItems.rejected, (s, { payload }) => {
          s.loading = false;
          s.error = payload;
        });
    },
  });

  return { reducer: slice.reducer, fetchItems };
}
