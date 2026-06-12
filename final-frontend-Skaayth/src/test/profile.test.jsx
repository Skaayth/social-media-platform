import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../context/AuthContext'

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>

describe('Validate Profile actions', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should fetch the logged in user\'s profile username (retrieve username from login state after logging in)', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.allUsers.length).toBeGreaterThan(0)
    })

    const testUser = result.current.allUsers[0]

    act(() => {
      result.current.login(testUser)
    })

    expect(result.current.user).toBeTruthy()
    expect(result.current.user.username).toBe(testUser.username)
    expect(result.current.user.email).toBe(testUser.email)
  })
})

