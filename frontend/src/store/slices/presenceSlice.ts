import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UserPresence {
  user_id: number
  status: 'offline' | 'online' | 'idle'
  last_activity?: string
}

interface PresenceState {
  users: Record<number, UserPresence>
}

const initialState: PresenceState = {
  users: {},
}

const presenceSlice = createSlice({
  name: 'presence',
  initialState,
  reducers: {
    setUserStatus: (state, action: PayloadAction<{ user_id: number; status: 'offline' | 'online' | 'idle' }>) => {
      const { user_id, status } = action.payload
      state.users[user_id] = {
        ...state.users[user_id],
        user_id,
        status,
      }
    },
    updateUserPresence: (state, action: PayloadAction<UserPresence>) => {
      const { user_id } = action.payload
      state.users[user_id] = action.payload
    },
    removeUser: (state, action: PayloadAction<number>) => {
      delete state.users[action.payload]
    },
    clearPresence: (state) => {
      state.users = {}
    },
  },
})

export const { setUserStatus, updateUserPresence, removeUser, clearPresence } = presenceSlice.actions
export default presenceSlice.reducer
