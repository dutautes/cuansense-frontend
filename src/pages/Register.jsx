import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import api from "../api/axios"
import toast from "react-hot-toast"

const Register = () => {
    const navigate = useNavigate()

    const [form, setForm] = useState({
        full_name: '',
        email: '',
        password: '',
    })
    // state khusus buat file foto profil (beda karena tipe data file)
    const [profilePicture, setProfilePicture] = useState(null)
    const [loading, setLoading] = useState(false)

    const handleChange = (e) => { // update state setiap ada perubahan di input
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    // handle upload foto profil
    const handleFileChange = (e) => { // ambil file urutan pertama alias [0]
        setProfilePicture(e.target.files[0])
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!form.full_name || !form.email || !form.password) {
            toast.error('Semua field wajib diisi!')
            return
        }

        if (form.password.length < 6) {
            toast.error('Password minimal 6 karakter!')
            return
        }

        setLoading(true)
        try {
            // pake FormData karena ada file upload (foto profil)
            const formData = new FormData() // FormData : buat ngirim data multipart/form-data
            formData.append('full_name', form.full_name)
            formData.append('email', form.email)
            formData.append('password', form.password)
            if (profilePicture) {
                formData.append('profile_picture', profilePicture)
            }

            await api.post('/auth/register', formData)
            toast.success('Register berhasil! Silahkan login.')
            navigate('/login')
        } catch (error) {
             console.log(error.response)
            toast.error(error.response?.data?.data || 'Register gagal!')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex">

            {/* panel kiri - dekorasi */}
            <div className="hidden md:flex w-1/3 bg-gradient-to-br from-green-100 to-green-200 items-center justify-center">
                <div className="text-center">
                    <span className="text-6xl">💰</span>
                    <p className="text-green-700 font-semibold mt-4 text-lg">Smart Financial</p>
                    <p className="text-green-600 text-sm">Awareness</p>
                </div>
            </div>

            {/* panel kanan - form register */}
            <div className="flex-1 flex items-center justify-center bg-white p-8">
                <div className="w-full max-w-sm">

                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-green-600">CuanSense</h1>
                        <p className="text-gray-500 text-sm mt-1">Buat akun baru</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* input nama */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nama Lengkap
                            </label>
                            <input
                                type="text"
                                name="full_name"
                                value={form.full_name}
                                onChange={handleChange}
                                placeholder="Nama lengkap kamu"
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                            />
                        </div>

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
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="Min. 6 karakter"
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                            />
                        </div>

                        {/* input foto profil (opsional) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Foto Profil <span className="text-gray-400">(opsional)</span>
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-green-50 file:text-green-600 file:text-xs"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 rounded-xl transition-all mt-2"
                        >
                            {loading ? 'Loading...' : 'Daftar Sekarang'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-gray-500 mt-6">
                        Sudah punya akun?{' '}
                        <Link to="/login" className="text-green-600 font-semibold hover:underline">
                            Login di sini
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Register