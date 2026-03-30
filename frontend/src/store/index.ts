import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import sessionReducer from './slices/sessionSlice'
import presenceReducer from './slices/presenceSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    session: sessionReducer,
    presence: presenceReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
