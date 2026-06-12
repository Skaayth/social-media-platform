import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../context/AuthContext'
import { fetchUsers } from '../services/api'

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>

describe('Validate Authentication', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should log in a previously registered user (not new users, login state should be set)', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.allUsers.length).toBeGreaterThan(0)
    })

    const testUser = result.current.allUsers[0]

    act(() => {
      result.current.login(testUser)
    })

    expect(result.current.user).toBeTruthy()
    expect(result.current.user.id).toBe(testUser.id)
    expect(result.current.user.username).toBe(testUser.username)
    expect(localStorage.getItem('loggedInUser')).toBeTruthy()
  })

  it('should not log in an invalid user (error state should be set)', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.allUsers.length).toBeGreaterThan(0)
    })

    const invalidUser = result.current.allUsers.find(u => u.username === 'NonExistentUser')
    
    expect(invalidUser).toBeUndefined()
    expect(result.current.user).toBeNull()
  })

  it('should log out a user (login state should be cleared)', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.allUsers.length).toBeGreaterThan(0)
    })

    const testUser = result.current.allUsers[0]

    act(() => {
      result.current.login(testUser)
    })

    expect(result.current.user).toBeTruthy()

    act(() => {
      result.current.logout()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.headline).toBe('')
    expect(localStorage.getItem('loggedInUser')).toBeNull()
  })
  
  it('fetchUsers retrieves all users from API', async () => {
    const users = await fetchUsers()
    
    expect(users).toBeDefined()
    expect(Array.isArray(users)).toBe(true)
    expect(users.length).toBeGreaterThan(0)
    expect(users[0]).toHaveProperty('username')
    expect(users[0]).toHaveProperty('email')
  })
})

