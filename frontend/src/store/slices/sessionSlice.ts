import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { WorkSession } from '../../api/sessions'

interface SessionState {
  activeSession: WorkSession | null
  isLoading: boolean
}

const initialState: SessionState = {
  activeSession: null,
  isLoading: false,
}

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setActiveSession: (state, action: PayloadAction<WorkSession | null>) => {
      state.activeSession = action.payload
    },
    updateSession: (state, action: PayloadAction<Partial<WorkSession>>) => {
      if (state.activeSession) {
        state.activeSession = { ...state.activeSession, ...action.payload }
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
  },
})

export const { setActiveSession, updateSession, setLoading } = sessionSlice.actions
export default sessionSlice.reducer
