import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

const API = axios.create({ baseURL: '/api' })

// Add JWT token to all requests
API.interceptors.request.use(config => {
    const token = localStorage.getItem('examhall_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

API.interceptors.response.use(
    res => res,
    err => {
        if (err.response?.status === 401) {
            localStorage.removeItem('examhall_token')
            localStorage.removeItem('examhall_user')
        }
        return Promise.reject(err)
    }
)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const saved = localStorage.getItem('examhall_user')
        const token = localStorage.getItem('examhall_token')
        if (saved && token) {
            setUser(JSON.parse(saved))
        }
        setLoading(false)
    }, [])

    const login = async (username, password) => {
        const res = await API.post('/auth/login', { username, password })
        localStorage.setItem('examhall_token', res.data.token)
        localStorage.setItem('examhall_user', JSON.stringify(res.data.user))
        setUser(res.data.user)
        return res.data.user
    }

    const logout = () => {
        localStorage.removeItem('examhall_token')
        localStorage.removeItem('examhall_user')
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
export { API }
