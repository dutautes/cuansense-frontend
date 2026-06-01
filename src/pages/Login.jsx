import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import api from "../api/axios"
import toast from "react-hot-toast"

const Login = () => {
    const navigate = useNavigate()
    const { login } = useAuth()

    // state buat nyimpen nilai input form
    const [form, setForm] = useState({
        email: '',
        password: ''
    })
    const [loading, setLoading] = useState(false)

    // update state setiap ada perubahan di input
    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault() // biar ga reload halaman pas submit

        // validasi sederhana sebelum kirim ke API
        if (!form.email || !form.password) {
            toast.error('Email dan password wajib diisi!')
            return
        }

        setLoading(true)
        try {
            const res = await api.post('/auth/login', form)
            const { token, ...userData } = res.data.data // destructuring: ambil token dan sisanya masuk ke userData.

            // simpan token dan data user ke context + localStorage
            login(token, userData)
            toast.success(`Selamat datang, ${userData.full_name}!`)
            navigate('/dashboard')
        } catch (error) {
            toast.error(error.response?.data?.message || 'Login gagal!') // ? : optional chaining, biar ga error kalau response atau message ga ada
        } finally {
            setLoading(false)
        }
    }

    return (
        // layout split: kiri hijau gradient, kanan form
        <div className="min-h-screen flex">

            {/* panel kiri - dekorasi */}
            <div className="hidden md:flex w-1/3 bg-gradient-to-br from-green-100 to-green-200 items-center justify-center">
                <div className="text-center">
                    <span className="text-6xl">💰</span>
                    <p className="text-green-700 font-semibold mt-4 text-lg">Smart Financial</p>
                    <p className="text-green-600 text-sm">Awareness</p>
                </div>
            </div>

            {/* panel kanan - form login */}
            <div className="flex-1 flex items-center justify-center bg-white p-8">
                <div className="w-full max-w-sm">

                    {/* header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-green-600">CuanSense</h1>
                        <p className="text-gray-500 text-sm mt-1">Smart Financial Awareness</p>
                    </div>

                    {/* form */}
                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* input email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="you@example.com"
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                            />
                        </div>

                        {/* input password */}
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-medium text-gray-700">
                                    Password
                                </label>
                            </div>
                            <input
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                            />
                        </div>

                        {/* button submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-2"
                        >
                            {loading ? 'Loading...' : 'Log In →'}
                        </button>
                    </form>

                    {/* link ke register */}
                    <p className="text-center text-sm text-gray-500 mt-6">
                        Tidak punya akun?{' '}
                        <Link to="/register" className="text-green-600 font-semibold hover:underline">
                            Register
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Login