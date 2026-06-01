import { useState, useEffect, useCallback } from "react"
import api from "../api/axios"
import toast from "react-hot-toast"
import dayjs from "dayjs"
import {
    RiSearchLine, RiFilterLine,
    RiArrowUpCircleLine, RiArrowDownCircleLine, RiArrowLeftRightLine,
    RiCalendarLine
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
                end: now.subtract(1, 'month').endOf('month').format('YYYY-MM-DD')
            }
        case '3months':
            return { start: now.subtract(3, 'month').startOf('month').format('YYYY-MM-DD'), end: now.format('YYYY-MM-DD') }
        case 'thisYear':
            return { start: now.startOf('year').format('YYYY-MM-DD'), end: now.endOf('year').format('YYYY-MM-DD') }
        case 'all':
        default:
            return { start: '', end: '' }
    }
}

const Histori = () => {
    const [transactions, setTransactions] = useState([])
    const [summary, setSummary] = useState({ income: 0, expense: 0, transfer: 0 })
    const [wallets, setWallets] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [pagination, setPagination] = useState({})

    const [filter, setFilter] = useState({
        type: '',
        wallet_id: '',
        category_id: '',
        search: '',
        period: 'thisMonth',
        page: 1,
        limit: 10,
    })

    const [activeType, setActiveType] = useState('all') // 'all' | 'income' | 'expense' | 'transfer'

    const fetchHistory = useCallback(async () => {
        setLoading(true)
        try {
            const { start, end } = getPeriodDates(filter.period)
            const params = new URLSearchParams()
            if (filter.type) params.append('type', filter.type)
            if (filter.wallet_id) params.append('wallet_id', filter.wallet_id)
            if (filter.category_id) params.append('category_id', filter.category_id)
            if (start) params.append('start_date', start)
            if (end) params.append('end_date', end)
            params.append('page', filter.page)
            params.append('limit', filter.limit)

            const res = await api.get(`/transactions?${params.toString()}`)
            const data = res.data.data
            setTransactions(data.data)
            setPagination(data.pagination)

            // hitung summary dari semua data (bukan hanya halaman ini)
            const sumRes = await api.get(`/transactions?${params.toString()}&limit=9999&page=1`)
            const allData = sumRes.data.data.data
            const inc = allData.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0)
            const exp = allData.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0)
            setSummary({ income: inc, expense: exp, transfer: 0 })
        } catch (error) {
            toast.error('Gagal memuat histori')
        } finally {
            setLoading(false)
        }
    }, [filter])

    const fetchFormData = async () => {
        try {
            const [wRes, cRes] = await Promise.all([api.get('/wallets'), api.get('/categories')])
            setWallets(wRes.data.data)
            setCategories(cRes.data.data)
        } catch (_) {}
    }

    useEffect(() => {
        fetchHistory()
    }, [fetchHistory])

    useEffect(() => {
        fetchFormData()
    }, [])

    const handleTypeTab = (type) => {
        setActiveType(type)
        setFilter(prev => ({
            ...prev,
            type: type === 'all' ? '' : type,
            page: 1,
        }))
    }

    const handleFilterChange = (e) => {
        setFilter(prev => ({ ...prev, [e.target.name]: e.target.value, page: 1 }))
    }

    const typeConfig = {
        income: { label: 'Pemasukan', icon: RiArrowUpCircleLine, color: 'text-green-500', bg: 'bg-green-50' },
        expense: { label: 'Pengeluaran', icon: RiArrowDownCircleLine, color: 'text-red-500', bg: 'bg-red-50' },
    }

    return (
        <div className="space-y-6">

            {/* header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Histori</h1>
                    <p className="text-gray-500 text-sm mt-0.5">Lacak semua aktivitas keuangan kamu</p>
                </div>
            </div>

            {/* summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                        <RiArrowUpCircleLine size={22} className="text-green-500" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">Total Pemasukan</p>
                        <p className="font-bold text-green-500 text-lg">{formatRupiah(summary.income)}</p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 flex items-center gap-4">
                    <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                        <RiArrowDownCircleLine size={22} className="text-red-500" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">Total Pengeluaran</p>
                        <p className="font-bold text-red-500 text-lg">{formatRupiah(summary.expense)}</p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                        <RiArrowLeftRightLine size={22} className="text-blue-500" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">Selisih Bersih</p>
                        <p className={`font-bold text-lg ${summary.income - summary.expense >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {formatRupiah(summary.income - summary.expense)}
                        </p>
                    </div>
                </div>
            </div>

            {/* filter bar */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 space-y-3">
                {/* tab type */}
                <div className="flex items-center gap-2 flex-wrap">
                    {['all', 'income', 'expense'].map(t => (
                        <button
                            key={t}
                            onClick={() => handleTypeTab(t)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                activeType === t
                                    ? t === 'income'
                                        ? 'bg-green-500 text-white'
                                        : t === 'expense'
                                            ? 'bg-red-500 text-white'
                                            : 'bg-gray-800 text-white'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                        >
                            {t === 'all' ? 'Semua' : t === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                        </button>
                    ))}

                    <div className="ml-auto flex items-center gap-2">
                        <RiCalendarLine size={14} className="text-gray-400" />
                        <select
                            name="period"
                            value={filter.period}
                            onChange={handleFilterChange}
                            className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                        >
                            {PERIOD_OPTIONS.map(p => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* filter row 2 */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <select
                        name="wallet_id"
                        value={filter.wallet_id}
                        onChange={handleFilterChange}
                        className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                    >
                        <option value="">Semua Wallet</option>
                        {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>

                    <select
                        name="category_id"
                        value={filter.category_id}
                        onChange={handleFilterChange}
                        className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                    >
                        <option value="">Semua Kategori</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                    </select>

                    <button
                        onClick={() => {
                            setFilter({ type: '', wallet_id: '', category_id: '', search: '', period: 'thisMonth', page: 1, limit: 10 })
                            setActiveType('all')
                        }}
                        className="border border-gray-200 text-gray-500 rounded-xl px-3 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
                    >
                        <RiFilterLine size={14} />
                        Reset Filter
                    </button>
                </div>
            </div>

            {/* tabel transaksi */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-gray-400 text-sm">Memuat histori...</p>
                        </div>
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 gap-2">
                        <RiSearchLine size={36} className="text-gray-200" />
                        <p className="text-gray-400 text-sm">Tidak ada transaksi ditemukan</p>
                    </div>
                ) : (
                    <>
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Deskripsi</th>
                                    <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Kategori</th>
                                    <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Tanggal</th>
                                    <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">Jumlah</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {transactions.map((trx) => {
                                    const cfg = typeConfig[trx.type] || typeConfig.expense
                                    const Icon = cfg.icon
                                    return (
                                        <tr key={trx.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                                                        <Icon size={18} className={cfg.color} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-700">
                                                            {trx.description || trx.category?.name || '-'}
                                                        </p>
                                                        <p className="text-xs text-gray-400">{trx.wallet?.name}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                                                    {trx.category?.icon} {trx.category?.name}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className="text-sm text-gray-500">
                                                    {dayjs(trx.transaction_date).format('DD MMM YYYY')}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <div>
                                                    <p className={`text-sm font-bold ${trx.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                                                        {trx.type === 'income' ? '+' : '-'}{formatRupiah(trx.amount)}
                                                    </p>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                        trx.type === 'income'
                                                            ? 'bg-green-100 text-green-600'
                                                            : 'bg-red-100 text-red-500'
                                                    }`}>
                                                        {trx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>

                        {/* pagination */}
                        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                            <p className="text-xs text-gray-400">
                                Menampilkan {(filter.page - 1) * filter.limit + 1}–{Math.min(filter.page * filter.limit, pagination.total_data)} dari {pagination.total_data} transaksi
                            </p>
                            {pagination.total_pages > 1 && (
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setFilter(f => ({ ...f, page: f.page - 1 }))}
                                        disabled={filter.page === 1}
                                        className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
                                    >←</button>
                                    {Array.from({ length: pagination.total_pages }, (_, i) => i + 1)
                                        .filter(p => Math.abs(p - filter.page) <= 2)
                                        .map(p => (
                                            <button
                                                key={p}
                                                onClick={() => setFilter(f => ({ ...f, page: p }))}
                                                className={`px-3 py-1.5 text-xs rounded-lg border transition ${
                                                    filter.page === p ? 'bg-green-500 text-white border-green-500' : 'border-gray-200 hover:bg-gray-50'
                                                }`}
                                            >{p}</button>
                                        ))
                                    }
                                    <button
                                        onClick={() => setFilter(f => ({ ...f, page: f.page + 1 }))}
                                        disabled={filter.page === pagination.total_pages}
                                        className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
                                    >→</button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default Histori