import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Copy,
  Check,
  CreditCard,
  Smartphone,
  Loader2,
  ShieldCheck,
  RefreshCw,
  User as UserIcon,
  ArrowLeft,
} from 'lucide-react';
import { Language, AdminSettings, RechargeRequest } from '../types';
import { picanonDepositShowcase } from '../assets/images';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitRecharge: (
    amount: number,
    method: 'mtn' | 'airtel',
    senderPhone: string,
    txId: string
  ) => Promise<RechargeRequest | null | void> | void;
  onRefreshStatus?: () => Promise<void> | void;
  adminSettings: AdminSettings;
  language: Language;
  userBalance?: number;
  userPhone?: string;
  rechargeRequests?: RechargeRequest[];
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

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  onSubmitRecharge,
  onRefreshStatus,
  adminSettings,
  language,
  userBalance = 0,
  userPhone = '',
  rechargeRequests = [],
}) => {
  const isRw = language === 'rw';
  const minDeposit = adminSettings.minDeposit || 1000;
  const [selectedAmount, setSelectedAmount] = useState<number>(minDeposit);
  const [customAmount, setCustomAmount] = useState<string>(minDeposit.toString());
  const [paymentNumber, setPaymentNumber] = useState<string>(
    userPhone ? userPhone.replace(/^(\+250|250)/, '') : ''
  );
  const [txReference, setTxReference] = useState<string>('');
  const [method, setMethod] = useState<'mtn' | 'airtel'>('mtn');
  const [copiedField, setCopiedField] = useState<'number' | 'ussd' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [modalView, setModalView] = useState<'form' | 'checkout'>('form');
  const [activeCheckoutReq, setActiveCheckoutReq] = useState<RechargeRequest | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(600);

  useEffect(() => {
    if (isOpen) {
      setSelectedAmount(minDeposit);
      setCustomAmount(minDeposit.toString());
      setPaymentNumber(userPhone ? userPhone.replace(/^(\+250|250)/, '') : '');
      setTxReference('');
      setError(null);
      setIsSubmitting(false);
      setIsRefreshing(false);
      setCopiedField(null);
      setModalView('form');
      setActiveCheckoutReq(null);
      setSecondsLeft(600);
    }
  }, [isOpen, minDeposit, userPhone]);

  useEffect(() => {
    if (!isOpen || modalView !== 'checkout') return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, modalView]);

  const liveCheckoutReq = useMemo(() => {
    if (!activeCheckoutReq) return null;
    return rechargeRequests.find((r) => r.id === activeCheckoutReq.id) || activeCheckoutReq;
  }, [activeCheckoutReq, rechargeRequests]);

  if (!isOpen) return null;

  const presetAmounts = [1000, 3000, 6000, 12500, 25000, 45000, 95000, 600000];

  const handleSelectPreset = (val: number) => {
    setSelectedAmount(val);
    setCustomAmount(val.toString());
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomAmount(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed)) {
      setSelectedAmount(parsed);
    }
  };

  const activeOfficialNumber =
    method === 'mtn' ? adminSettings.mtnNumber : adminSettings.airtelNumber;

  const handleCopyText = async (text: string, field: 'number' | 'ussd') => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
      } catch {
        // ignore
      }
      document.body.removeChild(textarea);
    }
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const amt = parseInt(customAmount, 10);

    if (isNaN(amt) || amt < minDeposit) {
      setError(
        isRw
          ? `Amafaranga make yo kubitsa ni RWF ${minDeposit.toLocaleString()}`
          : `Minimum deposit is RWF ${minDeposit.toLocaleString()}`
      );
      return;
    }

    const cleanSender = normalizeRwandaPhone(paymentNumber);
    if (!/^07[2389]\d{7}$/.test(cleanSender)) {
      setError(
        isRw
          ? 'Shyiramo numero ya telefone ya MoMo / Airtel nyayo (imibare 10)'
          : 'Please enter a valid 10-digit Rwandan Mobile Money phone number'
      );
      return;
    }

    const cleanTxId = txReference.trim();
    if (!cleanTxId || cleanTxId.length < 5 || !/^[a-zA-Z0-9._\-]{5,64}$/.test(cleanTxId)) {
      setError(
        isRw
          ? "Shyiramo nimero y'igikorwa cya MoMo / Airtel (Transaction ID) nyayo iri muri SMS yo kwishyura (byibuze imibare/inyuguti 5)."
          : 'Please enter the real MoMo / Airtel Transaction ID from your payment SMS (minimum 5 characters).'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await onSubmitRecharge(amt, method, cleanSender, cleanTxId);
      const reqObj: RechargeRequest = created || {
        id: `req-${Date.now()}`,
        userId: '',
        userPhone: cleanSender,
        amount: amt,
        paymentMethod: method,
        transactionId: cleanTxId,
        senderPhone: cleanSender,
        status: 'pending',
        timestamp: new Date().toLocaleString('en-GB'),
      };
      setActiveCheckoutReq(reqObj);
      setSecondsLeft(600);
      setTxReference('');
      setModalView('checkout');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isRw
            ? 'Ntibyakunze kohereza ubusabe bwo kubitsa.'
            : 'Failed to submit deposit request.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefreshCheckout = async () => {
    setIsRefreshing(true);
    try {
      if (onRefreshStatus) {
        await onRefreshStatus();
      }
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  const formatCountdown = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(hrs)} : ${pad(mins)} : ${pad(secs)}`;
  };

  if (modalView === 'checkout' && liveCheckoutReq) {
    const payMethod = liveCheckoutReq.paymentMethod;
    const payNumber =
      payMethod === 'mtn' ? adminSettings.mtnNumber : adminSettings.airtelNumber;
    const payAmount = liveCheckoutReq.amount;
    const ussdDisplay =
      payMethod === 'mtn'
        ? `*182*1*1*${payNumber}*${payAmount}#`
        : `*500*1*1*${payNumber}*${payAmount}#`;
    const ussdHref = `tel:${ussdDisplay.replace('#', '%23')}`;
    const paidAmount = liveCheckoutReq.status === 'approved' ? payAmount : 0;

    return (
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
        <div className="w-full max-w-md bg-white border-2 border-[#dc2626] rounded-t-3xl sm:rounded-2xl max-h-[95vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom font-sans">
          {/* Top Red Bar */}
          <div className="bg-[#dc2626] text-white px-4 py-3.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => setModalView('form')}
                aria-label="Back"
                className="p-1.5 rounded-lg bg-white/20 text-white hover:bg-white/30 cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white text-[#dc2626] shrink-0">
                <ShieldCheck className="w-4 h-4 text-[#dc2626]" />
                <span className="text-xs font-black tracking-wide uppercase">
                  SECURE PAYMENT
                </span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs font-bold text-white/90 block leading-none">
                {isRw ? 'Igihe gisigaye' : 'Expires in'}
              </span>
              <span className="text-base font-black font-mono text-white tabular-nums tracking-wider">
                {formatCountdown(secondsLeft)}
              </span>
            </div>
          </div>

          {/* Scrollable Copy & Pay Body */}
          <div className="overflow-y-auto flex-1 p-4 space-y-5 bg-white">
            {/* Step 1 */}
            <div className="flex gap-3">
              <div className="flex flex-col items-center shrink-0 pt-0.5">
                <div className="w-8 h-8 rounded-full border-2 border-[#dc2626] bg-[#fef2f2] flex items-center justify-center text-[#dc2626]">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div className="w-px flex-1 border-l-2 border-dashed border-[#fca5a5] my-1.5" />
              </div>

              <div className="flex-1 min-w-0 space-y-3">
                <div>
                  <h3 className="text-base font-black text-[#7f1d1d] uppercase tracking-wide">
                    COPY &amp; PAY
                  </h3>
                  <p className="text-sm font-bold text-[#991b1b] mt-0.5 leading-relaxed">
                    {payMethod === 'mtn' ? (
                      <>
                        {isRw ? 'Koporora iyi konti ya ' : 'Copy this '}
                        <span className="font-black text-[#dc2626]">MTN MoMo Rwanda</span>
                        {isRw ? ' wishyureho amafaranga' : ' account and make payment'}
                      </>
                    ) : (
                      <>
                        {isRw ? 'Koporora iyi konti ya ' : 'Copy this '}
                        <span className="font-black text-[#dc2626]">Airtel Money Rwanda</span>
                        {isRw ? ' wishyureho amafaranga' : ' account and make payment'}
                      </>
                    )}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#fef2f2] border-2 border-[#fecaca] p-4 space-y-3.5">
                  <div>
                    <span className="text-sm font-extrabold text-[#991b1b] block">
                      {isRw ? 'Amafaranga yose:' : 'Total Amount:'}
                    </span>
                    <span className="text-3xl font-black text-[#dc2626] tabular-nums tracking-tight block mt-0.5">
                      RWF {payAmount.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t-2 border-[#fecaca]">
                    <div className="min-w-0">
                      <span className="text-xs font-extrabold text-[#991b1b] block">
                        {payMethod === 'mtn'
                          ? 'MTN MoMo Rwanda Account:'
                          : 'Airtel Money Rwanda Account:'}
                      </span>
                      <span className="text-2xl font-black font-mono text-[#b91c1c] tracking-wide tabular-nums block mt-0.5">
                        {payNumber}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyText(payNumber, 'number')}
                      aria-label="Copy payment number"
                      className="min-h-[42px] px-3 rounded-xl bg-[#dc2626] text-white hover:bg-[#b91c1c] flex items-center justify-center gap-1.5 text-sm font-black shrink-0 cursor-pointer"
                    >
                      {copiedField === 'number' ? (
                        <Check className="w-4 h-4 text-white" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      <span>
                        {copiedField === 'number'
                          ? isRw
                            ? 'Byakoporowe'
                            : 'Copied'
                          : isRw
                            ? 'Koporora'
                            : 'Copy'}
                      </span>
                    </button>
                  </div>
                </div>

                <a
                  href={ussdHref}
                  className="w-full py-4 rounded-full bg-[#dc2626] hover:bg-[#b91c1c] text-white font-black text-lg shadow-md active:scale-[0.99] transition-all flex items-center justify-center text-center"
                >
                  {isRw ? 'Kanda wishyure (Click to pay)' : 'Click to pay'}
                </a>

                <div className="flex items-center justify-center gap-2 text-center">
                  <span className="font-mono font-black text-base text-[#b91c1c] tabular-nums select-all">
                    {ussdDisplay}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyText(ussdDisplay, 'ussd')}
                    aria-label="Copy USSD code"
                    className="p-2 rounded-lg text-[#dc2626] hover:bg-[#fee2e2] cursor-pointer"
                  >
                    {copiedField === 'ussd' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-3">
              <div className="flex flex-col items-center shrink-0 pt-0.5">
                <div className="w-8 h-8 rounded-full border-2 border-[#dc2626] bg-[#fef2f2] flex items-center justify-center text-[#dc2626]">
                  <Check className="w-4 h-4" />
                </div>
                <div className="w-px flex-1 border-l-2 border-dashed border-[#fca5a5] my-1.5" />
              </div>

              <div className="flex-1 min-w-0 space-y-2.5">
                <div>
                  <h4 className="text-base font-black text-[#7f1d1d]">
                    {isRw ? 'Warangije kwishyura?' : 'Payment completed?'}
                  </h4>
                  <p className="text-sm font-bold text-[#991b1b] mt-0.5">
                    {isRw ? 'Kanda "' : 'Click "'}
                    <span className="font-black text-[#dc2626]">Refresh</span>
                    {isRw ? '" urebe niba byemejwe' : '" to check if it is successful'}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#fef2f2] border-2 border-[#fecaca] p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-extrabold text-[#991b1b] block">
                        {isRw ? 'Ayamaze kwemezwa:' : 'Amount paid:'}
                      </span>
                      <span className="text-2xl font-black text-[#7f1d1d] tabular-nums">
                        RWF {paidAmount.toLocaleString()}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRefreshCheckout}
                      disabled={isRefreshing}
                      className="px-4 py-2.5 rounded-full bg-[#dc2626] hover:bg-[#b91c1c] text-white font-black text-sm shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-70 shrink-0"
                    >
                      <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </button>
                  </div>

                  {liveCheckoutReq.status === 'approved' ? (
                    <div className="p-3 rounded-xl bg-[#dc2626] text-white text-sm font-black">
                      {isRw
                        ? 'Byemejwe na Admin! Amafaranga yageze kuri konti yawe.'
                        : 'Approved by Admin & credited to your account!'}
                    </div>
                  ) : liveCheckoutReq.status === 'rejected' ? (
                    <div className="p-3 rounded-xl bg-white border-2 border-[#dc2626] text-[#b91c1c] text-sm font-black">
                      {isRw
                        ? 'Ubu busabe bwanzwe na Admin. Ongera ugerageze cyangwa uvugane na Support.'
                        : 'Rejected by Admin — verify payment or contact support.'}
                    </div>
                  ) : (
                    <p className="text-xs font-bold text-[#991b1b] leading-relaxed">
                      {isRw
                        ? 'Ubwishyu bwemezwa mu minota 2-10. Kanda Refresh urebe impinduka.'
                        : 'The payment is expected to be successful in 2-10 minutes. Click Refresh to update results.'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3 pt-1">
              <div className="w-8 h-8 rounded-full border-2 border-[#dc2626] bg-[#fef2f2] flex items-center justify-center text-[#dc2626] shrink-0 mt-0.5">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="space-y-1 min-w-0">
                <div>
                  <span className="text-xs font-extrabold text-[#991b1b] block">
                    {isRw ? 'Numero yawe wishyuyeho:' : 'Your payment account:'}
                  </span>
                  <span className="text-base font-black font-mono text-[#7f1d1d] tabular-nums">
                    {liveCheckoutReq.senderPhone}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-extrabold text-[#991b1b] block">
                    {isRw ? 'Transaction ID yoherejwe:' : 'Submitted Transaction ID:'}
                  </span>
                  <span className="text-sm font-black font-mono text-[#dc2626] break-all">
                    {liveCheckoutReq.transactionId}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="px-4 py-3.5 border-t-2 border-[#fecaca] bg-[#fef2f2] flex items-center justify-between gap-2 text-sm">
            <span className="text-[#991b1b] font-black">
              {isRw ? 'Kubitsa birakora 24/7.' : 'Recharges are available 24/7.'}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-full bg-[#dc2626] text-white font-black cursor-pointer"
            >
              {isRw ? 'Funga' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-white border-2 border-[#dc2626] rounded-t-3xl sm:rounded-2xl max-h-[95vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom font-sans">
        {/* Top Red Header Bar */}
        <div className="bg-[#dc2626] text-white px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-white" />
            <span className="font-black text-base tracking-wide">
              {isRw ? 'Kubitsa Ako Kanya (Live Deposit)' : 'Live Deposit Channel'}
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
          {/* Account Balance & Large Product Photo Card */}
          <div className="relative rounded-2xl overflow-hidden bg-[#fef2f2] border-2 border-[#fecaca] p-4 flex items-center justify-between gap-3 min-h-[112px]">
            <div>
              <span className="text-3xl font-black text-[#dc2626] block tracking-tight tabular-nums">
                RWF {userBalance.toLocaleString()}
              </span>
              <span className="text-sm font-black text-[#991b1b] block mt-1">
                {isRw ? 'Amafaranga ariho' : 'Account balance'}
              </span>
            </div>
            <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-sm border-2 border-[#dc2626] shrink-0">
              <img
                src={picanonDepositShowcase}
                alt="Picanon Apparel and Footwear"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount Section */}
            <div>
              <label className="block text-base font-black text-[#7f1d1d] mb-2">
                {isRw ? 'Amafaranga yo kubitsa' : 'Recharge amount'}{' '}
                <span className="text-[#991b1b] font-bold text-sm">
                  ({isRw ? `Byibuze RWF ${minDeposit.toLocaleString()}` : `Minimum RWF ${minDeposit.toLocaleString()}`})
                </span>
              </label>

              <div className="grid grid-cols-4 gap-2">
                {presetAmounts.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className={`py-2.5 px-1 text-center rounded-xl border-2 text-sm font-black tabular-nums transition-all cursor-pointer ${
                      selectedAmount === p
                        ? 'border-[#dc2626] bg-[#dc2626] text-white'
                        : 'border-[#fecaca] bg-white text-[#991b1b] hover:bg-[#fef2f2]'
                    }`}
                  >
                    {p.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount Input */}
            <div className="flex rounded-xl border-2 border-[#fca5a5] overflow-hidden focus-within:border-[#dc2626] bg-white">
              <span className="bg-[#fef2f2] border-r-2 border-[#fca5a5] px-4 py-3 text-sm font-black text-[#b91c1c] flex items-center">
                RWF
              </span>
              <input
                type="number"
                value={customAmount}
                onChange={handleCustomChange}
                placeholder={isRw ? 'Shyiramo amafaranga ushaka kubitsa' : 'Please enter the recharge amount'}
                className="w-full px-3.5 py-3 text-base font-black text-[#7f1d1d] focus:outline-none tabular-nums"
                required
              />
            </div>

            {/* Payment Channels Section */}
            <div>
              <label className="block text-base font-black text-[#7f1d1d] mb-2">
                {isRw ? 'Uburyo bwo kwishyura' : 'Payment channels'}
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setMethod('mtn')}
                  className={`py-3 px-3 rounded-xl border-2 text-sm font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    method === 'mtn'
                      ? 'bg-[#dc2626] text-white border-[#dc2626] shadow-xs'
                      : 'bg-white text-[#991b1b] border-[#fecaca] hover:bg-[#fef2f2]'
                  }`}
                >
                  <span>MTN MoMo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('airtel')}
                  className={`py-3 px-3 rounded-xl border-2 text-sm font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    method === 'airtel'
                      ? 'bg-[#dc2626] text-white border-[#dc2626] shadow-xs'
                      : 'bg-white text-[#991b1b] border-[#fecaca] hover:bg-[#fef2f2]'
                  }`}
                >
                  <span>Airtel Money</span>
                </button>
              </div>
            </div>

            {/* Official Picanon Receiving Number & Direct USSD Dial */}
            <div className="p-4 rounded-2xl bg-[#fef2f2] border-2 border-[#fca5a5] space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-xs font-black text-[#991b1b] block">
                    {method === 'mtn'
                      ? isRw
                        ? 'Numero ya MTN MoMo Rwanda:'
                        : 'MTN MoMo Rwanda Account:'
                      : isRw
                        ? 'Numero ya Airtel Money Rwanda:'
                        : 'Airtel Money Rwanda Account:'}
                  </span>
                  <span className="text-2xl font-black font-mono text-[#dc2626] block mt-0.5 tabular-nums">
                    {activeOfficialNumber}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyText(activeOfficialNumber, 'number')}
                  className="px-3.5 py-2.5 rounded-xl bg-[#dc2626] text-white text-sm font-black hover:bg-[#b91c1c] flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  {copiedField === 'number' ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span>
                    {copiedField === 'number'
                      ? isRw
                        ? 'Yakoporowe'
                        : 'Copied'
                      : isRw
                        ? 'Koporora'
                        : 'Copy'}
                  </span>
                </button>
              </div>
              {(() => {
                const dialAmount = Math.max(minDeposit, Number(selectedAmount) || minDeposit);
                const ussdCode =
                  method === 'mtn'
                    ? `*182*1*1*${activeOfficialNumber}*${dialAmount}#`
                    : `*500*1*1*${activeOfficialNumber}*${dialAmount}#`;
                return (
                  <a
                    href={`tel:${ussdCode.replace('#', '%23')}`}
                    className="w-full py-2.5 px-3 rounded-xl bg-white border-2 border-[#dc2626] text-[#dc2626] hover:bg-[#dc2626] hover:text-white font-black text-xs transition-colors flex items-center justify-center gap-2 text-center"
                  >
                    <span>
                      {isRw ? 'Kanda hano wohereze ako kanya:' : 'Tap to dial & pay:'}{' '}
                      <span className="font-mono">{ussdCode}</span>
                    </span>
                  </a>
                );
              })()}
            </div>

            {/* Sender Phone Number */}
            <div>
              <label className="block text-base font-black text-[#7f1d1d] mb-1.5">
                {isRw ? 'Numero yawe wishyuriraho (MoMo / Airtel)' : 'Your payment account (MoMo / Airtel)'}
              </label>
              <div className="flex rounded-xl border-2 border-[#fca5a5] overflow-hidden focus-within:border-[#dc2626] bg-white">
                <span className="bg-[#dc2626] text-white px-4 py-3 text-sm font-black flex items-center gap-1.5 shrink-0">
                  <Smartphone className="w-4 h-4" />
                  +250
                </span>
                <input
                  type="tel"
                  value={paymentNumber}
                  onChange={(e) => setPaymentNumber(e.target.value)}
                  placeholder="078XXXXXXX"
                  className="w-full px-3.5 py-3 text-base font-black font-mono text-[#7f1d1d] focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Required Real MoMo / Airtel Transaction Reference */}
            <div>
              <label className="block text-sm font-black text-[#7f1d1d] mb-1">
                {isRw
                  ? "Nimero y'igikorwa muri SMS ya MoMo / Airtel (Transaction ID - Itegeko)"
                  : 'MoMo / Airtel Transaction ID from SMS (Required)'}
              </label>
              <input
                type="text"
                value={txReference}
                onChange={(e) => setTxReference(e.target.value)}
                minLength={5}
                maxLength={64}
                placeholder={isRw ? 'Urugero: 49281940212 cyangwa MP2605...' : 'e.g. 49281940212 or MP2605...'}
                className="w-full px-3.5 py-3 rounded-xl border-2 border-[#fca5a5] text-sm font-mono font-black text-[#7f1d1d] focus:outline-none focus:border-[#dc2626]"
                required
              />
              <p className="text-xs font-bold text-[#991b1b] mt-1">
                {isRw
                  ? 'Banza wishyure kuri numero iri hejuru, maze wandike Transaction ID iri mu butumwa (SMS) bwa MTN cyangwa Airtel.'
                  : 'Complete the transfer first, then enter the Transaction ID shown in your MTN MoMo / Airtel Money confirmation SMS.'}
              </p>
            </div>

            {error && (
              <div className="p-3 bg-[#fef2f2] border-2 border-[#dc2626] rounded-xl text-[#b91c1c] text-sm font-black">
                {error}
              </div>
            )}

            <div className="pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-full bg-[#dc2626] hover:bg-[#b91c1c] text-white font-black text-base active:scale-[0.99] transition-all shadow-md cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                <span>
                  {isSubmitting
                    ? isRw
                      ? 'Biri gutegurwa...'
                      : 'Opening secure payment...'
                    : isRw
                      ? 'Komeza wishyure (Copy & Pay)'
                      : 'Proceed to Copy & Pay'}
                </span>
              </button>
            </div>
          </form>

          {/* Recharge Instructions */}
          <div className="pt-4 border-t-2 border-[#fecaca] space-y-2">
            <h4 className="text-base font-black text-[#7f1d1d]">
              {isRw ? 'Amabwiriza yo kubitsa' : 'Deposit Instructions'}
            </h4>
            <div className="space-y-1.5 text-sm font-bold text-[#991b1b] leading-relaxed">
              <p>
                1. {isRw ? `Amafaranga make yo kubitsa ni RWF ${minDeposit.toLocaleString()}. Kubitsa bikorwa igihe cyose (24/7).` : `Minimum deposit is RWF ${minDeposit.toLocaleString()}. Available 24/7.`}
              </p>
              <p>
                2. {isRw ? 'Nyuma yo kubitsa, ushobora kureba amakuru arambuye y’ubusabe bwawe muri Menu -> Ibyakozwe (Records).' : 'After submitting, you can track your deposit details inside Menu -> Records.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
