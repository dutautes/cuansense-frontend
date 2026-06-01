import { useState, useEffect } from "react"
import api from "../api/axios"
import Modal from "../components/Modal"
import toast from "react-hot-toast"
import dayjs from "dayjs"
import {
    RiCalendarLine, RiEditLine, RiAddLine,
    RiDeleteBin6Line, RiAlertLine, RiCheckLine
} from "react-icons/ri"

const formatRupiah = (amount) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount)
}

const MONTHS = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

const Budget = () => {
    const [budgets, setBudgets] = useState([])
    const [currentBudget, setCurrentBudget] = useState(null)
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [selectedBudget, setSelectedBudget] = useState(null)
    const [submitLoading, setSubmitLoading] = useState(false)

    const now = dayjs()
    const [form, setForm] = useState({
        month: now.month() + 1,
        year: now.year(),
        limit_amount: '',
    })
    const [editForm, setEditForm] = useState({ limit_amount: '' })

    const fetchBudgets = async () => {
        setLoading(true)
        try {
            const [allRes, currentRes] = await Promise.all([
                api.get('/budgets'),
                api.get(`/budgets/detail?month=${now.month() + 1}&year=${now.year()}`).catch(() => null)
            ])
            setBudgets(allRes.data.data)
            if (currentRes) setCurrentBudget(currentRes.data.data)
            else setCurrentBudget(null)
        } catch (error) {
            toast.error('Gagal memuat budget')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBudgets()
    }, [])

    const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.limit_amount) {
            toast.error('Jumlah budget wajib diisi!')
            return
        }
        setSubmitLoading(true)
        try {
            await api.post('/budgets', {
                month: Number(form.month),
                year: Number(form.year),
                limit_amount: Number(form.limit_amount),
            })
            toast.success('Budget berhasil dibuat!')
            setModalOpen(false)
            setForm({ month: now.month() + 1, year: now.year(), limit_amount: '' })
            fetchBudgets()
        } catch (error) {
            toast.error(error.response?.data?.data || 'Gagal membuat budget')
        } finally {
            setSubmitLoading(false)
        }
    }

    const handleEditSubmit = async (e) => {
        e.preventDefault()
        if (!editForm.limit_amount) {
            toast.error('Jumlah budget wajib diisi!')
            return
        }
        setSubmitLoading(true)
        try {
            await api.put(`/budgets/${selectedBudget.id}`, {
                limit_amount: Number(editForm.limit_amount),
            })
            toast.success('Budget berhasil diupdate!')
            setEditModalOpen(false)
            fetchBudgets()
        } catch (error) {
            toast.error(error.response?.data?.data || 'Gagal mengupdate budget')
        } finally {
            setSubmitLoading(false)
        }
    }

    const handleDeleteConfirm = async () => {
        try {
            await api.delete(`/budgets/${selectedBudget.id}`)
            toast.success('Budget berhasil dihapus!')
            setDeleteModalOpen(false)
            setSelectedBudget(null)
            fetchBudgets()
        } catch (error) {
            toast.error('Gagal menghapus budget')
        }
    }

    const openEditModal = (b) => {
        setSelectedBudget(b)
        setEditForm({ limit_amount: b.limit_amount })
        setEditModalOpen(true)
    }

    // warna progress bar berdasarkan persentase
    const getProgressColor = (pct) => {
        if (pct >= 100) return 'bg-red-500'
        if (pct >= 80) return 'bg-yellow-400'
        return 'bg-green-500'
    }

    // status badge
    const getBadge = (b) => {
        if (b.is_over_limit) return { label: 'Over Limit', cls: 'bg-red-100 text-red-600' }
        if (b.is_warning) return { label: `${b.percentage_used}% Terpakai`, cls: 'bg-yellow-100 text-yellow-600' }
        return { label: 'Aman', cls: 'bg-green-100 text-green-600' }
    }

    const historyBudgets = budgets.filter(b => !(b.month === now.month() + 1 && b.year === now.year()))

    return (
        <div className="space-y-6">

            {/* header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Budget</h1>
                    <p className="text-gray-500 text-sm mt-0.5">Kontrol pengeluaran bulanan kamu</p>
                </div>
                <button
                    onClick={() => setModalOpen(true)}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors"
                >
                    <RiAddLine size={18} />
                    Set Budget
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-48">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-gray-400 text-sm">Memuat budget...</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* current month budget */}
                    {currentBudget ? (
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <RiCalendarLine size={16} className="text-green-500" />
                                        <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                                            {MONTHS[now.month()]} {now.year()}
                                        </span>
                                    </div>
                                    {(() => {
                                        const badge = getBadge(currentBudget)
                                        return (
                                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${badge.cls}`}>
                                                {currentBudget.is_over_limit && <RiAlertLine className="inline mr-1" size={11} />}
                                                {!currentBudget.is_over_limit && !currentBudget.is_warning && <RiCheckLine className="inline mr-1" size={11} />}
                                                {badge.label}
                                            </span>
                                        )
                                    })()}
                                </div>
                                <button
                                    onClick={() => openEditModal(currentBudget)}
                                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
                                >
                                    <RiEditLine size={16} />
                                </button>
                            </div>

                            <p className="text-3xl font-bold text-gray-800">
                                {formatRupiah(currentBudget.used_amount)}
                            </p>
                            <p className="text-sm text-gray-400 mt-0.5">
                                dari {formatRupiah(currentBudget.limit_amount)} total budget
                            </p>

                            {/* progress bar */}
                            <div className="mt-4">
                                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${getProgressColor(currentBudget.percentage_used)}`}
                                        style={{ width: `${Math.min(currentBudget.percentage_used, 100)}%` }}
                                    />
                                </div>
                                <div className="flex justify-between mt-1.5">
                                    <span className="text-xs text-gray-400">Rp 0</span>
                                    <span className={`text-xs font-medium ${currentBudget.is_over_limit ? 'text-red-500' : 'text-gray-500'}`}>
                                        {currentBudget.is_over_limit
                                            ? `Melebihi ${formatRupiah(Math.abs(currentBudget.remaining_amount))}`
                                            : `Sisa ${formatRupiah(currentBudget.remaining_amount)}`
                                        }
                                    </span>
                                </div>
                            </div>

                            {/* stats row */}
                            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-50">
                                <div>
                                    <p className="text-xs text-gray-400">Terpakai</p>
                                    <p className="font-bold text-gray-700 text-sm mt-0.5">{currentBudget.percentage_used}%</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Harian rata-rata</p>
                                    <p className="font-bold text-gray-700 text-sm mt-0.5">
                                        {formatRupiah(currentBudget.used_amount / now.date())}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Sisa hari</p>
                                    <p className="font-bold text-gray-700 text-sm mt-0.5">
                                        {now.daysInMonth() - now.date()} hari
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl p-8 shadow-sm border-2 border-dashed border-gray-200 flex flex-col items-center gap-3">
                            <RiCalendarLine size={36} className="text-gray-200" />
                            <p className="text-gray-500 text-sm font-medium">
                                Belum ada budget untuk {MONTHS[now.month()]} {now.year()}
                            </p>
                            <button
                                onClick={() => setModalOpen(true)}
                                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                            >
                                Set Budget Bulan Ini
                            </button>
                        </div>
                    )}

                    {/* history */}
                    {historyBudgets.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-50">
                            <div className="flex items-center justify-between p-5 border-b border-gray-50">
                                <h3 className="font-semibold text-gray-700">Riwayat Budget</h3>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {historyBudgets.map(b => {
                                    const badge = getBadge(b)
                                    return (
                                        <div key={b.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                                                    <span className="text-xs font-bold text-gray-500">
                                                        {String(b.month).padStart(2, '0')}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-700">
                                                        {MONTHS[b.month - 1]} {b.year}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        Budget: {formatRupiah(b.limit_amount)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-gray-700">
                                                        {formatRupiah(b.used_amount)}
                                                    </p>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${badge.cls}`}>
                                                        {badge.label}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => openEditModal(b)}
                                                        className="p-1.5 text-gray-300 hover:text-blue-400 transition-colors"
                                                    >
                                                        <RiEditLine size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedBudget(b)
                                                            setDeleteModalOpen(true)
                                                        }}
                                                        className="p-1.5 text-gray-300 hover:text-red-400 transition-colors"
                                                    >
                                                        <RiDeleteBin6Line size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* modal tambah budget */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Set Budget Baru">
                <form onSubmit={handleSubmit} className="space-y-4">

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bulan</label>
                            <select
                                name="month"
                                value={form.month}
                                onChange={handleFormChange}
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                            >
                                {MONTHS.map((m, i) => (
                                    <option key={i} value={i + 1}>{m}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
                            <select
                                name="year"
                                value={form.year}
                                onChange={handleFormChange}
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                            >
                                {[now.year() - 1, now.year(), now.year() + 1].map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Batas Budget (Rp)</label>
                        <input
                            type="number"
                            name="limit_amount"
                            value={form.limit_amount}
                            onChange={handleFormChange}
                            placeholder="Contoh: 5000000"
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitLoading}
                        className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors"
                    >
                        {submitLoading ? 'Menyimpan...' : 'Set Budget'}
                    </button>
                </form>
            </Modal>

            {/* modal edit budget */}
            <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Ubah Budget">
                <form onSubmit={handleEditSubmit} className="space-y-4">
                    {selectedBudget && (
                        <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-600">
                            Budget untuk: <span className="font-semibold">
                                {selectedBudget ? `${MONTHS[selectedBudget.month - 1]} ${selectedBudget.year}` : ''}
                            </span>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Batas Budget Baru (Rp)</label>
                        <input
                            type="number"
                            value={editForm.limit_amount}
                            onChange={(e) => setEditForm({ limit_amount: e.target.value })}
                            placeholder="Masukkan jumlah baru"
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
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

            {/* modal delete */}
            <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Hapus Budget">
                <div className="text-center space-y-4">
                    <p className="text-gray-600 text-sm">
                        Yakin mau hapus budget{' '}
                        <span className="font-semibold">
                            {selectedBudget ? `${MONTHS[selectedBudget.month - 1]} ${selectedBudget.year}` : ''}
                        </span>?
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

export default Budget