import { useState, useEffect } from "react"
import api from "../api/axios"
import Modal from "../components/Modal"
import toast from "react-hot-toast"
import { RiAddLine, RiEditLine, RiDeleteBin6Line, RiPriceTag3Line } from "react-icons/ri"

// kumpulan emoji yang bisa dipilih user buat jadi ikon kategori
const EMOJI_OPTIONS = [
    '🍔', '🍕', '🍜', '☕', '🛒', '🚗', '🚌', '✈️', '🏠', '💡',
    '🏥', '💊', '📚', '🎓', '🎮', '🎬', '👗', '👟', '💄', '🎁',
    '💼', '💰', '📈', '💳', '🏋️', '⚽', '🎵', '📱', '💻', '🔧',
    '🐾', '🌿', '⛽', '🅿️', '🏦', '💸', '🎯', '🏪', '🧴', '🧹'
]

const Kategori = () => {
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeType, setActiveType] = useState('expense') // tab yang aktif: expense | income
    const [modalOpen, setModalOpen] = useState(false)
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState(null) // kategori yang lagi dipilih
    const [submitLoading, setSubmitLoading] = useState(false)

    // form tambah — default icon 🏷️ sebagai placeholder generik
    const [form, setForm] = useState({ name: '', icon: '🏷️', type: 'expense' })
    // form edit — diisi ulang saat openEditModal dipanggil
    const [editForm, setEditForm] = useState({ name: '', icon: '🏷️' })

    // fetch semua kategori user dari API
    const fetchCategories = async () => {
        setLoading(true)
        try {
            const res = await api.get('/categories')
            setCategories(res.data.data)
        } catch (error) {
            toast.error('Gagal memuat kategori')
        } finally {
            setLoading(false)
        }
    }

    // cukup fetch sekali saat komponen mount
    useEffect(() => {
        fetchCategories()
    }, [])

    // filter kategori berdasarkan tab yang aktif — expense atau income
    // ini computed dari state, ga perlu disimpan di state sendiri
    const filteredCategories = categories.filter(c => c.type === activeType)

    // handler form generic pake computed property
    const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })
    const handleEditFormChange = (e) => setEditForm({ ...editForm, [e.target.name]: e.target.value })

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.name) {
            toast.error('Nama kategori wajib diisi!')
            return
        }
        setSubmitLoading(true)
        try {
            await api.post('/categories', {
                name: form.name,
                icon: form.icon,
                type: form.type, // tipe kategori ikut toggle yang dipilih di form
            })
            toast.success('Kategori berhasil ditambahkan!')
            setModalOpen(false)
            // reset form, tapi pertahankan type sesuai tab yang aktif biar konsisten
            setForm({ name: '', icon: '🏷️', type: activeType })
            fetchCategories()
        } catch (error) {
            toast.error(error.response?.data?.data || 'Gagal menambahkan kategori')
        } finally {
            setSubmitLoading(false)
        }
    }

    const handleEditSubmit = async (e) => {
        e.preventDefault()
        if (!editForm.name) {
            toast.error('Nama kategori wajib diisi!')
            return
        }
        setSubmitLoading(true)
        try {
            // edit hanya bisa ubah name & icon, tipe kategori ga boleh diubah
            await api.put(`/categories/${selectedCategory.id}`, {
                name: editForm.name,
                icon: editForm.icon,
            })
            toast.success('Kategori berhasil diupdate!')
            setEditModalOpen(false)
            fetchCategories()
        } catch (error) {
            toast.error(error.response?.data?.data || 'Gagal mengupdate kategori')
        } finally {
            setSubmitLoading(false)
        }
    }

    const handleDeleteConfirm = async () => {
        try {
            await api.delete(`/categories/${selectedCategory.id}`)
            toast.success('Kategori berhasil dihapus!')
            setDeleteModalOpen(false)
            setSelectedCategory(null)
            fetchCategories()
        } catch (error) {
            // backend bakal tolak kalau kategori masih dipake di transaksi
            toast.error(error.response?.data?.data || 'Gagal menghapus kategori')
        }
    }

    // buka modal edit, isi editForm dari data kategori yang diklik
    const openEditModal = (cat) => {
        setSelectedCategory(cat)
        setEditForm({ name: cat.name, icon: cat.icon || '🏷️' })
        setEditModalOpen(true)
    }

    // buka modal tambah, sinkronkan type dengan tab yang aktif biar ga perlu pilih lagi
    const openAddModal = () => {
        setForm({ name: '', icon: '🏷️', type: activeType })
        setModalOpen(true)
    }

    // helper kelas background berdasarkan tipe kategori
    // dipake di card kategori buat warna background ikon
    const iconBgByType = (type) => type === 'income'
        ? 'bg-green-100'
        : 'bg-red-100'

    return (
        <div className="space-y-6">

            {/* header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Kategori</h1>
                    <p className="text-gray-500 text-sm mt-0.5">Atur kategori pemasukan & pengeluaran</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors"
                >
                    <RiAddLine size={18} />
                    Tambah Kategori
                </button>
            </div>

            {/* tab filter expense / income — pill style */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
                <button
                    onClick={() => setActiveType('expense')}
                    className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeType === 'expense'
                            ? 'bg-white text-red-500 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Pengeluaran
                </button>
                <button
                    onClick={() => setActiveType('income')}
                    className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeType === 'income'
                            ? 'bg-white text-green-500 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Pemasukan
                </button>
            </div>

            {/* kategori grid — 3 kondisi: loading, kosong, atau ada data */}
            {loading ? (
                <div className="flex items-center justify-center h-48">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-gray-400 text-sm">Memuat kategori...</p>
                    </div>
                </div>
            ) : filteredCategories.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 flex flex-col items-center justify-center gap-3 shadow-sm border border-gray-50">
                    <RiPriceTag3Line size={40} className="text-gray-200" />
                    <p className="text-gray-400 text-sm">
                        Belum ada kategori {activeType === 'expense' ? 'pengeluaran' : 'pemasukan'}
                    </p>
                    <button
                        onClick={openAddModal}
                        className="text-green-500 text-sm font-medium hover:underline"
                    >
                        Tambah kategori sekarang
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {filteredCategories.map(cat => (
                        <div
                            key={cat.id}
                            // class 'group' buat nampilin tombol aksi pas hover
                            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 hover:shadow-md transition-shadow group"
                        >
                            <div className="flex items-start justify-between">
                                {/* kotak ikon besar dengan background warna sesuai tipe */}
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${iconBgByType(cat.type)}`}>
                                    {cat.icon || '🏷️'}
                                </div>
                                {/* tombol edit & delete — opacity-0, muncul saat hover (group-hover) */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => openEditModal(cat)}
                                        className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        <RiEditLine size={14} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedCategory(cat)
                                            setDeleteModalOpen(true)
                                        }}
                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <RiDeleteBin6Line size={14} />
                                    </button>
                                </div>
                            </div>
                            <p className="font-medium text-gray-700 text-sm mt-3 truncate">{cat.name}</p>
                            {/* badge tipe kategori */}
                            <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
                                cat.type === 'income'
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-red-100 text-red-500'
                            }`}>
                                {cat.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                            </span>
                        </div>
                    ))}

                    {/* card tambah — diletakkan setelah semua kategori, jadi tombol shortcut */}
                    <button
                        onClick={openAddModal}
                        className="bg-white rounded-2xl p-4 shadow-sm border-2 border-dashed border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all flex flex-col items-center justify-center gap-2 min-h-[100px] group"
                    >
                        <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-green-100 flex items-center justify-center transition-colors">
                            <RiAddLine size={20} className="text-gray-400 group-hover:text-green-500 transition-colors" />
                        </div>
                        <p className="text-xs text-gray-400 group-hover:text-green-500 font-medium transition-colors">Tambah</p>
                    </button>
                </div>
            )}

            {/* modal tambah kategori */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Tambah Kategori">
                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* toggle tipe — expense atau income */}
                    <div className="flex rounded-xl overflow-hidden border border-gray-200">
                        <button
                            type="button"
                            onClick={() => setForm({ ...form, type: 'expense' })}
                            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                                form.type === 'expense'
                                    ? 'bg-red-500 text-white'
                                    : 'bg-white text-gray-500 hover:bg-gray-50'
                            }`}
                        >
                            Pengeluaran
                        </button>
                        <button
                            type="button"
                            onClick={() => setForm({ ...form, type: 'income' })}
                            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                                form.type === 'income'
                                    ? 'bg-green-500 text-white'
                                    : 'bg-white text-gray-500 hover:bg-gray-50'
                            }`}
                        >
                            Pemasukan
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kategori</label>
                        <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleFormChange}
                            placeholder="Contoh: Makan, Transportasi..."
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
                    </div>

                    <div>
                        {/* preview ikon yang dipilih tampil di sebelah label */}
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ikon  <span className="text-lg ml-1">{form.icon}</span>
                        </label>
                        {/* grid emoji picker — scroll kalau kepenuhan */}
                        <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
                            {EMOJI_OPTIONS.map(emoji => (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => setForm({ ...form, icon: emoji })}
                                    // ring hijau menandakan emoji ini yang aktif dipilih
                                    className={`w-9 h-9 text-xl rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center ${
                                        form.icon === emoji ? 'bg-green-100 ring-2 ring-green-400' : ''
                                    }`}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitLoading}
                        className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors"
                    >
                        {submitLoading ? 'Menyimpan...' : 'Tambah Kategori'}
                    </button>
                </form>
            </Modal>

            {/* modal edit kategori — form terpisah biar ga campur aduk sama form tambah */}
            <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Kategori">
                <form onSubmit={handleEditSubmit} className="space-y-4">

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kategori</label>
                        <input
                            type="text"
                            name="name"
                            value={editForm.name}
                            onChange={handleEditFormChange}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ikon <span className="text-lg ml-1">{editForm.icon}</span>
                        </label>
                        <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
                            {EMOJI_OPTIONS.map(emoji => (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => setEditForm({ ...editForm, icon: emoji })}
                                    className={`w-9 h-9 text-xl rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center ${
                                        editForm.icon === emoji ? 'bg-green-100 ring-2 ring-green-400' : ''
                                    }`}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                        {/* kasih info bahwa tipe kategori tidak bisa diubah setelah dibuat */}
                        <p className="text-xs text-gray-400 mt-2">* Tipe kategori tidak bisa diubah setelah dibuat.</p>
                    </div>

                    <button
                        type="submit"
                        disabled={submitLoading}
                        className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors"
                    >
                        {submitLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                </form>
            </Modal>

            {/* modal konfirmasi hapus — tampilkan ikon & nama kategori biar user yakin */}
            <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Hapus Kategori">
                <div className="text-center space-y-4">
                    <div className="text-4xl">{selectedCategory?.icon}</div>
                    <p className="text-gray-600 text-sm">
                        Yakin mau hapus kategori <span className="font-semibold">"{selectedCategory?.name}"</span>?
                        Kategori yang masih digunakan di transaksi tidak bisa dihapus.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setDeleteModalOpen(false)}
                            className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleDeleteConfirm}
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm font-medium transition"
                        >
                            Hapus
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

export default Kategori