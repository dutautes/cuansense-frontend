import { useState, useEffect, useCallback } from "react"
import api from "../api/axios"
import Modal from "../components/Modal"
import toast from "react-hot-toast"
import dayjs from "dayjs"
import {
    RiAddLine, RiDeleteBin6Line, RiImageLine,
    RiArrowUpCircleLine, RiArrowDownCircleLine,
    RiSearchLine, RiSlidersLine, RiReceiptLine
} from "react-icons/ri"

const formatRupiah = (amount) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount)
}

const PERIOD_OPTIONS = [
    { label: 'Bulan Ini', value: 'thisMonth' },
    { label: 'Bulan Lalu', value: 'lastMonth' },
    { label: '3 Bulan Terakhir', value: '3months' },
    { label: 'Tahun Ini', value: 'thisYear' },
    { label: 'Semua', value: 'all' },
]

const getPeriodDates = (period) => {
    const now = dayjs()
    switch (period) {
        case 'thisMonth':
            return { start: now.startOf('month').format('YYYY-MM-DD'), end: now.endOf('month').format('YYYY-MM-DD') }
        case 'lastMonth':
            return {
                start: now.subtract(1, 'month').startOf('month').format('YYYY-MM-DD'),
                end: now.subtract(1, 'month').endOf('month').format('YYYY-MM-DD'),
            }
        case '3months':
            return { start: now.subtract(3, 'month').startOf('month').format('YYYY-MM-DD'), end: now.format('YYYY-MM-DD') }
        case 'thisYear':
            return { start: now.startOf('year').format('YYYY-MM-DD'), end: now.endOf('year').format('YYYY-MM-DD') }
        default:
            return { start: '', end: '' }
    }
}

const Transaksi = () => {
    const [transactions, setTransactions] = useState([])
    const [allTransactions, setAllTransactions] = useState([]) // untuk hitung summary
    const [wallets, setWallets] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [selectedId, setSelectedId] = useState(null)
    const [submitLoading, setSubmitLoading] = useState(false)
    const [proofImage, setProofImage] = useState(null)

    // filter state
    const [activeType, setActiveType] = useState('all') // tab type: all | income | expense
    const [period, setPeriod] = useState('thisMonth')
    const [walletFilter, setWalletFilter] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('')
    const [showFilterPanel, setShowFilterPanel] = useState(false)
    const [page, setPage] = useState(1)
    const [pagination, setPagination] = useState({})

    // form state
    const [form, setForm] = useState({
        wallet_id: '',
        category_id: '',
        type: 'expense',
        amount: '',
        description: '',
        transaction_date: dayjs().format('YYYY-MM-DD'),
    })

    // fetch transaksi (halaman ini)
    const fetchTransactions = useCallback(async () => {
        setLoading(true)
        try {
            const { start, end } = getPeriodDates(period)
            const params = new URLSearchParams()
            if (activeType !== 'all') params.append('type', activeType)
            if (walletFilter) params.append('wallet_id', walletFilter)
            if (categoryFilter) params.append('category_id', categoryFilter)
            if (start) params.append('start_date', start)
            if (end) params.append('end_date', end)
            params.append('page', page)
            params.append('limit', 10)

            const res = await api.get(`/transactions?${params.toString()}`)
            setTransactions(res.data.data.data)
            setPagination(res.data.data.pagination)
        } catch (_) {
            toast.error('Gagal memuat transaksi')
        } finally {
            setLoading(false)
        }
    }, [activeType, period, walletFilter, categoryFilter, page])

    // fetch semua transaksi periode ini untuk summary card
    const fetchSummary = useCallback(async () => {
        try {
            const { start, end } = getPeriodDates(period)
            const params = new URLSearchParams()
            if (start) params.append('start_date', start)
            if (end) params.append('end_date', end)
            params.append('limit', 9999)
            params.append('page', 1)
            const res = await api.get(`/transactions?${params.toString()}`)
            setAllTransactions(res.data.data.data)
        } catch (_) {}
    }, [period])

    // fetch wallet & kategori untuk dropdown
    const fetchFormData = async () => {
        try {
            const [wRes, cRes] = await Promise.all([api.get('/wallets'), api.get('/categories')])
            setWallets(wRes.data.data)
            setCategories(cRes.data.data)
        } catch (_) {}
    }

    useEffect(() => {
        fetchTransactions()
    }, [fetchTransactions])

    useEffect(() => {
        fetchSummary()
    }, [fetchSummary])

    useEffect(() => {
        fetchFormData()
    }, [])

    // reset page saat filter berubah
    const handleTypeTab = (type) => {
        setActiveType(type)
        setPage(1)
    }
    const handlePeriodChange = (e) => {
        setPeriod(e.target.value)
        setPage(1)
    }
    const handleWalletFilter = (e) => {
        setWalletFilter(e.target.value)
        setPage(1)
    }
    const handleCategoryFilter = (e) => {
        setCategoryFilter(e.target.value)
        setPage(1)
    }

    const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.wallet_id || !form.category_id || !form.amount || !form.transaction_date) {
            toast.error('Semua field wajib diisi!')
            return
        }
        setSubmitLoading(true)
        try {
            const formData = new FormData()
            formData.append('wallet_id', form.wallet_id)
            formData.append('category_id', form.category_id)
            formData.append('type', form.type)
            formData.append('amount', form.amount)
            formData.append('description', form.description)
            formData.append('transaction_date', form.transaction_date)
            if (proofImage) formData.append('proof_image', proofImage)

            await api.post('/transactions', formData)
            toast.success('Transaksi berhasil ditambahkan!')
            setModalOpen(false)
            setForm({
                wallet_id: '',
                category_id: '',
                type: 'expense',
                amount: '',
                description: '',
                transaction_date: dayjs().format('YYYY-MM-DD'),
            })
            setProofImage(null)
            fetchTransactions()
            fetchSummary()
            fetchFormData()
        } catch (error) {
            toast.error(error.response?.data?.data || 'Gagal menambahkan transaksi')
        } finally {
            setSubmitLoading(false)
        }
    }

    const handleDeleteConfirm = async () => {
        try {
            await api.delete(`/transactions/${selectedId}`)
            toast.success('Transaksi berhasil dihapus!')
            setDeleteModalOpen(false)
            setSelectedId(null)
            fetchTransactions()
            fetchSummary()
            fetchFormData()
        } catch (_) {
            toast.error('Gagal menghapus transaksi')
        }
    }

    // hitung summary
    const totalIncome = allTransactions
        .filter(t => t.type === 'income')
        .reduce((s, t) => s + parseFloat(t.amount), 0)
    const totalExpense = allTransactions
        .filter(t => t.type === 'expense')
        .reduce((s, t) => s + parseFloat(t.amount), 0)

    // kategori yang difilter sesuai type di form
    const filteredFormCategories = categories.filter(c => c.type === form.type)

    return (
        <div className="space-y-5">

            {/* ── HEADER ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Transaksi</h1>
                    <p className="text-gray-500 text-sm mt-0.5">Kelola pemasukan & pengeluaran kamu</p>
                </div>
                <button
                    onClick={() => setModalOpen(true)}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold transition-colors shadow-sm shadow-green-200"
                >
                    <RiAddLine size={18} />
                    Tambah Transaksi
                </button>
            </div>

            {/* ── SUMMARY CARDS ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 flex items-center gap-4">
                    <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <RiArrowDownCircleLine size={22} className="text-green-500" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-medium">Total Pemasukan</p>
                        <p className="font-bold text-green-500 text-lg leading-tight">
                            {formatRupiah(totalIncome)}
                        </p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 flex items-center gap-4">
                    <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <RiArrowUpCircleLine size={22} className="text-red-500" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-medium">Total Pengeluaran</p>
                        <p className="font-bold text-red-500 text-lg leading-tight">
                            {formatRupiah(totalExpense)}
                        </p>
                    </div>
                </div>
                <div className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-50 flex items-center gap-4`}>
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${totalIncome - totalExpense >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                        <RiReceiptLine size={22} className={totalIncome - totalExpense >= 0 ? 'text-blue-500' : 'text-orange-500'} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-medium">Selisih Bersih</p>
                        <p className={`font-bold text-lg leading-tight ${totalIncome - totalExpense >= 0 ? 'text-blue-500' : 'text-orange-500'}`}>
                            {formatRupiah(totalIncome - totalExpense)}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── TABEL CARD ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">

                {/* ── TOOLBAR: tab + periode + filter button ── */}
                <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-50 gap-3 flex-wrap">
                    {/* tab tipe */}
                    <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                        {[
                            { key: 'all', label: 'Semua' },
                            { key: 'income', label: 'Pemasukan' },
                            { key: 'expense', label: 'Pengeluaran' },
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => handleTypeTab(tab.key)}
                                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                    activeType === tab.key
                                        ? tab.key === 'income'
                                            ? 'bg-white text-green-500 shadow-sm'
                                            : tab.key === 'expense'
                                                ? 'bg-white text-red-500 shadow-sm'
                                                : 'bg-white text-gray-700 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* kanan: periode + filter */}
                    <div className="flex items-center gap-2">
                        <select
                            value={period}
                            onChange={handlePeriodChange}
                            className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-green-400"
                        >
                            {PERIOD_OPTIONS.map(p => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                        </select>
                        <button
                            onClick={() => setShowFilterPanel(!showFilterPanel)}
                            className={`p-2 rounded-xl border transition-colors ${
                                showFilterPanel || walletFilter || categoryFilter
                                    ? 'bg-green-500 border-green-500 text-white'
                                    : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
                            }`}
                        >
                            <RiSlidersLine size={16} />
                        </button>
                    </div>
                </div>

                {/* ── PANEL FILTER TAMBAHAN (collapsible) ── */}
                {showFilterPanel && (
                    <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-3 flex-wrap">
                        <select
                            value={walletFilter}
                            onChange={handleWalletFilter}
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
                        >
                            <option value="">Semua Wallet</option>
                            {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                        <select
                            value={categoryFilter}
                            onChange={handleCategoryFilter}
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
                        >
                            <option value="">Semua Kategori</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                        </select>
                        {(walletFilter || categoryFilter) && (
                            <button
                                onClick={() => { setWalletFilter(''); setCategoryFilter(''); setPage(1) }}
                                className="text-xs text-gray-400 hover:text-red-400 transition-colors"
                            >
                                Reset filter
                            </button>
                        )}
                    </div>
                )}

                {/* ── ISI TABEL ── */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-52 gap-3">
                        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-gray-400 text-sm">Memuat transaksi...</p>
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-52 gap-2">
                        <RiReceiptLine size={38} className="text-gray-200" />
                        <p className="text-gray-400 text-sm">Belum ada transaksi</p>
                        <button
                            onClick={() => setModalOpen(true)}
                            className="text-green-500 text-sm font-medium hover:underline"
                        >
                            Tambah transaksi pertama
                        </button>
                    </div>
                ) : (
                    <>
                        {/* header kolom */}
                        <div className="grid grid-cols-[2fr_1fr_1fr_auto] px-5 py-2.5 bg-gray-50 border-b border-gray-100">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Deskripsi</span>
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Kategori</span>
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Tanggal</span>
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">Jumlah</span>
                        </div>

                        {/* baris transaksi */}
                        <div className="divide-y divide-gray-50">
                            {transactions.map((trx) => (
                                <div
                                    key={trx.id}
                                    className="grid grid-cols-[2fr_1fr_1fr_auto] items-center px-5 py-3.5 hover:bg-gray-50/70 transition-colors group"
                                >
                                    {/* kolom 1: icon + nama + wallet */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
                                            trx.type === 'income' ? 'bg-green-50' : 'bg-red-50'
                                        }`}>
                                            {trx.category?.icon || (trx.type === 'income' ? '💰' : '💸')}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-gray-800 truncate leading-tight">
                                                {trx.description || trx.category?.name || '-'}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className="text-xs text-gray-400 truncate">
                                                    {trx.wallet?.name}
                                                </span>
                                                {trx.proof_image && (
                                                    <a
                                                        href={trx.proof_image}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-green-400 hover:text-green-500 transition-colors"
                                                        title="Lihat bukti"
                                                    >
                                                        <RiImageLine size={11} />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* kolom 2: kategori badge */}
                                    <div>
                                        <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                                            {trx.category?.icon}
                                            <span className="truncate max-w-[80px]">{trx.category?.name}</span>
                                        </span>
                                    </div>

                                    {/* kolom 3: tanggal */}
                                    <div>
                                        <span className="text-sm text-gray-500">
                                            {dayjs(trx.transaction_date).format('DD MMM YYYY')}
                                        </span>
                                    </div>

                                    {/* kolom 4: jumlah + badge + delete */}
                                    <div className="flex items-center gap-3 justify-end">
                                        <div className="text-right">
                                            <p className={`text-sm font-bold ${trx.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                                                {trx.type === 'income' ? '+' : '-'}{formatRupiah(trx.amount)}
                                            </p>
                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                                                trx.type === 'income'
                                                    ? 'bg-green-100 text-green-600'
                                                    : 'bg-red-100 text-red-500'
                                            }`}>
                                                {trx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setSelectedId(trx.id)
                                                setDeleteModalOpen(true)
                                            }}
                                            className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all p-1 rounded-lg hover:bg-red-50"
                                        >
                                            <RiDeleteBin6Line size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* ── PAGINATION ── */}
                        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                            <p className="text-xs text-gray-400">
                                Menampilkan {(page - 1) * 10 + 1}–{Math.min(page * 10, pagination.total_data || 0)} dari{' '}
                                <span className="font-medium text-gray-600">{pagination.total_data || 0}</span> transaksi
                            </p>
                            {pagination.total_pages > 1 && (
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setPage(p => p - 1)}
                                        disabled={page === 1}
                                        className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
                                    >←</button>
                                    {Array.from({ length: pagination.total_pages }, (_, i) => i + 1)
                                        .filter(p => Math.abs(p - page) <= 2)
                                        .map(p => (
                                            <button
                                                key={p}
                                                onClick={() => setPage(p)}
                                                className={`px-3 py-1.5 text-xs rounded-lg border transition ${
                                                    page === p
                                                        ? 'bg-green-500 text-white border-green-500'
                                                        : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                                                }`}
                                            >{p}</button>
                                        ))}
                                    <button
                                        onClick={() => setPage(p => p + 1)}
                                        disabled={page === pagination.total_pages}
                                        className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
                                    >→</button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* ── MODAL TAMBAH TRANSAKSI ── */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Tambah Transaksi">
                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* toggle expense / income */}
                    <div className="flex rounded-xl overflow-hidden border border-gray-200">
                        <button
                            type="button"
                            onClick={() => setForm({ ...form, type: 'expense', category_id: '' })}
                            className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                                form.type === 'expense'
                                    ? 'bg-red-500 text-white'
                                    : 'bg-white text-gray-400 hover:bg-gray-50'
                            }`}
                        >
                            💸 Pengeluaran
                        </button>
                        <button
                            type="button"
                            onClick={() => setForm({ ...form, type: 'income', category_id: '' })}
                            className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                                form.type === 'income'
                                    ? 'bg-green-500 text-white'
                                    : 'bg-white text-gray-400 hover:bg-gray-50'
                            }`}
                        >
                            💰 Pemasukan
                        </button>
                    </div>

                    {/* jumlah — paling mencolok */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Jumlah</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">Rp</span>
                            <input
                                type="number"
                                name="amount"
                                value={form.amount}
                                onChange={handleFormChange}
                                placeholder="0"
                                className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Wallet</label>
                            <select
                                name="wallet_id"
                                value={form.wallet_id}
                                onChange={handleFormChange}
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                            >
                                <option value="">Pilih wallet</option>
                                {wallets.map(w => (
                                    <option key={w.id} value={w.id}>{w.name} ({formatRupiah(w.balance)})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Kategori</label>
                            <select
                                name="category_id"
                                value={form.category_id}
                                onChange={handleFormChange}
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                            >
                                <option value="">Pilih kategori</option>
                                {filteredFormCategories.map(c => (
                                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Tanggal</label>
                        <input
                            type="date"
                            name="transaction_date"
                            value={form.transaction_date}
                            onChange={handleFormChange}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                            Deskripsi <span className="normal-case font-normal text-gray-400">(opsional)</span>
                        </label>
                        <input
                            type="text"
                            name="description"
                            value={form.description}
                            onChange={handleFormChange}
                            placeholder="Catatan transaksi..."
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                            Bukti <span className="normal-case font-normal text-gray-400">(opsional)</span>
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setProofImage(e.target.files[0])}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-green-50 file:text-green-600 file:text-xs"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitLoading}
                        className={`w-full text-white font-semibold py-3 rounded-xl transition-colors ${
                            form.type === 'income'
                                ? 'bg-green-500 hover:bg-green-600'
                                : 'bg-red-500 hover:bg-red-600'
                        } disabled:opacity-60`}
                    >
                        {submitLoading ? 'Menyimpan...' : `Simpan ${form.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}`}
                    </button>
                </form>
            </Modal>

            {/* ── MODAL KONFIRMASI DELETE ── */}
            <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Hapus Transaksi">
                <div className="text-center space-y-4">
                    <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto">
                        <RiDeleteBin6Line size={24} className="text-red-500" />
                    </div>
                    <div>
                        <p className="text-gray-800 font-semibold text-sm">Yakin mau hapus transaksi ini?</p>
                        <p className="text-gray-500 text-xs mt-1">Saldo wallet akan dikembalikan secara otomatis.</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setDeleteModalOpen(false)}
                            className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleDeleteConfirm}
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold transition"
                        >
                            Hapus
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

export default Transaksi