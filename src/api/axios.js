import axios from 'axios'

// bikin instance axios dengan base URL backend
const api = axios.create({
    baseURL: 'http://localhost:3000',
})

// interceptor request: setiap request otomatis ditambahin token
// jadi ga perlu manual tambahin Authorization di setiap fetch
api.interceptors.request.use((config) => {
    // ambil token dari localStorage
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = token
    }
    return config
})

// interceptor response: kalau 401, otomatis redirect ke login
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // token expired atau invalid, hapus data auth dan paksa login ulang
            localStorage.removeItem('token')
            localStorage.removeItem('user') // hapus data user juga biar aman
            window.location.href = '/login'
        }
        return Promise.reject(error) // promise.reject : error tetap diteruskan ke catch di komponen yang panggil API, biar bisa ditangani sesuai kebutuhan 
    }
)

export default api

// axios : → library buat HTTP request (fetch data dari API). Lebih simple dari fetch bawaan JS karena udah auto handle JSON, error, dan interceptor (kayak middleware tapi di FE — bisa auto tambahin token di setiap request).