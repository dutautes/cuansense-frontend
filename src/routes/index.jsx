import { createBrowserRouter, redirect } from "react-router-dom"
import authMiddleware from "../middleware/auth"

import Template from "../Template"
import Login from "../pages/Login"
import Register from "../pages/Register"
import Dashboard from "../pages/Dashboard"
import Transaksi from "../pages/Transaksi"
import Transfer from "../pages/Transfer"
import Wallet from "../pages/Wallet"
import Kategori from "../pages/Kategori"
import Budget from "../pages/Budget"
import Histori from "../pages/Histori"
import Export from "../pages/Export"

export const router = createBrowserRouter([ // createBrowserRouter : fungsi dari react-router-dom buat bikin router dengan mode history (URL bersih tanpa #)
    // halaman yang ga butuh login
    {
        path: '/login',
        element: <Login />
    },
    {
        path: '/register',
        element: <Register />
    },
    // halaman yang butuh login, dibungkus Template (sidebar)
    {
        path: '/',
        element: <Template />,
        // loader: cek token dulu sebelum masuk halaman manapun
        loader: authMiddleware,
        children: [
            {
                index: true, // index : elemen default yang akan ditampilkan kalau URL root '/' diakses
                loader: () => redirect('/dashboard')
            },
            {
                path: 'dashboard',
                element: <Dashboard />
            },
            {
                path: 'transaksi',
                element: <Transaksi />
            },
            {
                path: 'transfer',
                element: <Transfer />
            },
            {
                path: 'wallet',
                element: <Wallet />
            },
            {
                path: 'kategori',
                element: <Kategori />
            },
            {
                path: 'budget',
                element: <Budget />
            },
            {
                path: 'histori',
                element: <Histori />
            },
            {
                path: 'export',
                element: <Export />
            },
        ]
    }
])