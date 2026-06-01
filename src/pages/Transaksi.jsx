import { useState, useEffect, useCallback } from "react"
import api from "../api/axios"
import Modal from "../components/Modal"
import toast from "react-hot-toast"
import dayjs from "dayjs"
import {
    RiAddLine, RiDeleteBin6Line, RiImageLine,
    RiArrowUpCircleLine, RiArrowDownCircleLine,
    RiSearchLine, RiFilter3Line, RiReceiptLine
} from "react-icons/ri"

// helper buat format angka jadi rupiah, dipake di banyak tempat
const formatRupiah = (amount) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount)
}

// daftar opsi periode yang bisa dipilih user di dropdown
const PERIOD_OPTIONS = [
    { label: 'Bulan Ini', value: 'thisMonth' },
    { label: 'Bulan Lalu', value: 'lastMonth' },
    { label: '3 Bulan Terakhir', value: '3months' },
    { label: 'Tahun Ini', value: 'thisYear' },
    { label: 'Semua', value: 'all' },
]

// fungsi bantu buat ngitung range tanggal berdasarkan pilihan periode
// dipanggil setiap kali mau fetch data biar query start_date & end_date-nya bener
const getPeriodDates = (period) => {
    const now = dayjs()
    switch (period) {
        case 'thisMonth':
            // awal sampai akhir bulan ini
            return { start: now.startOf('month').format('YYYY-MM-DD'), end: now.endOf('month').format('YYYY-MM-DD') }
        case 'lastMonth':
            // subtract(1, 'month') mundur satu bulan, lalu ambil awal & akhirnya
            return {
                start: now.subtract(1, 'month').startOf('month').format('YYYY-MM-DD'),
                end: now.subtract(1, 'month').endOf('month').format('YYYY-MM-DD'),
            }
        case '3months':
            // dari awal bulan 3 bulan lalu sampai hari ini
            return { start: now.subtract(3, 'month').startOf('month').format('YYYY-MM-DD'), end: now.format('YYYY-MM-DD') }
        case 'thisYear':
            // dari 1 Januari sampai 31 Desember tahun ini
            return { start: now.startOf('year').format('YYYY-MM-DD'), end: now.endOf('year').format('YYYY-MM-DD') }
        default:
            // kalau pilih "Semua", ga usah kasih filter tanggal
            return { start: '', end: '' }
    }
}

const Transaksi = () => {
    // transactions: data yang tampil di halaman (sudah dipaginasi)
    // allTransactions: semua data periode ini, khusus buat hitung summary card
    const [transactions, setTransactions] = useState([])
    const [allTransactions, setAllTransactions] = useState([])
    const [wallets, setWallets] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [selectedId, setSelectedId] = useState(null) // nyimpen id transaksi yang mau dihapus
    const [submitLoading, setSubmitLoading] = useState(false)
    const [proofImage, setProofImage] = useState(null) // file gambar bukti transaksi

    // state filter — dipisah dari form biar ga campur aduk
    const [activeType, setActiveType] = useState('all') // tab aktif: all | income | expense
    const [period, setPeriod] = useState('thisMonth')   // periode yang dipilih
    const [walletFilter, setWalletFilter] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('')
    const [showFilterPanel, setShowFilterPanel] = useState(false) // toggle panel filter tambahan
    const [page, setPage] = useState(1)
    const [pagination, setPagination] = useState({})

    // state form tambah transaksi, default type-nya expense
    const [form, setForm] = useState({
        wallet_id: '',
        category_id: '',
        type: 'expense',
        amount: '',
        description: '',
        transaction_date: dayjs().format('YYYY-MM-DD'), // default ke hari ini
    })

    // fetch transaksi yang tampil di tabel, responsif terhadap semua filter aktif
    // pake useCallback biar fungsinya ga bikin useEffect re-run terus-terusan
    const fetchTransactions = useCallback(async () => {
        setLoading(true)
        try {
            // ambil range tanggal dari pilihan periode
            const { start, end } = getPeriodDates(period)
            const params = new URLSearchParams()

            // cuma append ke params kalau filter-nya aktif, biar URL-nya bersih
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
    // ↑ useCallback auto-rebuild fungsi ini kalau salah satu dependensi berubah

    // fetch khusus buat hitung summary card (income & expense total periode ini)
    // sengaja limit=9999 biar dapet semua data, bukan cuma halaman ini
    const fetchSummary = useCallback(async () => {
        try {
            const { start, end } = getPeriodDates(period)
            const params = new URLSearchParams()
            if (start) params.append('start_date', start)
            if (end) params.append('end_date', end)
            params.append('limit', 9999) // ambil semua biar hitungannya akurat
            params.append('page', 1)
            const res = await api.get(`/transactions?${params.toString()}`)
            setAllTransactions(res.data.data.data)
        } catch (_) {}
    }, [period]) // summary cukup ikut perubahan periode

    // fetch wallet & kategori buat isian dropdown di modal form
    const fetchFormData = async () => {
        try {
            // parallel request biar lebih cepet daripada nunggu satu-satu
            const [wRes, cRes] = await Promise.all([api.get('/wallets'), api.get('/categories')])
            setWallets(wRes.data.data)
            setCategories(cRes.data.data)
        } catch (_) {}
    }

    // jalanin fetchTransactions setiap kali filter / page berubah
    useEffect(() => {
        fetchTransactions()
    }, [fetchTransactions])

    // jalanin fetchSummary setiap periode berubah
    useEffect(() => {
        fetchSummary()
    }, [fetchSummary])

    // fetchFormData cukup sekali waktu komponen pertama kali mount
    useEffect(() => {
        fetchFormData()
    }, [])

    // setiap ganti filter, reset ke page 1 biar ga kejebak di halaman yang udah ga relevan
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

    // generic handler buat semua input di form, pake computed property [name]
    const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

    const handleSubmit = async (e) => {
        e.preventDefault()

        // validasi minimal sebelum kirim ke backend
        if (!form.wallet_id || !form.category_id || !form.amount || !form.transaction_date) {
            toast.error('Semua field wajib diisi!')
            return
        }

        setSubmitLoading(true)
        try {
            // pake FormData karena ada kemungkinan upload file bukti transaksi
            // kalau ga ada file pun tetep jalan, proof_image-nya ya ga dikirim
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

            // reset form ke kondisi awal setelah berhasil simpan
            setForm({
                wallet_id: '',
                category_id: '',
                type: 'expense',
                amount: '',
                description: '',
                transaction_date: dayjs().format('YYYY-MM-DD'),
            })
            setProofImage(null)

            // refresh semua data yang terpengaruh
            fetchTransactions()
            fetchSummary()
            fetchFormData() // refresh wallet biar saldo yang keupdate kelihatan
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
            // refresh data setelah hapus, saldo wallet otomatis balik di backend
            fetchTransactions()
            fetchSummary()
            fetchFormData()
        } catch (_) {
            toast.error('Gagal menghapus transaksi')
        }
    }

    // hitung total income & expense dari allTransactions (bukan yang dipaginasi)
    // reduce mulai dari 0, tambah terus satu per satu
    const totalIncome = allTransactions
        .filter(t => t.type === 'income')
        .reduce((s, t) => s + parseFloat(t.amount), 0)
    const totalExpense = allTransactions
        .filter(t => t.type === 'expense')
        .reduce((s, t) => s + parseFloat(t.amount), 0)

    // filter kategori di form sesuai tipe yang dipilih
    // biar kalau milih "Pengeluaran" ga muncul kategori pemasukan
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
            {/* 3 card ini nilainya dari allTransactions, bukan dari data yang dipaginasi */}
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
                {/* warna selisih bersih ikut kondisi: biru kalau positif, oranye kalau minus */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 flex items-center gap-4">
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

                {/* ── TOOLBAR: tab tipe + dropdown periode + toggle filter ── */}
                <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-50 gap-3 flex-wrap">
                    {/* tab filter tipe transaksi */}
                    <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                        {[
                            { key: 'all', label: 'Semua' },
                            { key: 'income', label: 'Pemasukan' },
                            { key: 'expense', label: 'Pengeluaran' },
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => handleTypeTab(tab.key)}
                                // warna tab aktif beda-beda tergantung tipenya
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

                    {/* kanan: dropdown periode + tombol toggle filter tambahan */}
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
                        {/* tombol filter jadi hijau kalau panel terbuka atau ada filter aktif */}
                        <button
                            onClick={() => setShowFilterPanel(!showFilterPanel)}
                            className={`p-2 rounded-xl border transition-colors ${
                                showFilterPanel || walletFilter || categoryFilter
                                    ? 'bg-green-500 border-green-500 text-white'
                                    : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
                            }`}
                        >
                            <RiFilter3Line size={16} />
                        </button>
                    </div>
                </div>

                {/* ── PANEL FILTER TAMBAHAN — muncul hanya kalau tombol filter diklik ── */}
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
                        {/* tombol reset cuma muncul kalau ada filter yang aktif */}
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

                {/* ── ISI TABEL: 3 kondisi — loading, kosong, atau ada data ── */}
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
                        {/* header kolom pakai CSS grid biar lebih fleksibel daripada table */}
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
                                    // class 'group' buat nampilin tombol delete cuma saat hover row ini
                                    className="grid grid-cols-[2fr_1fr_1fr_auto] items-center px-5 py-3.5 hover:bg-gray-50/70 transition-colors group"
                                >
                                    {/* kolom 1: ikon kategori + nama/deskripsi + wallet kecil di bawah */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        {/* background icon ikut tipe: hijau untuk income, merah untuk expense */}
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
                                            trx.type === 'income' ? 'bg-green-50' : 'bg-red-50'
                                        }`}>
                                            {/* fallback emoji kalau kategori ga punya ikon */}
                                            {trx.category?.icon || (trx.type === 'income' ? '💰' : '💸')}
                                        </div>
                                        <div className="min-w-0">
                                            {/* prioritaskan description, fallback ke nama kategori */}
                                            <p className="text-sm font-semibold text-gray-800 truncate leading-tight">
                                                {trx.description || trx.category?.name || '-'}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className="text-xs text-gray-400 truncate">
                                                    {trx.wallet?.name}
                                                </span>
                                                {/* ikon kecil bukti transaksi, cuma muncul kalau ada fotonya */}
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

                                    {/* kolom 2: badge kategori berbentuk pill */}
                                    <div>
                                        <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                                            {trx.category?.icon}
                                            <span className="truncate max-w-[80px]">{trx.category?.name}</span>
                                        </span>
                                    </div>

                                    {/* kolom 3: tanggal transaksi */}
                                    <div>
                                        <span className="text-sm text-gray-500">
                                            {dayjs(trx.transaction_date).format('DD MMM YYYY')}
                                        </span>
                                    </div>

                                    {/* kolom 4: jumlah + badge tipe + tombol hapus */}
                                    <div className="flex items-center gap-3 justify-end">
                                        <div className="text-right">
                                            <p className={`text-sm font-bold ${trx.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                                                {trx.type === 'income' ? '+' : '-'}{formatRupiah(trx.amount)}
                                            </p>
                                            {/* badge tipe transaksi */}
                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                                                trx.type === 'income'
                                                    ? 'bg-green-100 text-green-600'
                                                    : 'bg-red-100 text-red-500'
                                            }`}>
                                                {trx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                                            </span>
                                        </div>
                                        {/* tombol delete opacity-0, baru muncul saat hover row (group-hover) */}
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
                                {/* hitung range data yang tampil di halaman ini */}
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
                                    {/* filter halaman biar cuma tampil yang deket page aktif (±2) */}
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

                    {/* toggle tipe — reset category_id setiap ganti tipe biar ga salah kategori */}
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

                    {/* input jumlah — taruh paling atas karena ini yang paling penting */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Jumlah</label>
                        <div className="relative">
                            {/* prefix "Rp" statis di kiri input */}
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

                    {/* wallet & kategori disusun 2 kolom biar hemat ruang */}
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
                                {/* tampilkan saldo di dropdown biar user tau mau milih yang mana */}
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
                                {/* filteredFormCategories sudah difilter sesuai form.type */}
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

                    {/* warna tombol submit ikut tipe yang dipilih biar konsisten */}
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