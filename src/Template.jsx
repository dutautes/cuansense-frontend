import { Outlet } from "react-router-dom"
import Sidebar from "./components/Sidebar"

// Template ini wrapper untuk semua halaman yang butuh sidebar
// Outlet = tempat konten halaman yang aktif dimunculkan
const Template = () => {
    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* sidebar fixed di kiri */}
            <Sidebar />
            {/* konten halaman, dikasih margin kiri sesuai lebar sidebar */}
            <main className="ml-60 flex-1 p-6">
                <Outlet /> 
            </main>
        </div>
    )
}

export default Template