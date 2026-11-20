import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  AlertCircle,
  Smartphone,
  User as UserIcon,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Language, AdminSettings, UserAccount, WithdrawRequest } from '../types';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitWithdraw: (
    amount: number,
    method: 'mtn' | 'airtel',
    recipientPhone: string,
    recipientName: string
  ) => Promise<WithdrawRequest | null | void> | void;
  user: UserAccount;
  adminSettings: AdminSettings;
  language: Language;
}

function normalizeRwandaPhone(raw: string): string {
  let clean = raw.trim().replace(/[\s\-()]+/g, '');
  if (clean.startsWith('+250')) {
    clean = '0' + clean.slice(4);
  } else if (clean.startsWith('250') && clean.length >= 12) {
    clean = '0' + clean.slice(3);
  } else if (clean.length === 9 && clean.startsWith('7')) {
    clean = '0' + clean;
  }
  return clean;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  onClose,
  onSubmitWithdraw,
  user,
  adminSettings,
  language,
}) => {
  const isRw = language === 'rw';
  const [method, setMethod] = useState<'mtn' | 'airtel'>(user.payoutMethod || 'mtn');
  const [amount, setAmount] = useState<string>('');
  const [recipientPhone, setRecipientPhone] = useState<string>(
    user.payoutPhone || user.phone || ''
  );
  const [recipientName, setRecipientName] = useState<string>(user.payoutName || '');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedRequest, setSubmittedRequest] = useState<WithdrawRequest | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMethod(user.payoutMethod || 'mtn');
      setRecipientPhone(user.payoutPhone || user.phone || '');
      setRecipientName(user.payoutName || '');
      setAmount('');
      setError(null);
      setIsSubmitting(false);
      setSubmittedRequest(null);
    }
  }, [isOpen, user.payoutMethod, user.payoutPhone, user.payoutName, user.phone]);

  if (!isOpen) return null;

  const parsedAmount = parseInt(amount, 10) || 0;
  const taxPercent = adminSettings.withdrawalFeePercent ?? 10;
  const taxAmount = Math.round((parsedAmount * taxPercent) / 100);
  const netReceived = Math.max(0, parsedAmount - taxAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = normalizeRwandaPhone(recipientPhone);
    if (!/^07[2389]\d{7}$/.test(cleanPhone)) {
      setError(
        isRw
          ? 'Shyiramo numero ya Mobile Money nyayo y’imibare 10 (urugero: 078XXXXXXX cyangwa 072XXXXXXX)'
          : 'Please enter a valid 10-digit Rwandan Mobile Money number (e.g. 078XXXXXXX or 072XXXXXXX)'
      );
      return;
    }

    const cleanName = recipientName.trim();
    if (cleanName.length < 2) {
      setError(
        isRw
          ? 'Shyiramo amazina y’nyiri iyo numero ya telefone yakiriraho amafaranga'
          : 'Please enter the registered account holder name for this phone number'
      );
      return;
    }

    const minAmount = adminSettings.minWithdrawal || 1000;
    if (parsedAmount < minAmount) {
      setError(
        isRw
          ? `Amafaranga make yo kubikuza ni RWF ${minAmount.toLocaleString()}`
          : `Minimum withdrawal amount is RWF ${minAmount.toLocaleString()}`
      );
      return;
    }

    if (parsedAmount > 5000000) {
      setError(
        isRw
          ? 'Amafaranga menshi yo kubikuza ku nshuro imwe ni RWF 5,000,000'
          : 'Maximum withdrawal amount per request is RWF 5,000,000'
      );
      return;
    }

    if (parsedAmount > user.balance) {
      setError(
        isRw
          ? `Ntabwo ufite amafaranga ahagije kuri konti (Ufite: RWF ${user.balance.toLocaleString()})`
          : `Insufficient balance (You have: RWF ${user.balance.toLocaleString()})`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await onSubmitWithdraw(parsedAmount, method, cleanPhone, cleanName);
      setSubmittedRequest(
        created || {
          id: `wth-${Date.now()}`,
          userId: user.id,
          userPhone: user.phone,
          amount: parsedAmount,
          fee: taxAmount,
          netAmount: netReceived,
          paymentMethod: method,
          recipientPhone: cleanPhone,
          recipientName: cleanName,
          status: 'pending',
          timestamp: new Date().toLocaleString('en-GB'),
        }
      );
      setAmount('');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isRw
            ? 'Ntibyakunze kohereza ubusabe bwo kubikuza.'
            : 'Failed to submit withdrawal request.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-white border-2 border-[#dc2626] rounded-t-3xl sm:rounded-2xl max-h-[95vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom font-sans">
        {/* Top Red Header */}
        <div className="px-4 py-3.5 bg-[#dc2626] text-white flex items-center justify-between">
          <div>
            <h3 className="font-black text-lg text-white">
              {isRw ? 'Kubikuza amafaranga' : 'Withdrawal'}
            </h3>
            <span className="text-sm font-extrabold text-white/95 tabular-nums">
              {isRw ? 'Amafaranga ahari' : 'Available'}:{' '}
              <strong className="font-black">RWF {user.balance.toLocaleString()}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full text-white hover:bg-white/20 cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {!submittedRequest ? (
            <>
              {/* Step 1: Select Payout Network */}
              <div>
                <label className="block text-sm font-black text-[#7f1d1d] uppercase tracking-wider mb-2">
                  {isRw ? '1. Hitamo umuyoboro wakiriraho' : '1. Choose payout network'}
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setMethod('mtn')}
                    className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center justify-between ${
                      method === 'mtn'
                        ? 'border-[#dc2626] bg-[#dc2626] text-white shadow-xs'
                        : 'border-[#fecaca] bg-white text-[#7f1d1d] hover:bg-[#fef2f2]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg font-black text-xs flex items-center justify-center shrink-0 ${method === 'mtn' ? 'bg-white text-[#dc2626]' : 'bg-[#fee2e2] text-[#b91c1c]'}`}>
                        MTN
                      </div>
                      <div>
                        <span className="text-sm font-black block">MTN MoMo</span>
                        <span className={`text-xs font-bold ${method === 'mtn' ? 'text-white/90' : 'text-[#991b1b]'}`}>078 / 079</span>
                      </div>
                    </div>
                    {method === 'mtn' && <CheckCircle2 className="w-5 h-5 text-white shrink-0" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod('airtel')}
                    className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center justify-between ${
                      method === 'airtel'
                        ? 'border-[#dc2626] bg-[#dc2626] text-white shadow-xs'
                        : 'border-[#fecaca] bg-white text-[#7f1d1d] hover:bg-[#fef2f2]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg font-black text-xs flex items-center justify-center shrink-0 ${method === 'airtel' ? 'bg-white text-[#dc2626]' : 'bg-[#fee2e2] text-[#b91c1c]'}`}>
                        Airtel
                      </div>
                      <div>
                        <span className="text-sm font-black block">Airtel Money</span>
                        <span className={`text-xs font-bold ${method === 'airtel' ? 'text-white/90' : 'text-[#991b1b]'}`}>072 / 073</span>
                      </div>
                    </div>
                    {method === 'airtel' && <CheckCircle2 className="w-5 h-5 text-white shrink-0" />}
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Step 2: Receiving Phone Number */}
                <div>
                  <label className="block text-base font-black text-[#7f1d1d] mb-1.5">
                    {isRw
                      ? 'Numero yakiriraho amafaranga'
                      : 'Receiving Mobile Money number'}
                  </label>
                  <div className="flex rounded-xl border-2 border-[#fca5a5] overflow-hidden focus-within:border-[#dc2626] bg-white">
                    <span className="bg-[#dc2626] text-white px-4 py-3 text-sm font-black flex items-center gap-1.5 shrink-0">
                      <Smartphone className="w-4 h-4" />
                      +250
                    </span>
                    <input
                      type="tel"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      placeholder={method === 'mtn' ? '078XXXXXXX' : '072XXXXXXX'}
                      className="w-full px-3.5 py-3 text-base font-black font-mono text-[#7f1d1d] placeholder-[#fca5a5] focus:outline-none"
                      required
                    />
                  </div>
                  <span className="text-xs font-bold text-[#991b1b] mt-1 block">
                    {isRw
                      ? 'Andika numero yawe ya MoMo / Airtel Money ushaka ko amafaranga yoherezwaho.'
                      : 'Enter the MoMo / Airtel Money number where your payout will be sent.'}
                  </span>
                </div>

                {/* Step 3: Account Holder Name */}
                <div>
                  <label className="block text-base font-black text-[#7f1d1d] mb-1.5">
                    {isRw
                      ? "Amazina ya nyir'iyo numero"
                      : 'Account holder full name'}
                  </label>
                  <div className="flex rounded-xl border-2 border-[#fca5a5] overflow-hidden focus-within:border-[#dc2626] bg-white">
                    <span className="bg-[#fef2f2] border-r-2 border-[#fca5a5] px-3.5 py-3 text-[#dc2626] flex items-center shrink-0">
                      <UserIcon className="w-5 h-5" />
                    </span>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder={
                        isRw
                          ? 'Urugero: Jean Claude Mugabo'
                          : 'e.g. Jean Claude Mugabo'
                      }
                      className="w-full px-3.5 py-3 text-base font-bold text-[#7f1d1d] placeholder-[#fca5a5] focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Step 4: Withdrawal Amount Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-base font-black text-[#7f1d1d]">
                      {isRw ? 'Amafaranga yo kubikuza' : 'Withdrawal amount'}
                    </label>
                    {user.balance >= (adminSettings.minWithdrawal || 1000) && (
                      <button
                        type="button"
                        onClick={() => setAmount(String(Math.floor(user.balance)))}
                        className="text-sm font-black text-[#dc2626] hover:text-[#991b1b] underline cursor-pointer"
                      >
                        {isRw ? 'Bikuza yose' : 'Withdraw all'}
                      </button>
                    )}
                  </div>
                  <div className="flex rounded-xl border-2 border-[#fca5a5] overflow-hidden focus-within:border-[#dc2626] bg-white">
                    <span className="bg-[#fef2f2] border-r-2 border-[#fca5a5] px-3.5 py-3 text-sm font-black text-[#b91c1c] flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-[#dc2626]" />
                      RWF
                    </span>
                    <input
                      type="number"
                      min={adminSettings.minWithdrawal || 1000}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder={
                        isRw
                          ? 'Shyiramo amafaranga (Min: 1,000)'
                          : 'Enter withdrawal amount (Min: 1,000)'
                      }
                      className="w-full px-3.5 py-3 text-base font-black text-[#7f1d1d] focus:outline-none tabular-nums"
                      required
                    />
                  </div>

                  {/* Amount received & Tax subtext */}
                  <div className="flex items-center justify-between text-sm font-bold text-[#991b1b] pt-2 px-1 tabular-nums">
                    <span>
                      {isRw ? 'Amafaranga uzabona' : 'Amount received'}:{' '}
                      <strong className="text-[#dc2626] font-black">
                        RWF {netReceived.toLocaleString()}
                      </strong>
                    </span>
                    <span className="font-black">
                      {isRw ? 'Ikiguzi' : 'Fee'}: {taxPercent}%
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-[#fef2f2] border-2 border-[#dc2626] rounded-xl text-[#b91c1c] text-sm font-black flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 shrink-0 text-[#dc2626]" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-full bg-[#dc2626] hover:bg-[#b91c1c] text-white font-black text-base active:scale-[0.99] transition-all shadow-md cursor-pointer text-center disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                    <span>
                      {isSubmitting
                        ? isRw
                          ? 'Biri koherezwa...'
                          : 'Processing withdrawal...'
                        : isRw
                          ? 'Bikuza ako kanya'
                          : 'Submit withdrawal'}
                    </span>
                  </button>
                </div>
              </form>

              {/* Withdrawal Instructions */}
              <div className="pt-3 border-t-2 border-[#fecaca] space-y-2">
                <h4 className="text-sm font-black uppercase tracking-wider text-[#7f1d1d]">
                  {isRw ? 'Amabwiriza yo kubikuza' : 'Withdrawal Instructions'}
                </h4>
                <div className="space-y-1.5 text-sm font-bold text-[#991b1b] leading-relaxed">
                  <p>
                    1.{' '}
                    {isRw
                      ? 'Amafaranga make yo kubikuza: RWF 1,000; menshi: RWF 5,000,000.'
                      : 'Minimum withdrawal: RWF 1,000; maximum: RWF 5,000,000.'}
                  </p>
                  <p>
                    2.{' '}
                    {isRw
                      ? `Ikiguzi cya ${taxPercent}% kivanwa ku mafaranga wasabye.`
                      : `A ${taxPercent}% withdrawal fee is deducted from the requested amount.`}
                  </p>
                  <p>
                    3.{' '}
                    {isRw
                      ? 'Nyuma yo kubikuza, ushobora kureba amakuru arambuye muri Menu -> Ibyakozwe (Records).'
                      : 'After submitting, you can track your withdrawal details inside Menu -> Records.'}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="p-5 rounded-2xl border-2 border-[#fecaca] bg-[#fef2f2] space-y-4 text-center">
              <div className="w-14 h-14 rounded-full bg-[#dc2626] text-white flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-black text-[#7f1d1d]">
                  {isRw ? 'Ubusabe bwo kubikuza bwoherejwe!' : 'Withdrawal request submitted!'}
                </h4>
                <p className="text-sm font-bold text-[#991b1b]">
                  {isRw
                    ? 'Ushobora gukurikirana ubusabe bwawe muri Menu -> Ibyakozwe (Records).'
                    : 'You can track this request inside Menu -> Records.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border-2 border-[#fecaca] text-left space-y-2 text-sm tabular-nums">
                <div className="flex justify-between">
                  <span className="font-bold text-[#991b1b]">{isRw ? 'Amafaranga wasabye:' : 'Requested:'}</span>
                  <span className="font-black text-[#7f1d1d]">
                    RWF {submittedRequest.amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-[#991b1b]">{isRw ? 'Ayokwakira:' : 'Net payout:'}</span>
                  <span className="font-black text-[#dc2626]">
                    RWF {submittedRequest.netAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#fecaca]">
                  <span className="font-black text-[#991b1b]">{submittedRequest.paymentMethod.toUpperCase()}</span>
                  <span className="font-mono font-black text-[#7f1d1d]">
                    {submittedRequest.recipientPhone} · {submittedRequest.recipientName}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setSubmittedRequest(null)}
                  className="py-3 px-3 rounded-full border-2 border-[#dc2626] bg-white hover:bg-[#fef2f2] text-sm font-black text-[#dc2626] cursor-pointer"
                >
                  {isRw ? 'Kubikuza ibindi' : 'New Withdrawal'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="py-3 px-3 rounded-full bg-[#dc2626] hover:bg-[#b91c1c] text-sm font-black text-white cursor-pointer"
                >
                  {isRw ? 'Funga' : 'Close'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
