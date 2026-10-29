import React from 'react';
import { X, ShieldCheck } from 'lucide-react';

interface PolicyModalProps {
  title: string;
  content: string;
  onClose: () => void;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({ title, content, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl relative animate-in fade-in zoom-in-95">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#F5B800]" />
            <h3 className="text-lg font-extrabold text-[#171717]">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-black p-1 rounded-lg hover:bg-neutral-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto text-sm text-neutral-700 leading-relaxed space-y-4">
          <p className="whitespace-pre-line">{content}</p>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-100 bg-neutral-50 rounded-b-3xl text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#171717] text-white rounded-xl text-xs font-bold hover:bg-black transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
