import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import api from "../api/axios"
import dayjs from "dayjs"
import {
    RiArrowUpLine,
    RiArrowDownLine,
    RiArrowLeftRightLine,
    RiWalletLine,
    RiAddLine,
    RiArrowRightLine
} from "react-icons/ri"
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
} from "chart.js"
import { Pie, Bar } from "react-chartjs-2"

// register semua komponen chart yang dipake
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

// helper format rupiah
const formatRupiah = (amount) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount)
}

const Dashboard = () => {
    const { user } = useAuth()
    const navigate = useNavigate()

    // state buat nyimpen semua data dashboard
    const [dashboardData, setDashboardData] = useState(null)
    const [loading, setLoading] = useState(true)

    // default ke bulan dan tahun sekarang
    const [month, setMonth] = useState(dayjs().month() + 1)
    const [year, setYear] = useState(dayjs().year())

    const fetchDashboard = async () => {
        setLoading(true)
        try {
            const res = await api.get(`/dashboards?month=${month}&year=${year}`)
            setDashboardData(res.data.data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    // fetch ulang setiap month atau year berubah
    useEffect(() => {
        fetchDashboard()
    }, [month, year])

    // data buat pie chart pengeluaran per kategori
    const pieData = {
        labels: dashboardData?.expense_by_category?.map(
            item => item.category?.name || 'Lainnya'
        ) || [],
        datasets: [{
            data: dashboardData?.expense_by_category?.map(
                item => parseFloat(item.dataValues?.total || item.total || 0)
            ) || [],
            backgroundColor: [
                '#22C55E', '#3B82F6', '#F59E0B',
                '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'
            ],
            borderWidth: 0,
        }]
    }

    // data buat bar chart income vs expense harian
    const barLabels = [...new Set(
        dashboardData?.daily_transactions?.map(item =>
            dayjs(item.dataValues?.date || item.date).format('DD/MM')
        ) || []
    )]

    const incomeData = barLabels.map(label => {
        const found = dashboardData?.daily_transactions?.find(item =>
            dayjs(item.dataValues?.date || item.date).format('DD/MM') === label &&
            (item.dataValues?.type || item.type) === 'income'
        )
        return found ? parseFloat(found.dataValues?.total || found.total || 0) : 0
    })

    const expenseData = barLabels.map(label => {
        const found = dashboardData?.daily_transactions?.find(item =>
            dayjs(item.dataValues?.date || item.date).format('DD/MM') === label &&
            (item.dataValues?.type || item.type) === 'expense'
        )
        return found ? parseFloat(found.dataValues?.total || found.total || 0) : 0
    })

    const barData = {
        labels: barLabels,
        datasets: [
            {
                label: 'Income',
                data: incomeData,
                backgroundColor: '#22C55E',
                borderRadius: 4,
            },
            {
                label: 'Expense',
                data: expenseData,
                backgroundColor: '#EF4444',
                borderRadius: 4,
            }
        ]
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-400">Loading...</div>
            </div>
        )
    }

    const summary = dashboardData?.summary
    const budgetStatus = dashboardData?.budget_status

    return (
        <div className="space-y-6">

            {/* header greeting */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        Halo, {user?.full_name?.split(' ')[0]}! 👋
                    </h1>
                    <p className="text-gray-500 text-sm mt-0.5">
                        Here's your financial overview today.
                    </p>
                </div>

                {/* filter bulan & tahun */}
                <div className="flex items-center gap-2">
                    <select
                        value={month}
                        onChange={(e) => setMonth(Number(e.target.value))}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                    >
                        {['Januari','Februari','Maret','April','Mei','Juni',
                          'Juli','Agustus','September','Oktober','November','Desember'
                        ].map((m, i) => (
                            <option key={i} value={i + 1}>{m}</option>
                        ))}
                    </select>
                    <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                    >
                        {[2024, 2025, 2026, 2027].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* row 1: total balance + summary cards */}
            <div className="grid grid-cols-3 gap-4">

                {/* total balance card - hijau besar */}
                <div className="col-span-2 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white relative overflow-hidden">
                    <p className="text-green-100 text-xs font-medium uppercase tracking-wider">
                        Total Balance
                    </p>
                    <h2 className="text-4xl font-bold mt-2">
                        {formatRupiah(dashboardData?.total_balance || 0)}
                    </h2>
                    <button
                        onClick={() => navigate('/transfer')}
                        className="absolute bottom-5 right-5 bg-white text-green-600 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-green-50 transition"
                    >
                        Transfer
                    </button>
                    {/* dekorasi lingkaran */}
                    <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
                    <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/10 rounded-full" />
                </div>

                {/* summary cards kanan */}
                <div className="space-y-3">
                    {/* total income */}
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
                        <p className="text-gray-400 text-xs">Total Income</p>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center">
                                <RiArrowDownLine className="text-green-500" size={14} />
                            </div>
                            <p className="text-green-600 font-bold text-sm">
                                {formatRupiah(summary?.total_income || 0)}
                            </p>
                        </div>
                    </div>

                    {/* total expense */}
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
                        <p className="text-gray-400 text-xs">Total Expense</p>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center">
                                <RiArrowUpLine className="text-red-500" size={14} />
                            </div>
                            <p className="text-red-500 font-bold text-sm">
                                {formatRupiah(summary?.total_expense || 0)}
                            </p>
                        </div>
                    </div>

                    {/* net balance */}
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
                        <p className="text-gray-400 text-xs">Net Balance</p>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
                                <RiArrowLeftRightLine className="text-blue-500" size={14} />
                            </div>
                            <p className="text-blue-500 font-bold text-sm">
                                {formatRupiah(summary?.net || 0)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* row 2: budget + pie chart */}
            <div className="grid grid-cols-2 gap-4">

                {/* monthly budget */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-800">Monthly Budget</h3>
                        {budgetStatus && (
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                budgetStatus.is_over_limit
                                    ? 'bg-red-100 text-red-600'
                                    : budgetStatus.is_warning
                                        ? 'bg-yellow-100 text-yellow-600'
                                        : 'bg-green-100 text-green-600'
                            }`}>
                                {budgetStatus.is_over_limit
                                    ? '⚠️ Over Limit'
                                    : `${budgetStatus.percentage_used}% Used`}
                            </span>
                        )}
                    </div>

                    {budgetStatus ? (
                        <>
                            <div className="flex justify-between text-xs text-gray-500 mb-2">
                                <span>Spent: {formatRupiah(budgetStatus.used_amount)}</span>
                                <span>Limit: {formatRupiah(budgetStatus.limit_amount)}</span>
                            </div>
                            {/* progress bar */}
                            <div className="w-full bg-gray-100 rounded-full h-2.5">
                                <div
                                    className={`h-2.5 rounded-full transition-all ${
                                        budgetStatus.is_over_limit
                                            ? 'bg-red-500'
                                            : budgetStatus.is_warning
                                                ? 'bg-yellow-400'
                                                : 'bg-green-500'
                                    }`}
                                    style={{ width: `${Math.min(budgetStatus.percentage_used, 100)}%` }}
                                />
                            </div>
                            {budgetStatus.is_warning && (
                                <p className="text-xs text-yellow-600 mt-2">
                                    ⚠️ Warning: Approaching budget limit.
                                </p>
                            )}
                            <p className="text-xs text-gray-400 mt-2">
                                Remaining: {formatRupiah(budgetStatus.remaining_amount)}
                            </p>
                        </>
                    ) : (
                        <div className="text-center py-6">
                            <p className="text-gray-400 text-sm">Belum ada budget bulan ini</p>
                            <button
                                onClick={() => navigate('/budget')}
                                className="mt-2 text-green-500 text-sm font-medium hover:underline"
                            >
                                + Set Budget
                            </button>
                        </div>
                    )}
                </div>

                {/* pie chart expense by category */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50">
                    <h3 className="font-semibold text-gray-800 mb-4">Expenses by Category</h3>
                    {dashboardData?.expense_by_category?.length > 0 ? (
                        <div className="flex items-center gap-4">
                            <div className="w-32 h-32">
                                <Pie data={pieData} options={{ plugins: { legend: { display: false } } }} />
                            </div>
                            <div className="space-y-2 flex-1">
                                {dashboardData.expense_by_category.slice(0, 4).map((item, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-2.5 h-2.5 rounded-full"
                                                style={{ backgroundColor: pieData.datasets[0].backgroundColor[i] }}
                                            />
                                            <span className="text-xs text-gray-600">
                                                {item.category?.name}
                                            </span>
                                        </div>
                                        <span className="text-xs font-medium text-gray-800">
                                            {Math.round(
                                                (parseFloat(item.dataValues?.total || item.total || 0) /
                                                (summary?.total_expense || 1)) * 100
                                            )}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-32">
                            <p className="text-gray-400 text-sm">Belum ada data pengeluaran</p>
                        </div>
                    )}
                </div>
            </div>

            {/* row 3: bar chart */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50">
                <h3 className="font-semibold text-gray-800 mb-4">Income vs Expense</h3>
                {barLabels.length > 0 ? (
                    <div className="h-48">
                        <Bar
                            data={barData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { position: 'top' } },
                                scales: {
                                    y: {
                                        ticks: {
                                            callback: (value) => `Rp ${(value/1000).toFixed(0)}k`
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-32">
                        <p className="text-gray-400 text-sm">Belum ada data transaksi</p>
                    </div>
                )}
            </div>

            {/* row 4: recent transactions + wallets */}
            <div className="grid grid-cols-2 gap-4">

                {/* recent transactions */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-800">Recent Transactions</h3>
                        <button
                            onClick={() => navigate('/histori')}
                            className="text-green-500 text-xs font-medium hover:underline flex items-center gap-1"
                        >
                            View All <RiArrowRightLine size={12} />
                        </button>
                    </div>

                    <div className="space-y-3">
                        {dashboardData?.recent_transactions?.length > 0 ? (
                            dashboardData.recent_transactions.map((trx) => (
                                <div key={trx.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {/* icon kategori */}
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base ${
                                            trx.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                                        }`}>
                                            {trx.category?.icon || '💰'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-800 leading-none">
                                                {trx.description || trx.category?.name}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {trx.category?.name} • {dayjs(trx.transaction_date).format('DD MMM')}
                                            </p>
                                        </div>
                                    </div>
                                    <p className={`text-sm font-semibold ${
                                        trx.type === 'income' ? 'text-green-500' : 'text-red-500'
                                    }`}>
                                        {trx.type === 'income' ? '+' : '-'}
                                        {formatRupiah(trx.amount)}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-400 text-sm text-center py-4">
                                Belum ada transaksi
                            </p>
                        )}
                    </div>
                </div>

                {/* wallets */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-800">Wallets</h3>
                        <button
                            onClick={() => navigate('/wallet')}
                            className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transition"
                        >
                            <RiAddLine className="text-white" size={14} />
                        </button>
                    </div>

                    <div className="space-y-3">
                        {dashboardData?.wallets?.length > 0 ? (
                            dashboardData.wallets.map((wallet) => (
                                <div key={wallet.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-8 h-8 rounded-full flex items-center justify-center"
                                            style={{ backgroundColor: wallet.color || '#22C55E' }}
                                        >
                                            <RiWalletLine className="text-white" size={14} />
                                        </div>
                                        <p className="text-sm font-medium text-gray-700">{wallet.name}</p>
                                    </div>
                                    <p className="text-sm font-bold text-gray-800">
                                        {formatRupiah(wallet.balance)}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-400 text-sm text-center py-4">
                                Belum ada wallet
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Dashboard