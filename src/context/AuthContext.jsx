import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import * as api from '../services/api.js'

const AuthContext = createContext(null)

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('loggedInUser')
    return saved ? JSON.parse(saved) : null
  })
  const [headline, setHeadline] = useState(() => {
    return localStorage.getItem('userHeadline') || ''
  })
  const [avatarUrl, setAvatarUrl] = useState(() => {
    return localStorage.getItem('userAvatar') || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'
  })

  // Fetch user profile data when user logs in
  useEffect(() => {
    if (user) {
      // Fetch headline
      api.fetchHeadline().then(data => {
        setHeadline(data.headline)
        localStorage.setItem('userHeadline', data.headline)
      }).catch(err => console.error('Failed to fetch headline:', err))
      
      // Fetch avatar
      api.fetchAvatar().then(data => {
        setAvatarUrl(data.avatar)
        localStorage.setItem('userAvatar', data.avatar)
      }).catch(err => console.error('Failed to fetch avatar:', err))
    }
  }, [user])

  const login = async (username, password) => {
    try {
      const response = await api.login(username, password)
      const userData = { username: response.username }
      setUser(userData)
      localStorage.setItem('loggedInUser', JSON.stringify(userData))
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const register = async (userData) => {
    try {
      const response = await api.register(userData)
      const user = { username: response.username }
      setUser(user)
      localStorage.setItem('loggedInUser', JSON.stringify(user))
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const logout = async () => {
    try {
      await api.logout()
    } catch (err) {
      console.error('Logout error:', err)
    }
    setUser(null)
    setHeadline('')
    setAvatarUrl('https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png')
    localStorage.removeItem('loggedInUser')
    localStorage.removeItem('userHeadline')
    localStorage.removeItem('userAvatar')
  }

  const updateHeadline = async (newHeadline) => {
    try {
      await api.updateHeadline(newHeadline)
      setHeadline(newHeadline)
      localStorage.setItem('userHeadline', newHeadline)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const updateAvatar = async (imageFile) => {
    try {
      const response = await api.updateAvatar(imageFile)
      setAvatarUrl(response.avatar)
      localStorage.setItem('userAvatar', response.avatar)
      return { success: true, avatar: response.avatar }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const value = useMemo(() => ({ 
    user, 
    login, 
    register,
    logout, 
    headline, 
    setHeadline, 
    updateHeadline, 
    avatarUrl, 
    setAvatarUrl,
    updateAvatar
  }), [user, headline, avatarUrl])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
