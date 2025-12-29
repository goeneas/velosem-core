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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0F172A]/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-md p-10 space-y-6 border border-slate-200 animate-in zoom-in-95 duration-200">
                <div>
                    <h4 className="text-2xl font-serif font-bold text-[#0F172A]">{title}</h4>
                    <p className="text-sm text-slate-500 mt-2 leading-relaxed">{message}</p>
                </div>

                <div className="flex gap-4 pt-4">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-4 text-xs font-black uppercase text-slate-400 hover:text-slate-600 transition-all rounded-xl hover:bg-slate-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-4 text-white text-xs font-black uppercase rounded-xl shadow-xl transition-all ${isDestructive
                                ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30'
                                : 'bg-[#f14924] hover:bg-[#d13d1a] shadow-[#f14924]/30'
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
