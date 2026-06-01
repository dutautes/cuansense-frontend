import { useState, useEffect } from "react"
import api from "../api/axios"
import toast from "react-hot-toast"
import dayjs from "dayjs"
import {
    RiFileExcel2Line, RiFilePdfLine, RiDownloadLine,
    RiLightbulbLine, RiLoader4Line
} from "react-icons/ri"

// nama bulan Indonesia, diakses lewat index 0-based
const MONTHS = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

// PENTING: FilterForm harus didefinisikan di LUAR komponen Export!
// kalau di dalam, React bikin komponen baru setiap render → error hooks → blank putih
// wallets dan yearOptions dipass sebagai props
const FilterForm = ({ form, onChange, wallets, yearOptions }) => (
    <div className="space-y-3 mt-5">
        <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Source Wallet
            </label>
            <select
                name="wallet_id"
                value={form.wallet_id}
                onChange={onChange}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            >
                <option value="">All Wallets</option>
                {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
            <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Month</label>
                <select
                    name="month"
                    value={form.month}
                    onChange={onChange}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                >
                    {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Year</label>
                <select
                    name="year"
                    value={form.year}
                    onChange={onChange}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                >
                    {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>
        </div>
    </div>
)

const Export = () => {
    const [wallets, setWallets] = useState([])
    const now = dayjs()

    // form untuk export excel — terpisah dari pdf biar ga tabrakan state
    const [excelForm, setExcelForm] = useState({
        wallet_id: '',
        month: now.month() + 1, // dayjs 0-indexed, +1 biar jadi bulan yang bener
        year: now.year(),
    })

    // form untuk export pdf
    const [pdfForm, setPdfForm] = useState({
        wallet_id: '',
        month: now.month() + 1,
        year: now.year(),
    })

    // loading state dipisah per tombol biar bisa download excel & pdf secara bersamaan kalau mau
    const [excelLoading, setExcelLoading] = useState(false)
    const [pdfLoading, setPdfLoading] = useState(false)

    // fetch daftar wallet buat dropdown pilihan
    const fetchWallets = async () => {
        try {
            const res = await api.get('/wallets')
            setWallets(res.data.data)
        } catch (_) {}
    }

    // cukup fetch sekali saat komponen mount
    useEffect(() => {
        fetchWallets()
    }, [])

    // handler form masing-masing — dipisah biar onChange-nya ga campur aduk
    const handleExcelChange = (e) => setExcelForm({ ...excelForm, [e.target.name]: e.target.value })
    const handlePdfChange = (e) => setPdfForm({ ...pdfForm, [e.target.name]: e.target.value })

    const handleDownloadExcel = async () => {
        setExcelLoading(true)
        try {
            // bangun query params dari filter excel form
            const params = new URLSearchParams()
            if (excelForm.wallet_id) params.append('wallet_id', excelForm.wallet_id)
            params.append('month', excelForm.month)
            params.append('year', excelForm.year)

            // responseType: 'blob' wajib! kalau ga, data binary bakal rusak karena dibaca sebagai teks
            const res = await api.get(`/export/excel?${params.toString()}`, {
                responseType: 'blob',
            })

            // buat URL sementara dari blob, lalu trigger download lewat <a> tag
            const url = window.URL.createObjectURL(new Blob([res.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `cuansense-laporan-${excelForm.month}-${excelForm.year}.xlsx`)
            document.body.appendChild(link)
            link.click()   // trigger download
            link.remove()  // bersihin elemen setelah klik
            window.URL.revokeObjectURL(url) // buang URL blob biar ga memory leak

            toast.success('Excel berhasil didownload!')
        } catch (error) {
            toast.error('Gagal download Excel')
        } finally {
            setExcelLoading(false)
        }
    }

    const handleDownloadPdf = async () => {
        setPdfLoading(true)
        try {
            const params = new URLSearchParams()
            if (pdfForm.wallet_id) params.append('wallet_id', pdfForm.wallet_id)
            params.append('month', pdfForm.month)
            params.append('year', pdfForm.year)

            // sama kayak excel tapi MIME type-nya application/pdf biar browser bisa detect dengan bener
            const res = await api.get(`/export/pdf?${params.toString()}`, {
                responseType: 'blob',
            })

            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `cuansense-laporan-${pdfForm.month}-${pdfForm.year}.pdf`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)

            toast.success('PDF berhasil didownload!')
        } catch (error) {
            toast.error('Gagal download PDF')
        } finally {
            setPdfLoading(false)
        }
    }

    // opsi tahun yang tampil di dropdown — 2 tahun lalu sampai tahun depan
    const yearOptions = [now.year() - 2, now.year() - 1, now.year(), now.year() + 1]

    return (
        <div className="space-y-6">

            {/* header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Export Data</h1>
                <p className="text-gray-500 text-sm mt-0.5">
                    Download laporan keuangan dalam format{' '}
                    <span className="text-green-600 font-medium">Excel</span> atau{' '}
                    <span className="text-red-500 font-medium">PDF</span>
                </p>
            </div>

            {/* 2 card export — Excel hijau & PDF merah */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* card download excel */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                            <RiFileExcel2Line size={22} className="text-green-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">Excel Report</h3>
                            <p className="text-xs text-gray-400">Detailed spreadsheet for deep analysis</p>
                        </div>
                    </div>

                    {/* pass wallets & yearOptions lewat props ke FilterForm */}
                    <FilterForm form={excelForm} onChange={handleExcelChange} wallets={wallets} yearOptions={yearOptions} />

                    {/* tombol download — disabled dan tampil spinner saat loading */}
                    <button
                        onClick={handleDownloadExcel}
                        disabled={excelLoading}
                        className="w-full mt-5 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        {excelLoading
                            ? <><RiLoader4Line size={18} className="animate-spin" /> Memproses...</>
                            : <><RiDownloadLine size={18} /> Download Excel</>
                        }
                    </button>
                </div>

                {/* card download pdf */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                            <RiFilePdfLine size={22} className="text-red-500" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">PDF Summary</h3>
                            <p className="text-xs text-gray-400">Clean, formatted overview ready for sharing</p>
                        </div>
                    </div>

                    <FilterForm form={pdfForm} onChange={handlePdfChange} wallets={wallets} yearOptions={yearOptions} />

                    <button
                        onClick={handleDownloadPdf}
                        disabled={pdfLoading}
                        className="w-full mt-5 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        {pdfLoading
                            ? <><RiLoader4Line size={18} className="animate-spin" /> Memproses...</>
                            : <><RiDownloadLine size={18} /> Download PDF</>
                        }
                    </button>
                </div>
            </div>

            {/* tips penggunaan — info statis buat bantu user pilih format yang sesuai */}
            <div className="bg-green-50 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <RiLightbulbLine size={16} className="text-green-600" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-green-800">Pro Tip</p>
                    <p className="text-xs text-green-700 mt-0.5 leading-relaxed">
                        Untuk keperluan pajak, gunakan <strong>Excel</strong> yang menyediakan data transaksi granular
                        dan dapat diimport ke software akuntansi. <strong>PDF</strong> lebih cocok untuk review cepat
                        atau dibagikan ke orang lain.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Export