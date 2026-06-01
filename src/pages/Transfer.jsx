import { useState, useEffect } from "react"
import api from "../api/axios"
import Modal from "../components/Modal"
import toast from "react-hot-toast"
import dayjs from "dayjs"
import { RiAddLine, RiDeleteBin6Line, RiArrowRightLine, RiExchangeLine } from "react-icons/ri"

// helper format rupiah, konsisten dipake di seluruh file
const formatRupiah = (amount) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount)
}

const Transfer = () => {
    const [transfers, setTransfers] = useState([])
    const [wallets, setWallets] = useState([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [selectedId, setSelectedId] = useState(null) // id transfer yang mau dihapus
    const [submitLoading, setSubmitLoading] = useState(false)
    const [page, setPage] = useState(1)
    const [pagination, setPagination] = useState({})

    // state form transfer, semua field default kosong kecuali tanggal
    const [form, setForm] = useState({
        from_wallet_id: '',
        to_wallet_id: '',
        amount: '',
        description: '',
        transfer_date: dayjs().format('YYYY-MM-DD'), // default hari ini
    })

    // fetch daftar transfer dengan pagination, currentPage dipake saat ganti halaman
    const fetchTransfers = async (currentPage = 1) => {
        setLoading(true)
        try {
            const res = await api.get(`/transfers?page=${currentPage}&limit=10`)
            setTransfers(res.data.data.data)
            setPagination(res.data.data.pagination)
        } catch (error) {
            toast.error('Gagal memuat data transfer')
        } finally {
            setLoading(false)
        }
    }

    // fetch wallet terpisah karena dibutuhkan buat form & summary card
    const fetchWallets = async () => {
        try {
            const res = await api.get('/wallets')
            setWallets(res.data.data)
        } catch (error) {
            console.error(error)
        }
    }

    // jalanin fetchTransfers setiap page berubah
    useEffect(() => {
        fetchTransfers(page)
    }, [page])

    // fetchWallets cukup sekali saat mount
    useEffect(() => {
        fetchWallets()
    }, [])

    // generic handler form, pake computed property biar ga perlu bikin handler satu-satu
    const handleFormChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        // validasi dasar sebelum kirim ke API
        if (!form.from_wallet_id || !form.to_wallet_id || !form.amount || !form.transfer_date) {
            toast.error('Semua field wajib diisi!')
            return
        }
        // cek jangan sampai transfer ke wallet yang sama
        if (form.from_wallet_id === form.to_wallet_id) {
            toast.error('Wallet asal dan tujuan tidak boleh sama!')
            return
        }

        setSubmitLoading(true)
        try {
            // kirim sebagai JSON biasa (bukan FormData), karena ga ada upload file
            // konversi id & amount ke Number karena dari input nilainya string
            await api.post('/transfers', {
                from_wallet_id: Number(form.from_wallet_id),
                to_wallet_id: Number(form.to_wallet_id),
                amount: Number(form.amount),
                description: form.description,
                transfer_date: form.transfer_date,
            })
            toast.success('Transfer berhasil!')
            setModalOpen(false)

            // reset form setelah berhasil
            setForm({
                from_wallet_id: '',
                to_wallet_id: '',
                amount: '',
                description: '',
                transfer_date: dayjs().format('YYYY-MM-DD'),
            })

            // refresh data — saldo wallet berubah setelah transfer
            fetchTransfers(page)
            fetchWallets()
        } catch (error) {
            toast.error(error.response?.data?.data || 'Gagal melakukan transfer')
        } finally {
            setSubmitLoading(false)
        }
    }

    const handleDeleteConfirm = async () => {
        try {
            await api.delete(`/transfers/${selectedId}`)
            toast.success('Transfer berhasil dihapus!')
            setDeleteModalOpen(false)
            setSelectedId(null)
            // saldo kedua wallet dikembalikan otomatis di backend lewat transaction
            fetchTransfers(page)
            fetchWallets()
        } catch (error) {
            toast.error('Gagal menghapus transfer')
        }
    }

    // filter wallet tujuan — buang wallet yang sama dengan asal biar ga bisa pilih diri sendiri
    const toWalletOptions = wallets.filter(w => String(w.id) !== String(form.from_wallet_id))
    // cari objek wallet asal buat tampilkan saldo tersedia di bawah dropdown
    const fromWallet = wallets.find(w => String(w.id) === String(form.from_wallet_id))

    return (
        <div className="space-y-6">

            {/* header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Transfer</h1>
                    <p className="text-gray-500 text-sm mt-0.5">Pindahkan dana antar wallet kamu</p>
                </div>
                <button
                    onClick={() => setModalOpen(true)}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors"
                >
                    <RiAddLine size={18} />
                    Transfer Dana
                </button>
            </div>

            {/* wallet summary cards — cuma tampil kalau ada wallet */}
            {wallets.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {wallets.map(w => (
                        <div key={w.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
                            {/* kotak warna kecil dengan inisial nama wallet */}
                            <div
                                className="w-8 h-8 rounded-lg mb-2 flex items-center justify-center text-white text-xs font-bold"
                                style={{ backgroundColor: w.color || '#22c55e' }}
                            >
                                {w.name.charAt(0).toUpperCase()}
                            </div>
                            <p className="text-xs text-gray-500 truncate">{w.name}</p>
                            <p className="text-sm font-bold text-gray-800 mt-0.5">{formatRupiah(w.balance)}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* tabel riwayat transfer */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-gray-400 text-sm">Memuat data...</p>
                        </div>
                    </div>
                ) : transfers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 gap-2">
                        <RiExchangeLine size={36} className="text-gray-200" />
                        <p className="text-gray-400 text-sm">Belum ada riwayat transfer</p>
                        <button
                            onClick={() => setModalOpen(true)}
                            className="text-green-500 text-sm font-medium hover:underline"
                        >
                            Buat transfer pertama
                        </button>
                    </div>
                ) : (
                    <>
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Tanggal</th>
                                    <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Dari</th>
                                    {/* kolom kosong buat ikon panah di tengah */}
                                    <th className="text-center text-xs font-semibold text-gray-500 px-2 py-3"></th>
                                    <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Ke</th>
                                    <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Deskripsi</th>
                                    <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">Jumlah</th>
                                    <th className="text-center text-xs font-semibold text-gray-500 px-5 py-3">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {transfers.map((trx) => (
                                    <tr key={trx.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-5 py-3.5 text-sm text-gray-600">
                                            {dayjs(trx.transfer_date).format('DD MMM YYYY')}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            {/* kotak warna kecil + nama wallet asal */}
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                                    style={{ backgroundColor: trx.from_wallet?.color || '#6b7280' }}
                                                >
                                                    {trx.from_wallet?.name?.charAt(0)}
                                                </div>
                                                <span className="text-sm text-gray-700">{trx.from_wallet?.name}</span>
                                            </div>
                                        </td>
                                        {/* ikon panah biru penanda arah transfer */}
                                        <td className="px-2 py-3.5 text-center">
                                            <RiArrowRightLine size={16} className="text-blue-400 mx-auto" />
                                        </td>
                                        <td className="px-5 py-3.5">
                                            {/* kotak warna kecil + nama wallet tujuan */}
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                                    style={{ backgroundColor: trx.to_wallet?.color || '#6b7280' }}
                                                >
                                                    {trx.to_wallet?.name?.charAt(0)}
                                                </div>
                                                <span className="text-sm text-gray-700">{trx.to_wallet?.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="text-sm text-gray-500">{trx.description || '-'}</span>
                                        </td>
                                        {/* jumlah ditampilkan biru karena transfer netral (bukan income/expense) */}
                                        <td className="px-5 py-3.5 text-right">
                                            <span className="text-sm font-semibold text-blue-500">
                                                {formatRupiah(trx.amount)}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            <button
                                                onClick={() => {
                                                    setSelectedId(trx.id)
                                                    setDeleteModalOpen(true)
                                                }}
                                                className="text-gray-300 hover:text-red-400 transition-colors"
                                            >
                                                <RiDeleteBin6Line size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* pagination — cuma muncul kalau lebih dari 1 halaman */}
                        {pagination.total_pages > 1 && (
                            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                                <p className="text-xs text-gray-400">Total {pagination.total_data} transfer</p>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setPage(p => p - 1)}
                                        disabled={page === 1}
                                        className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
                                    >←</button>
                                    {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setPage(p)}
                                            className={`px-3 py-1.5 text-xs rounded-lg border transition ${
                                                page === p ? 'bg-green-500 text-white border-green-500' : 'border-gray-200 hover:bg-gray-50'
                                            }`}
                                        >{p}</button>
                                    ))}
                                    <button
                                        onClick={() => setPage(p => p + 1)}
                                        disabled={page === pagination.total_pages}
                                        className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
                                    >→</button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* modal tambah transfer */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Transfer Dana">
                <form onSubmit={handleSubmit} className="space-y-4">

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dari Wallet</label>
                        <select
                            name="from_wallet_id"
                            value={form.from_wallet_id}
                            onChange={handleFormChange}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                        >
                            <option value="">Pilih wallet asal</option>
                            {wallets.map(w => (
                                <option key={w.id} value={w.id}>
                                    {w.name} ({formatRupiah(w.balance)})
                                </option>
                            ))}
                        </select>
                        {/* tampilkan saldo tersedia setelah wallet asal dipilih */}
                        {fromWallet && (
                            <p className="text-xs text-gray-400 mt-1">
                                Saldo tersedia: <span className="text-green-500 font-medium">{formatRupiah(fromWallet.balance)}</span>
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ke Wallet</label>
                        <select
                            name="to_wallet_id"
                            value={form.to_wallet_id}
                            onChange={handleFormChange}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                        >
                            <option value="">Pilih wallet tujuan</option>
                            {/* toWalletOptions udah difilter, ga akan ada wallet yang sama kayak asal */}
                            {toWalletOptions.map(w => (
                                <option key={w.id} value={w.id}>
                                    {w.name} ({formatRupiah(w.balance)})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah</label>
                        <input
                            type="number"
                            name="amount"
                            value={form.amount}
                            onChange={handleFormChange}
                            placeholder="0"
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                        <input
                            type="date"
                            name="transfer_date"
                            value={form.transfer_date}
                            onChange={handleFormChange}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Deskripsi <span className="text-gray-400">(opsional)</span>
                        </label>
                        <input
                            type="text"
                            name="description"
                            value={form.description}
                            onChange={handleFormChange}
                            placeholder="Catatan transfer..."
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitLoading}
                        className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors"
                    >
                        {submitLoading ? 'Memproses...' : 'Transfer Sekarang'}
                    </button>
                </form>
            </Modal>

            {/* modal konfirmasi hapus transfer */}
            <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Hapus Transfer">
                <div className="text-center space-y-4">
                    <p className="text-gray-600 text-sm">
                        Yakin mau hapus transfer ini? Saldo kedua wallet akan dikembalikan secara otomatis.
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

export default Transfer