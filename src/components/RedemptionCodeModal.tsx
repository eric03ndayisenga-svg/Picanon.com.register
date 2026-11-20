import React, { useState } from 'react';
import {
  X,
  Gift,
  Tag,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { Language } from '../types';

interface RedemptionCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRedeem: (
    code: string
  ) =>
    | Promise<{ success: boolean; message: string; amount?: number }>
    | { success: boolean; message: string; amount?: number };
  language: Language;
}

export const RedemptionCodeModal: React.FC<RedemptionCodeModalProps> = ({
  isOpen,
  onClose,
  onRedeem,
  language,
}) => {
  const isRw = language === 'rw';
  const [code, setCode] = useState<string>('');
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    const result = await onRedeem(code.trim().toUpperCase());
    if (result.success) {
      setStatus({
        type: 'success',
        message: result.message,
      });
      setCode('');
    } else {
      setStatus({
        type: 'error',
        message: result.message,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      <div className="w-full max-w-md bg-white border-2 border-[#dc2626] rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-[#fecaca] bg-[#dc2626] text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-[#dc2626] flex items-center justify-center font-black">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-white text-lg">
                {isRw ? "Cungura Kode y'Impano" : 'Redeem Gift Code'}
              </h3>
              <p className="text-xs font-bold text-white/90">
                {isRw ? "Kode Yemewe n'Ubuyobozi bwa Picanon" : 'Official Picanon Company Vouchers'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="p-4 rounded-2xl bg-[#fef2f2] border-2 border-[#fecaca] space-y-2">
            <div className="flex items-center gap-2 text-[#b91c1c] font-black text-sm">
              <Sparkles className="w-4 h-4 text-[#dc2626]" />
              <span>{isRw ? 'Kode Zizewe za Sosiyete' : 'Company Direct Vouchers'}</span>
            </div>
            <p className="text-sm font-bold text-[#7f1d1d] leading-relaxed">
              {isRw
                ? "Kode z'impano zitangwa gusa n'ubuyobozi bwa Picanon binyuze mu itsinda rya Telegram n'umukozi wa Telegram Support."
                : 'Gift codes are exclusively created and distributed by Picanon management through our official Telegram group and Telegram support.'}
            </p>
            <a
              href="https://t.me/Picanon_channel"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-black text-[#dc2626] hover:text-[#991b1b] mt-1 underline"
            >
              <span>{isRw ? 'Injira muri Picanon Channel ubashe kubona kode nshya' : 'Join Picanon Channel for the latest codes'}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {status.type === 'success' && (
            <div className="p-3.5 rounded-xl bg-[#dc2626] text-white text-sm font-black flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{status.message}</span>
            </div>
          )}

          {status.type === 'error' && (
            <div className="p-3.5 rounded-xl bg-[#fef2f2] border-2 border-[#dc2626] text-[#b91c1c] text-sm font-black flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[#dc2626] shrink-0" />
              <span>{status.message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-sm font-black text-[#7f1d1d] block mb-1.5 uppercase tracking-wider">
                {isRw ? "Andika Kode yawe hano:" : 'Enter Voucher Code:'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    if (status.type) setStatus({ type: null, message: '' });
                  }}
                  placeholder="urugero: PICANON-2026"
                  className="w-full pl-4 pr-10 py-3.5 rounded-xl bg-white border-2 border-[#fca5a5] text-[#7f1d1d] font-mono font-black text-base uppercase tracking-wider focus:outline-none focus:border-[#dc2626] transition-colors"
                  required
                />
                <Tag className="w-5 h-5 text-[#dc2626] absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-full bg-[#dc2626] hover:bg-[#b91c1c] text-white font-black text-base uppercase tracking-wider shadow-lg active:scale-98 transition-all cursor-pointer"
            >
              {isRw ? "CUNGURA IYI MPANO" : 'REDEEM GIFT NOW'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
