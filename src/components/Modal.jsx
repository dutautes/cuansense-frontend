import { useEffect } from 'react'
import { RiCloseLine } from 'react-icons/ri'

// reusable modal, bisa dipake di halaman manapun
// tinggal wrap konten form di dalamnya
const Modal = ({ isOpen, onClose, title, children }) => {

    // kalau modal kebuka, disable scroll di background
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset' 
            // overflow unset : balikin scroll ke normal
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    if (!isOpen) return null

    return (
        // overlay gelap
        <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* header modal */}
                <div className="flex items-center justify-between p-5 border-b">
                    <h2 className="font-semibold text-gray-800 text-lg">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <RiCloseLine size={22} />
                    </button>
                </div>
                {/* isi modal */}
                <div className="p-5">
                    {children}
                </div>
            </div>
        </div>
    )
}

export default Modal