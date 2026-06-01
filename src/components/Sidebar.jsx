import { NavLink, useNavigate } from 'react-router-dom'
import {
    RiDashboardLine,
    RiExchangeLine,
    RiArrowLeftRightLine,
    RiWalletLine,
    RiPieChartLine,
    RiMoneyDollarCircleLine,
    RiHistoryLine,
    RiDownloadLine,
    RiLogoutBoxLine,
    RiAddLine
} from 'react-icons/ri'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const menuItems = [
    { path: '/dashboard', icon: RiDashboardLine, label: 'Dashboard' },
    { path: '/transaksi', icon: RiExchangeLine, label: 'Transaksi' },
    { path: '/transfer', icon: RiArrowLeftRightLine, label: 'Transfer' },
    { path: '/wallet', icon: RiWalletLine, label: 'Wallet' },
    { path: '/kategori', icon: RiPieChartLine, label: 'Kategori' },
    { path: '/budget', icon: RiMoneyDollarCircleLine, label: 'Budget' },
    { path: '/histori', icon: RiHistoryLine, label: 'Histori' },
    { path: '/export', icon: RiDownloadLine, label: 'Export' },
]

const Sidebar = () => {
    // ambil fungsi logout dan data user dari context
    const { logout, user } = useAuth()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        toast.success('Berhasil logout!')
        navigate('/login')
    }

    return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-white border-r border-gray-100 flex flex-col z-50 shadow-sm">

        {/* logo */}
        <div className="p-5 border-b border-gray-100">
            <div className="flex items-center gap-2">
                <span className="text-2xl">💰</span>
                <div>
                    <h1 className="text-gray-800 font-bold text-lg leading-none">CuanSense</h1>
                    <p className="text-gray-400 text-xs">Financial Growth</p>
                </div>
            </div>
        </div>

        {/* tombol add transaction */}
        <div className="p-4">
            <button
                onClick={() => navigate('/transaksi')}
                className="w-full bg-green-500 hover:bg-green-600 text-white rounded-xl py-2.5 flex items-center justify-center gap-2 font-medium transition-colors text-sm"
            >
                <RiAddLine size={18} />
                Add Transaction
            </button>
        </div>

        {/* menu navigasi */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium ${isActive
                            ? 'bg-green-500 text-white'
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                        }`
                    }
                >
                    <item.icon size={18} />
                    {item.label}
                </NavLink>
            ))}
        </nav>

        {/* user info + logout */}
        <div className="p-4 border-t border-gray-100">
            {user && (
                <div className="flex items-center gap-2 mb-3 px-3">
                    <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">
                        {user.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-gray-600 text-xs font-medium truncate">
                        {user.full_name}
                    </span>
                </div>
            )}
            <button
                onClick={handleLogout}
                className="flex items-center gap-3 text-gray-400 hover:text-red-400 transition-colors text-sm font-medium w-full px-3 py-2"
            >
                <RiLogoutBoxLine size={18} />
                Logout
            </button>
        </div>
    </aside>
)
}

export default Sidebar