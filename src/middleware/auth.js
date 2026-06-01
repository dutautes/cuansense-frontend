import { redirect } from "react-router-dom"

// middleware ini dipanggil sebelum halaman yang butuh login dibuka
// kalau ga ada token, langsung redirect ke login
const authMiddleware = () => {
    const token = localStorage.getItem('token')
    if (!token) {
        return redirect('/login')
    }
    return null
}

export default authMiddleware