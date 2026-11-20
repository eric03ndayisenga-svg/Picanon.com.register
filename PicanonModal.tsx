import React, { useState } from 'react';
import {
  X,
  HelpCircle,
  ChevronDown,
  TrendingUp,
  Crown,
  Wallet,
  CheckCircle2,
  ArrowRight,
  Headphones,
} from 'lucide-react';
import { Language, AdminSettings, VIPProduct } from '../types';
import { picanonBrandEmblem } from '../assets/images';

interface PicanonModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminSettings: AdminSettings;
  products: VIPProduct[];
  language: Language;
  onOpenDeposit?: () => void;
  onNavigateToProducts?: () => void;
  onOpenSupport?: () => void;
}

type FaqCategory = 'all' | 'investing' | 'vip' | 'withdrawal';

interface FaqItem {
  id: string;
  category: Exclude<FaqCategory, 'all'>;
  questionRw: string;
  questionEn: string;
  answerRw: string;
  answerEn: string;
  stepsRw?: string[];
  stepsEn?: string[];
}

export const PicanonModal: React.FC<PicanonModalProps> = ({
  isOpen,
  onClose,
  adminSettings,
  products,
  language,
  onOpenDeposit,
  onNavigateToProducts,
  onOpenSupport,
}) => {
  const [activeCategory, setActiveCategory] = useState<FaqCategory>('all');
  const [expandedId, setExpandedId] = useState<string>('start-1');

  if (!isOpen) return null;

  const isRw = language === 'rw';
  const minDeposit = adminSettings.minDeposit || 1000;
  const minWithdrawal = adminSettings.minWithdrawal || 1000;
  const feePercent = adminSettings.withdrawalFeePercent ?? 10;

  const faqItems: FaqItem[] = [
    {
      id: 'start-1',
      category: 'investing',
      questionRw: 'Natangira nte gushora imari muri Picanon?',
      questionEn: 'How do I start investing on Picanon?',
      answerRw:
        'Gutangira gushora imari mu myambaro n’inkweto bya Picanon biroroshye kandi bifata iminota mike ukoresheje MTN Mobile Money cyangwa Airtel Money.',
      answerEn:
        'Starting your investment in Picanon apparel and footwear takes only a few minutes using MTN Mobile Money or Airtel Money.',
      stepsRw: [
        'Fungura konti yawe maze uhite ubona impano y’ikaze ya RWF 1,500 hamwe n’amahirwe 2 yo kuzengurutsa Lucky Wheel.',
        `Kanda kuri "Kubitsa" (Recharge), uhitemo igiciro kuva kuri RWF ${minDeposit.toLocaleString()} kuzamura, wohereze amafaranga kuri MTN (${adminSettings.mtnNumber}) cyangwa Airtel (${adminSettings.airtelNumber}).`,
        'Nyuma yo kwemeza ubwishyu, jya ahanditse "Ibicuruzwa" (Products) ugure icyiciro cya VIP cy’imyambaro cyangwa inkweto wifuza (guhera kuri VIP 0 kugeza kuri VIP 10).',
        'Buri masaha 24 (rimwe ku munsi), jya kuri "Imirimo" (Tasks) ukande kuri "Akira inyungu" kugira ngo amafaranga yiyongere kuri konti yawe.',
      ],
      stepsEn: [
        'Create your account and automatically receive your RWF 1,500 welcome bonus plus 2 free Lucky Wheel spins.',
        `Tap "Recharge", enter at least RWF ${minDeposit.toLocaleString()}, and send via MTN MoMo (${adminSettings.mtnNumber}) or Airtel Money (${adminSettings.airtelNumber}).`,
        'Once your balance is credited, go to the "Products" tab and purchase any VIP clothing or footwear package from VIP 0 up to VIP 10.',
        'Once every 24 hours, visit the "Tasks" tab to claim your daily income directly to your balance.',
      ],
    },
    {
      id: 'start-2',
      category: 'investing',
      questionRw: 'Ni ayahe mafaranga make asabwa kugira ngo ntangire?',
      questionEn: 'What is the minimum amount needed to start?',
      answerRw: `Amafaranga make yo kubitsa ni RWF ${minDeposit.toLocaleString()}, kandi atangira icyiciro cya VIP 0 (Picanon Starter Canvas Sneakers) gitanga RWF 600 buri munsi mu gihe cy’iminsi 40 (Yose hamwe ni RWF 24,000).`,
      answerEn: `The minimum deposit is RWF ${minDeposit.toLocaleString()}, which unlocks VIP 0 (Picanon Starter Canvas Sneakers) earning RWF 600 daily for 40 days (RWF 24,000 total).`,
    },
    {
      id: 'vip-1',
      category: 'vip',
      questionRw: 'Ibyiciro bya VIP (VIP 0 - VIP 10) bikora bite?',
      questionEn: 'How do the VIP levels (VIP 0 - VIP 10) work?',
      answerRw:
        'Buri cyiciro cya VIP guhera kuri VIP 0 (RWF 3,000 -> +600 RWF/24h) kugeza kuri VIP 10 (RWF 10,000,000) gihwanye n’ubwoko bw’imyambaro cyangwa inkweto bya Picanon ushoramo imari. Inyungu yakirwa rimwe mu masaha 24.',
      answerEn:
        'Each VIP level from VIP 0 (RWF 3,000 -> +600 RWF/24h) up to VIP 10 (RWF 10,000,000) corresponds to a curated Picanon apparel or footwear package. Daily profits are claimed once every 24 hours.',
    },
    {
      id: 'vip-2',
      category: 'vip',
      questionRw: 'Nshobora kugura ibyiciro bya VIP birenze kimwe cyangwa gukoresha Team?',
      questionEn: 'Can I hold multiple VIP packages or earn extra bonuses?',
      answerRw:
        'Yego! Ushobora kugura imyambaro n’inkweto bya VIP byinshi bigakora icyarimwe inyungu zikikusanya buri munsi. Wanabona kandi komisiyo z’ubutumire (Level 1: 38%, Level 2: 2%, Level 3: 1%).',
      answerEn:
        'Yes! You can own multiple active VIP clothing & footwear packages simultaneously and stack their daily income. You also earn team referral commissions (Level 1: 38%, Level 2: 2%, Level 3: 1%).',
    },
    {
      id: 'withdraw-1',
      category: 'withdrawal',
      questionRw: 'Uburyo bwo kubikuza amafaranga bukora bute?',
      questionEn: 'How does the withdrawal process operate?',
      answerRw:
        'Kubikuza amafaranga bikorwa 24/7 byikora (automated) byoherezwa kuri numero yawe ya MTN Mobile Money cyangwa Airtel Money.',
      answerEn:
        'Withdrawals are available 24/7 and are paid directly to your MTN Mobile Money or Airtel Money number.',
      stepsRw: [
        'Kanda kuri "Kubikuza" (Withdraw) ku rupapuro rw’itangiriro cyangwa muri Menu.',
        'Hitamo uburyo bwo kwakira (MTN MoMo cyangwa Airtel Money) kandi wandike numero yawe neza.',
        `Injiza umubare w’amafaranga kuva kuri RWF ${minWithdrawal.toLocaleString()} kugeza kuri RWF 5,000,000 ku munsi.`,
        `Hakurwaho umusoro wa serivisi wa ${feePercent}%, ubundi amafaranga asigaye akoherezwa kuri telefone yawe nyuma yo kwemezwa.`,
      ],
      stepsEn: [
        'Tap "Withdraw" from the Home screen or your Menu tab.',
        'Select MTN MoMo or Airtel Money and verify your recipient phone number and account name.',
        `Enter any amount from RWF ${minWithdrawal.toLocaleString()} up to RWF 5,000,000 per day.`,
        `A ${feePercent}% processing fee applies, and the net payout is sent to your mobile wallet once approved.`,
      ],
    },
    {
      id: 'withdraw-2',
      category: 'withdrawal',
      questionRw: 'Umusoro wo kubikuza ungana ute kandi nkurikirana nte ubwishyu bwanjye?',
      questionEn: 'What is the withdrawal fee and how do I track my payout?',
      answerRw: `Umusoro wa serivisi ni ${feePercent}% (urugero: ubikuje RWF 10,000, hakurwaho RWF ${(10000 * feePercent) / 100}, ubona RWF ${(10000 - (10000 * feePercent) / 100).toLocaleString()}). Ushobora kureba aho ugeze muri Menu > "Ibyo wabikuje" (Withdrawal records).`,
      answerEn: `The processing fee is ${feePercent}% (for example, on a RWF 10,000 withdrawal, RWF ${((10000 * feePercent) / 100).toLocaleString()} is deducted and you receive RWF ${(10000 - (10000 * feePercent) / 100).toLocaleString()}). Track every payout under Menu > "Withdrawal records".`,
    },
  ];

  const filteredItems =
    activeCategory === 'all'
      ? faqItems
      : faqItems.filter((item) => item.category === activeCategory);

  const toggleItem = (id: string) => {
    setExpandedId((prev) => (prev === id ? '' : id));
  };

  const getCategoryMeta = (cat: Exclude<FaqCategory, 'all'>) => {
    if (cat === 'investing') {
      return {
        label: isRw ? 'Gushora Imari' : 'Start Investing',
        icon: TrendingUp,
      };
    }
    if (cat === 'vip') {
      return {
        label: isRw ? 'Ibyiciro bya VIP' : 'VIP Levels',
        icon: Crown,
      };
    }
    return {
      label: isRw ? 'Kubikuza' : 'Withdrawals',
      icon: Wallet,
    };
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in font-sans">
      <div className="w-full max-w-md bg-white border-2 border-[#dc2626] rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom">
        {/* Header */}
        <div className="p-4 border-b-2 border-[#fecaca] flex items-center justify-between bg-[#dc2626] text-white">
          <div className="flex items-center gap-3">
            <img
              src={picanonBrandEmblem}
              alt="Picanon"
              className="w-12 h-12 rounded-full object-cover border-2 border-white"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-xl text-white tracking-tight">
                  Picanon
                </h3>
                <span className="text-xs font-black text-[#dc2626] bg-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                  FAQ
                </span>
              </div>
              <p className="text-xs font-bold text-white/95">
                {isRw
                  ? "Ibibazo Bikunze Kubazwa · Ubuyobozi bwa Picanon"
                  : 'Frequently Asked Questions · Picanon Guide'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={isRw ? 'Funga' : 'Close'}
            className="p-1.5 rounded-full text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="grid grid-cols-4 p-1.5 bg-[#fee2e2] border-b-2 border-[#fecaca] text-xs font-black gap-1">
          <button
            onClick={() => setActiveCategory('all')}
            className={`py-2.5 px-1 rounded-lg text-center transition-all cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-[#dc2626] text-white shadow-xs'
                : 'text-[#991b1b] hover:bg-white/60'
            }`}
          >
            {isRw ? 'Byose' : 'All'}
          </button>
          <button
            onClick={() => {
              setActiveCategory('investing');
              setExpandedId('start-1');
            }}
            className={`py-2.5 px-1 rounded-lg text-center transition-all cursor-pointer ${
              activeCategory === 'investing'
                ? 'bg-[#dc2626] text-white shadow-xs'
                : 'text-[#991b1b] hover:bg-white/60'
            }`}
          >
            {isRw ? 'Gushora' : 'Investing'}
          </button>
          <button
            onClick={() => {
              setActiveCategory('vip');
              setExpandedId('vip-1');
            }}
            className={`py-2.5 px-1 rounded-lg text-center transition-all cursor-pointer ${
              activeCategory === 'vip'
                ? 'bg-[#dc2626] text-white shadow-xs'
                : 'text-[#991b1b] hover:bg-white/60'
            }`}
          >
            {isRw ? 'VIP' : 'VIP Levels'}
          </button>
          <button
            onClick={() => {
              setActiveCategory('withdrawal');
              setExpandedId('withdraw-1');
            }}
            className={`py-2.5 px-1 rounded-lg text-center transition-all cursor-pointer ${
              activeCategory === 'withdrawal'
                ? 'bg-[#dc2626] text-white shadow-xs'
                : 'text-[#991b1b] hover:bg-white/60'
            }`}
          >
            {isRw ? 'Kubikuza' : 'Withdraw'}
          </button>
        </div>

        {/* FAQ Content */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 bg-white">
          <div className="p-4 rounded-2xl bg-[#dc2626] text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-[#dc2626] flex items-center justify-center shrink-0">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-white">
                {isRw ? 'Picanon — Sobanukirwa neza' : 'Picanon — Frequently Asked Questions'}
              </p>
              <p className="text-xs font-bold text-white/95 leading-snug mt-0.5">
                {isRw
                  ? 'Amakuru y’ingenzi ku gushora imari, ibyiciro bya VIP, n’uko ubikuza amafaranga.'
                  : 'Everything you need to know about starting investments, VIP tiers, and withdrawals.'}
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {filteredItems.map((item) => {
              const isExpanded = expandedId === item.id;
              const meta = getCategoryMeta(item.category);
              const CatIcon = meta.icon;
              const steps = isRw ? item.stepsRw : item.stepsEn;

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border-2 transition-all overflow-hidden ${
                    isExpanded
                      ? 'border-[#dc2626] bg-[#fef2f2] shadow-xs'
                      : 'border-[#fecaca] bg-white hover:border-[#dc2626]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    className="w-full p-4 flex items-start justify-between gap-3 text-left cursor-pointer"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <span className="inline-flex items-center gap-1.5 text-xs font-black px-2.5 py-0.5 rounded-full bg-[#dc2626] text-white">
                        <CatIcon className="w-3.5 h-3.5" />
                        <span>{meta.label}</span>
                      </span>
                      <h4 className="text-sm sm:text-base font-black text-[#7f1d1d] leading-snug">
                        {isRw ? item.questionRw : item.questionEn}
                      </h4>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-[#dc2626] shrink-0 mt-1 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 space-y-2.5 text-sm font-bold text-[#7f1d1d] leading-relaxed border-t-2 border-[#fecaca]">
                      <p className="pt-2.5">{isRw ? item.answerRw : item.answerEn}</p>

                      {steps && steps.length > 0 && (
                        <div className="space-y-2 pt-1">
                          {steps.map((step, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2.5 bg-white p-3 rounded-xl border border-[#fecaca]"
                            >
                              <span className="w-6 h-6 rounded-full bg-[#dc2626] text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <span className="text-xs sm:text-sm font-bold text-[#7f1d1d] leading-snug">
                                {step}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {item.id === 'vip-1' && products.length > 0 && (
                        <div className="bg-white rounded-xl border-2 border-[#fecaca] overflow-hidden mt-2">
                          <div className="px-3 py-2 bg-[#fee2e2] border-b border-[#fecaca] flex items-center justify-between text-xs font-black uppercase tracking-wider text-[#991b1b]">
                            <span>{isRw ? 'Icyiciro' : 'Tier'}</span>
                            <span>{isRw ? 'Igiciro' : 'Price'}</span>
                            <span>{isRw ? 'Ku munsi' : 'Daily'}</span>
                          </div>
                          <div className="divide-y divide-[#fee2e2]">
                            {products.map((prod) => (
                              <div
                                key={prod.id}
                                className="px-3 py-2.5 flex items-center justify-between text-xs sm:text-sm"
                              >
                                <span className="font-black text-[#7f1d1d]">
                                  VIP {prod.vipLevel}
                                </span>
                                <span className="font-mono font-black text-[#991b1b]">
                                  RWF {prod.price.toLocaleString()}
                                </span>
                                <span className="font-mono font-black text-[#dc2626]">
                                  +{prod.dailyIncome.toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Quick Actions */}
        <div className="p-3.5 border-t-2 border-[#fecaca] bg-[#fef2f2] flex items-center gap-2">
          {onNavigateToProducts && (
            <button
              onClick={() => {
                onClose();
                onNavigateToProducts();
              }}
              className="flex-1 py-3 px-3 rounded-full bg-white border-2 border-[#dc2626] text-[#dc2626] text-sm font-black hover:bg-[#fee2e2] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{isRw ? 'Reba VIP' : 'View VIP Plans'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          {onOpenDeposit && (
            <button
              onClick={() => {
                onClose();
                onOpenDeposit();
              }}
              className="flex-1 py-3 px-3 rounded-full bg-[#dc2626] text-white text-sm font-black hover:bg-[#b91c1c] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isRw ? 'Bitsa Nonaha' : 'Deposit Now'}</span>
            </button>
          )}
          {onOpenSupport && (
            <button
              onClick={() => {
                onClose();
                onOpenSupport();
              }}
              aria-label={isRw ? 'Ubufasha' : 'Support'}
              className="py-3 px-3.5 rounded-full border-2 border-[#dc2626] bg-white text-[#dc2626] text-sm font-black hover:bg-[#fee2e2] transition-colors flex items-center justify-center cursor-pointer"
            >
              <Headphones className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
