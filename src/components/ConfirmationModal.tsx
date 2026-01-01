import React from 'react';

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDestructive = false,
    onConfirm,
    onCancel
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 w-screen h-screen z-[9999] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 border border-slate-200 animate-in zoom-in-95 slide-in-from-bottom-2 duration-300 relative mx-4">
                <div className="text-center mb-6">
                    <h4 className="text-2xl font-black tracking-tight text-slate-900 mb-2">{title}</h4>
                    <p className="text-sm font-medium text-slate-500 leading-relaxed">{message}</p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-800 transition-all rounded-xl"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-3 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg transition-transform active:scale-95 ${isDestructive
                            ? 'bg-red-500 hover:bg-red-600 shadow-red-500/25'
                            : 'bg-[#f14924] hover:bg-[#d13d1a] shadow-[#f14924]/25'
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
