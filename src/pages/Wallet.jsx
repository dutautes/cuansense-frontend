import { useState, useEffect } from "react"
import api from "../api/axios"
import Modal from "../components/Modal"
import toast from "react-hot-toast"
import { RiAddLine, RiEditLine, RiDeleteBin6Line, RiWalletLine } from "react-icons/ri"

// helper format rupiah, konsisten dipake di seluruh file
const formatRupiah = (amount) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount)
}

// palet warna yang bisa dipilih user untuk tampilan wallet card
const COLOR_OPTIONS = [
    { label: 'Hijau', value: '#22c55e' },
    { label: 'Biru', value: '#3b82f6' },
    { label: 'Ungu', value: '#8b5cf6' },
    { label: 'Oranye', value: '#f97316' },
    { label: 'Merah', value: '#ef4444' },
    { label: 'Pink', value: '#ec4899' },
    { label: 'Teal', value: '#14b8a6' },
    { label: 'Abu', value: '#6b7280' },
]

const Wallet = () => {
    const [wallets, setWallets] = useState([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [selectedWallet, setSelectedWallet] = useState(null) // wallet yang lagi dipilih untuk edit/hapus
    const [submitLoading, setSubmitLoading] = useState(false)

    // form tambah wallet — default warna hijau
    const [form, setForm] = useState({ name: '', balance: '', color: '#22c55e' })
    // form edit wallet — diisi dari data wallet yang dipilih
    const [editForm, setEditForm] = useState({ name: '', color: '#22c55e' })

    // fetch semua wallet user
    const fetchWallets = async () => {
        setLoading(true)
        try {
            const res = await api.get('/wallets')
            setWallets(res.data.data)
        } catch (error) {
            toast.error('Gagal memuat wallet')
        } finally {
            setLoading(false)
        }
    }

    // jalanin sekali waktu komponen pertama mount
    useEffect(() => {
        fetchWallets()
    }, [])

    // generic handler form pake computed property [name] biar fleksibel
    const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })
    const handleEditFormChange = (e) => setEditForm({ ...editForm, [e.target.name]: e.target.value })

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.name) {
            toast.error('Nama wallet wajib diisi!')
            return
        }
        setSubmitLoading(true)
        try {
            await api.post('/wallets', {
                name: form.name,
                balance: Number(form.balance) || 0, // kalau kosong, default ke 0
                color: form.color,
            })
            toast.success('Wallet berhasil dibuat!')
            setModalOpen(false)
            setForm({ name: '', balance: '', color: '#22c55e' }) // reset ke default
            fetchWallets()
        } catch (error) {
            toast.error(error.response?.data?.data || 'Gagal membuat wallet')
        } finally {
            setSubmitLoading(false)
        }
    }

    const handleEditSubmit = async (e) => {
        e.preventDefault()
        if (!editForm.name) {
            toast.error('Nama wallet wajib diisi!')
            return
        }
        setSubmitLoading(true)
        try {
            // edit cuma kirim name & color, saldo ga bisa diubah langsung lewat sini
            await api.put(`/wallets/${selectedWallet.id}`, {
                name: editForm.name,
                color: editForm.color,
            })
            toast.success('Wallet berhasil diupdate!')
            setEditModalOpen(false)
            fetchWallets()
        } catch (error) {
            toast.error(error.response?.data?.data || 'Gagal mengupdate wallet')
        } finally {
            setSubmitLoading(false)
        }
    }

    const handleDeleteConfirm = async () => {
        try {
            await api.delete(`/wallets/${selectedWallet.id}`)
            toast.success('Wallet berhasil dihapus!')
            setDeleteModalOpen(false)
            setSelectedWallet(null) // bersihkan seleksi setelah hapus
            fetchWallets()
        } catch (error) {
            toast.error('Gagal menghapus wallet')
        }
    }

    // buka modal edit dan isi editForm dengan data wallet yang dipilih
    const openEditModal = (wallet) => {
        setSelectedWallet(wallet)
        setEditForm({ name: wallet.name, color: wallet.color || '#22c55e' })
        setEditModalOpen(true)
    }

    // hitung total saldo dari semua wallet pakai reduce
    const totalBalance = wallets.reduce((sum, w) => sum + parseFloat(w.balance || 0), 0)

    return (
        <div className="space-y-6">

            {/* header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Wallet</h1>
                    <p className="text-gray-500 text-sm mt-0.5">Kelola semua dompet keuangan kamu</p>
                </div>
                <button
                    onClick={() => setModalOpen(true)}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors"
                >
                    <RiAddLine size={18} />
                    Tambah Wallet
                </button>
            </div>

            {/* total balance card — hanya muncul kalau ada wallet dan data sudah selesai dimuat */}
            {!loading && wallets.length > 0 && (
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
                    <p className="text-green-100 text-sm font-medium">Total Saldo Semua Wallet</p>
                    <p className="text-3xl font-bold mt-1">{formatRupiah(totalBalance)}</p>
                    <p className="text-green-200 text-xs mt-2">{wallets.length} wallet aktif</p>
                </div>
            )}

            {/* grid wallet — 3 kondisi: loading, kosong, atau ada data */}
            {loading ? (
                <div className="flex items-center justify-center h-48">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-gray-400 text-sm">Memuat wallet...</p>
                    </div>
                </div>
            ) : wallets.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 flex flex-col items-center justify-center gap-3 shadow-sm border border-gray-50">
                    <RiWalletLine size={40} className="text-gray-200" />
                    <p className="text-gray-400 text-sm">Belum ada wallet</p>
                    <button
                        onClick={() => setModalOpen(true)}
                        className="text-green-500 text-sm font-medium hover:underline"
                    >
                        Buat wallet pertama kamu
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {wallets.map(wallet => (
                        <div
                            key={wallet.id}
                            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50 hover:shadow-md transition-shadow relative overflow-hidden"
                        >
                            {/* accent strip warna di bagian atas card */}
                            <div
                                className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
                                style={{ backgroundColor: wallet.color || '#22c55e' }}
                            />

                            <div className="flex items-start justify-between mt-1">
                                <div className="flex items-center gap-3">
                                    {/* kotak warna dengan inisial nama wallet */}
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm"
                                        style={{ backgroundColor: wallet.color || '#22c55e' }}
                                    >
                                        {wallet.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800 text-sm">{wallet.name}</p>
                                        <p className="text-xs text-gray-400">Dompet digital</p>
                                    </div>
                                </div>

                                {/* tombol edit & hapus di kanan atas card */}
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => openEditModal(wallet)}
                                        className="p-1.5 text-gray-300 hover:text-blue-400 transition-colors rounded-lg hover:bg-blue-50"
                                    >
                                        <RiEditLine size={15} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedWallet(wallet)
                                            setDeleteModalOpen(true)
                                        }}
                                        className="p-1.5 text-gray-300 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50"
                                    >
                                        <RiDeleteBin6Line size={15} />
                                    </button>
                                </div>
                            </div>

                            {/* saldo wallet */}
                            <div className="mt-4">
                                <p className="text-xs text-gray-400 mb-0.5">Saldo</p>
                                <p className="text-xl font-bold text-gray-800">{formatRupiah(wallet.balance)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* modal tambah wallet */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Tambah Wallet Baru">
                <form onSubmit={handleSubmit} className="space-y-4">

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Wallet</label>
                        <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleFormChange}
                            placeholder="Contoh: BCA, GoPay, Tunai..."
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Saldo Awal <span className="text-gray-400">(opsional)</span>
                        </label>
                        <input
                            type="number"
                            name="balance"
                            value={form.balance}
                            onChange={handleFormChange}
                            placeholder="0"
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Warna</label>
                        {/* color picker berbentuk bulat-bulat kecil */}
                        <div className="flex flex-wrap gap-2">
                            {COLOR_OPTIONS.map(c => (
                                <button
                                    key={c.value}
                                    type="button"
                                    onClick={() => setForm({ ...form, color: c.value })}
                                    // ring muncul kalau warna ini yang aktif dipilih
                                    className={`w-8 h-8 rounded-lg transition-transform hover:scale-110 ${form.color === c.value ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                                    style={{ backgroundColor: c.value }}
                                    title={c.label}
                                />
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitLoading}
                        className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors"
                    >
                        {submitLoading ? 'Menyimpan...' : 'Buat Wallet'}
                    </button>
                </form>
            </Modal>

            {/* modal edit wallet — form terpisah dari tambah biar ga tabrakan state */}
            <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Wallet">
                <form onSubmit={handleEditSubmit} className="space-y-4">

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Wallet</label>
                        <input
                            type="text"
                            name="name"
                            value={editForm.name}
                            onChange={handleEditFormChange}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Warna</label>
                        <div className="flex flex-wrap gap-2">
                            {COLOR_OPTIONS.map(c => (
                                <button
                                    key={c.value}
                                    type="button"
                                    onClick={() => setEditForm({ ...editForm, color: c.value })}
                                    className={`w-8 h-8 rounded-lg transition-transform hover:scale-110 ${editForm.color === c.value ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                                    style={{ backgroundColor: c.value }}
                                    title={c.label}
                                />
                            ))}
                        </div>
                        {/* kasih info ke user kalau saldo ga bisa diubah langsung */}
                        <p className="text-xs text-gray-400 mt-2">* Saldo wallet tidak bisa diubah langsung. Gunakan transaksi atau transfer.</p>
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

            {/* modal konfirmasi hapus — tampilkan nama wallet biar user yakin */}
            <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Hapus Wallet">
                <div className="text-center space-y-4">
                    <p className="text-gray-600 text-sm">
                        Yakin mau hapus wallet <span className="font-semibold">"{selectedWallet?.name}"</span>?
                        Semua transaksi di wallet ini juga akan terhapus.
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

export default Wallet