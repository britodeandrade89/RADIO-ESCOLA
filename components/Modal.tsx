
import React, { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: ReactNode;
  children: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, icon, children }) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 transition-opacity duration-300 animate-fadeIn"
      onClick={handleOverlayClick}
    >
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-scaleIn">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold flex items-center space-x-2 text-white">
            {icon}
            <span>{title}</span>
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <i className="ph-fill ph-x text-2xl"></i>
          </button>
        </div>
        <div className="p-6 min-h-[150px] flex items-center justify-center">
          {children}
        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default Modal;
