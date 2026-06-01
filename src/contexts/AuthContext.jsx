import { createContext, useContext, useState } from "react"

// bikin context buat nyimpen state auth global
const AuthContext = createContext()

const AuthProvider = ({ children }) => { // AuthProvider : komponen pembungkus yang menyediakan state auth ke seluruh aplikasi
    // ambil data dari localStorage kalau ada (biar ga hilang pas refresh)
    const [token, setToken] = useState(localStorage.getItem('token') || null)
    const [user, setUser] = useState(
        localStorage.getItem('user')
            ? JSON.parse(localStorage.getItem('user'))
            : null
    )

    // dipanggil setelah login berhasil
    const login = (tokenData, userData) => {
        localStorage.setItem('token', tokenData)
        localStorage.setItem('user', JSON.stringify(userData))
        setToken(tokenData)
        setUser(userData)
    }

    // dipanggil saat logout
    const logout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setToken(null)
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ token, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

// custom hook biar gampang dipanggil di component manapun
// tinggal const { token, user, login, logout } = useAuth()
export const useAuth = () => useContext(AuthContext)

export default AuthProvider