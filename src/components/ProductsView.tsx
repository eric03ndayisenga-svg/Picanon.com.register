import React, { useState } from 'react';
import {
  TrendingUp,
  Clock,
  Calendar,
  List,
  LayoutGrid,
  ArrowUpRight,
  X,
  CheckCircle2,
} from 'lucide-react';
import { UserAccount, VIPProduct, InvestmentRecord, Language } from '../types';
import {
  picanonBrandEmblem,
  picanonProductsBanner,
  picanonClassicSneakers,
  picanonStreetwearCollection,
  picanonLeatherBoots,
  picanonTailoredSuit,
  picanonAthleticRunners,
  picanonVip5Tracksuit,
  picanonVip6Capsule,
  picanonVip7Atelier,
  picanonVip8Showroom,
  picanonVip9Couture,
  picanonVip10Empire,
} from '../assets/images';

interface ProductsViewProps {
  user: UserAccount;
  products: VIPProduct[];
  activeInvestments: InvestmentRecord[];
  onInvest: (product: VIPProduct) => Promise<void> | void;
  onOpenDeposit: () => void;
  language: Language;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  user,
  products,
  activeInvestments,
  onInvest,
  onOpenDeposit,
  language,
}) => {
  const isRw = language === 'rw';
  const [confirmProduct, setConfirmProduct] = useState<VIPProduct | null>(null);
  const [isPurchasing, setIsPurchasing] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showOwnedOnly, setShowOwnedOnly] = useState<boolean>(false);

  const activeProductCount = activeInvestments.filter((inv) => inv.status === 'active').length;

  const getProductImage = (product: VIPProduct) => {
    if (product.image) return product.image;
    switch (product.vipLevel) {
      case 0:
        return picanonClassicSneakers;
      case 1:
        return picanonAthleticRunners;
      case 2:
        return picanonStreetwearCollection;
      case 3:
        return picanonLeatherBoots;
      case 4:
        return picanonTailoredSuit;
      case 5:
        return picanonVip5Tracksuit;
      case 6:
        return picanonVip6Capsule;
      case 7:
        return picanonVip7Atelier;
      case 8:
        return picanonVip8Showroom;
      case 9:
        return picanonVip9Couture;
      case 10:
      default:
        return picanonVip10Empire;
    }
  };

  const handleBuyClick = (product: VIPProduct) => {
    if (user.balance < product.price) {
      void onInvest(product);
      return;
    }
    setConfirmProduct(product);
  };

  const handleConfirmPurchase = async () => {
    if (!confirmProduct || isPurchasing) return;
    setIsPurchasing(true);
    try {
      await onInvest(confirmProduct);
      setConfirmProduct(null);
    } finally {
      setIsPurchasing(false);
    }
  };

  const visibleProducts = showOwnedOnly
    ? products.filter((p) =>
        activeInvestments.some((inv) => inv.vipLevel === p.vipLevel && inv.status === 'active')
      )
    : products;

  return (
    <div className="min-h-screen bg-white pb-28 max-w-md mx-auto animate-in fade-in duration-150">
      {/* 1. Top Red Header Bar */}
      <div className="bg-[#dc2626] text-white px-4 py-4 flex items-center justify-between shadow-sm">
        <h1 className="font-display text-2xl font-black tracking-tight">
          {isRw ? 'Ibicuruzwa' : 'Products'}
        </h1>
        <div className="flex items-center gap-2.5">
          <img
            src={picanonBrandEmblem}
            alt="Picanon"
            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
          />
          <span className="font-display text-sm font-black tracking-[0.2em] uppercase">
            PICANON
          </span>
        </div>
      </div>

      {/* 2. Large Hero Photo Slogan Strip */}
      <div className="relative h-36 overflow-hidden bg-[#7f1d1d]">
        <img
          src={picanonProductsBanner}
          alt="Picanon Collections"
          className="w-full h-full object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#7f1d1d]/90 via-[#991b1b]/35 to-transparent flex items-end p-4">
          <p className="text-white font-black text-xl sm:text-2xl tracking-tight leading-snug drop-shadow-sm">
            {isRw ? 'Shora uyu munsi. Wunguke buri munsi.' : 'Invest today. Earn every day.'}
          </p>
        </div>
      </div>

      {/* 3. Three Red Circle Highlights */}
      <div className="bg-white px-4 py-4 grid grid-cols-3 gap-2 text-center border-b-2 border-[#fecaca]">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-[#dc2626] text-white flex items-center justify-center mb-2 shadow-sm">
            <TrendingUp className="w-6 h-6 stroke-[2.4]" />
          </div>
          <span className="text-xs font-extrabold text-[#991b1b]">
            {isRw ? 'Inyungu ya buri munsi' : 'Daily income'}
          </span>
          <span className="text-sm sm:text-base font-black text-[#7f1d1d] mt-0.5">
            {isRw ? 'Buri munsi' : 'Every day'}
          </span>
        </div>

        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-[#dc2626] text-white flex items-center justify-center mb-2 shadow-sm">
            <Clock className="w-6 h-6 stroke-[2.4]" />
          </div>
          <span className="text-xs font-extrabold text-[#991b1b]">
            {isRw ? 'Igihe cyo kwakira' : 'Income cycle'}
          </span>
          <span className="text-sm sm:text-base font-black text-[#7f1d1d] mt-0.5">
            {isRw ? 'Amasaha 24' : '24 hours'}
          </span>
        </div>

        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-[#dc2626] text-white flex items-center justify-center mb-2 shadow-sm">
            <Calendar className="w-6 h-6 stroke-[2.4]" />
          </div>
          <span className="text-xs font-extrabold text-[#991b1b]">
            {isRw ? 'Igihe kimara' : 'Duration'}
          </span>
          <span className="text-sm sm:text-base font-black text-[#7f1d1d] mt-0.5">
            {isRw ? '40–180 iminsi' : '40–180 days'}
          </span>
        </div>
      </div>

      {/* 4. Floating Stats Pill Card (My products | My income) */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-[28px] border-2 border-[#fecaca] shadow-[0_6px_22px_rgba(220,38,38,0.09)] py-4 px-5 grid grid-cols-2 items-center text-center">
          <button
            type="button"
            onClick={() => setShowOwnedOnly((prev) => !prev)}
            className="flex flex-col items-center justify-center border-r-2 border-[#fecaca] pr-2 cursor-pointer"
          >
            <span className="text-3xl font-black text-[#7f1d1d] tabular-nums">
              {activeProductCount}
            </span>
            <span className="text-sm sm:text-base font-black text-[#991b1b] flex items-center gap-1 mt-0.5">
              <span>{isRw ? 'Ibicuruzwa byanjye' : 'My products'}</span>
              <ArrowUpRight className="w-4 h-4 text-[#dc2626] stroke-[2.5]" />
            </span>
          </button>

          <div className="flex flex-col items-center justify-center pl-2">
            <span className="text-2xl sm:text-3xl font-black text-[#dc2626] tabular-nums">
              {user.totalIncome.toLocaleString()} Frw
            </span>
            <span className="text-sm sm:text-base font-black text-[#991b1b] mt-0.5">
              {isRw ? 'Inyungu yanjye' : 'My income'}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Available Balance + Recharge Pill */}
      <div className="px-4 mt-4 flex items-center justify-between gap-3">
        <div>
          <span className="text-sm font-black text-[#991b1b] block">
            {isRw ? 'Amafaranga ufite' : 'Available balance'}
          </span>
          <span className="text-3xl font-black text-[#dc2626] tabular-nums block">
            {user.balance.toLocaleString()} Frw
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenDeposit}
          className="bg-[#dc2626] hover:bg-[#b91c1c] text-white font-black text-base px-6 py-3 rounded-full shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <span>{isRw ? 'Kubitsa' : 'Recharge'}</span>
          <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      {/* 6. VIP Products Header + View Toggle */}
      <div className="px-4 mt-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-black text-[#7f1d1d] tracking-tight">
            {isRw ? 'Ibyiciro bya VIP' : 'VIP products'}
          </h2>
          {showOwnedOnly && (
            <button
              type="button"
              onClick={() => setShowOwnedOnly(false)}
              className="text-xs font-black px-3 py-1 rounded-full bg-[#dc2626] text-white cursor-pointer"
            >
              {isRw ? 'Reba byose' : 'Show all'}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            aria-label="List view"
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors cursor-pointer border-2 ${
              viewMode === 'list'
                ? 'bg-[#dc2626] border-[#dc2626] text-white shadow-sm'
                : 'bg-white border-[#fecaca] text-[#991b1b] hover:bg-[#fef2f2]'
            }`}
          >
            <List className="w-5 h-5 stroke-[2.4]" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors cursor-pointer border-2 ${
              viewMode === 'grid'
                ? 'bg-[#dc2626] border-[#dc2626] text-white shadow-sm'
                : 'bg-white border-[#fecaca] text-[#991b1b] hover:bg-[#fef2f2]'
            }`}
          >
            <LayoutGrid className="w-5 h-5 stroke-[2.4]" />
          </button>
        </div>
      </div>

      {/* 7. VIP Product Cards (Large Clear Photos & Bold Text) */}
      <div className={`px-4 mt-3.5 ${viewMode === 'grid' ? 'grid grid-cols-2 gap-3.5' : 'space-y-4'}`}>
        {visibleProducts.length === 0 ? (
          <div className="col-span-2 bg-white border-2 border-[#fecaca] rounded-[28px] p-8 text-center shadow-xs">
            <p className="text-base font-black text-[#991b1b]">
              {isRw ? 'Nta bicuruzwa bya VIP uragura.' : 'No active VIP products owned yet.'}
            </p>
            <button
              type="button"
              onClick={() => setShowOwnedOnly(false)}
              className="mt-4 px-6 py-3 rounded-full bg-[#dc2626] text-white text-sm font-black cursor-pointer"
            >
              {isRw ? 'Reba VIP 0 – VIP 10' : 'Browse VIP 0 – VIP 10'}
            </button>
          </div>
        ) : (
          visibleProducts.map((product) => {
            const isOwned = activeInvestments.some(
              (inv) => inv.vipLevel === product.vipLevel && inv.status === 'active'
            );
            const productImage = getProductImage(product);

            if (viewMode === 'grid') {
              return (
                <div
                  key={product.id}
                  className="bg-white rounded-[26px] border-2 border-[#fecaca] p-3 shadow-[0_6px_18px_rgba(220,38,38,0.08)] flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#fef2f2] border border-[#fecaca] mb-3">
                      <img
                        src={productImage}
                        alt={isRw ? product.nameRw : product.nameEn}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 left-2 bg-[#dc2626] text-white text-xs font-black px-3 py-1 rounded-full shadow-sm">
                        Vip {product.vipLevel}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-[#7f1d1d] leading-tight line-clamp-2">
                      Picanon Vip {product.vipLevel}
                    </h3>
                    <p className="text-base font-black text-[#dc2626] mt-1 tabular-nums">
                      {product.price.toLocaleString()} Frw
                    </p>
                    <p className="text-xs font-extrabold text-[#991b1b] mt-0.5 tabular-nums">
                      +{product.dailyIncome.toLocaleString()} Frw / {isRw ? 'munsi' : 'day'}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isOwned}
                    onClick={() => handleBuyClick(product)}
                    className={`mt-3 w-full py-2.5 rounded-full font-black text-sm flex items-center justify-center gap-1 transition-all ${
                      isOwned
                        ? 'bg-[#fee2e2] text-[#991b1b] cursor-default'
                        : 'bg-[#dc2626] hover:bg-[#b91c1c] text-white cursor-pointer shadow-sm'
                    }`}
                  >
                    <span>{isOwned ? (isRw ? 'Warakiguze' : 'Owned') : isRw ? 'Gura' : 'Buy'}</span>
                    {!isOwned && <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />}
                  </button>
                </div>
              );
            }

            return (
              <div
                key={product.id}
                className="bg-white rounded-[28px] border-2 border-[#fecaca] p-4 shadow-[0_8px_22px_rgba(220,38,38,0.09)] space-y-3.5"
              >
                <div className="flex items-start gap-4">
                  {/* Large Clear Product Photo + Vip Badge */}
                  <div className="w-36 sm:w-40 shrink-0 flex flex-col items-center">
                    <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-2xl overflow-hidden bg-[#fef2f2] border-2 border-[#fca5a5] shadow-sm">
                      <img
                        src={productImage}
                        alt={isRw ? product.nameRw : product.nameEn}
                        className="w-full h-full object-cover object-center"
                      />
                    </div>
                    <span className="mt-2.5 px-5 py-1.5 rounded-full bg-[#fee2e2] border border-[#fca5a5] text-[#b91c1c] font-black text-sm tracking-wide">
                      Vip {product.vipLevel}
                    </span>
                  </div>

                  {/* Right Specs */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-black text-[#7f1d1d] tracking-tight leading-tight">
                      Picanon Vip {product.vipLevel}
                    </h3>
                    <p className="text-sm font-extrabold text-[#991b1b] line-clamp-2 mt-0.5">
                      {isRw ? product.nameRw : product.nameEn}
                    </p>

                    <div className="mt-3 space-y-1.5 text-sm sm:text-base tabular-nums">
                      <div className="flex flex-wrap items-baseline gap-1">
                        <span className="font-extrabold text-[#991b1b]">{isRw ? 'Igiciro:' : 'Price:'}</span>
                        <span className="font-black text-[#7f1d1d]">
                          {product.price.toLocaleString()} Frw
                        </span>
                      </div>
                      <div className="flex flex-wrap items-baseline gap-1">
                        <span className="font-extrabold text-[#991b1b]">{isRw ? 'Igihe:' : 'Duration:'}</span>
                        <span className="font-black text-[#7f1d1d]">
                          {product.cycleDays} {isRw ? 'iminsi' : 'days'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-baseline gap-1">
                        <span className="font-extrabold text-[#991b1b]">
                          {isRw ? 'Ku munsi:' : 'Daily:'}
                        </span>
                        <span className="font-black text-[#dc2626]">
                          {product.dailyIncome.toLocaleString()} Frw
                        </span>
                      </div>
                      <div className="flex flex-wrap items-baseline gap-1">
                        <span className="font-extrabold text-[#991b1b]">
                          {isRw ? 'Yose hamwe:' : 'Total:'}
                        </span>
                        <span className="font-black text-[#dc2626]">
                          {product.totalIncome.toLocaleString()} Frw
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Big Red Buy CTA */}
                <div>
                  {isOwned ? (
                    <button
                      type="button"
                      disabled
                      className="w-full py-3 rounded-full bg-[#fee2e2] border border-[#fca5a5] text-[#991b1b] font-black text-base cursor-default"
                    >
                      {isRw ? 'Warakiguze' : 'Owned'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleBuyClick(product)}
                      className="w-full py-3.5 rounded-full bg-[#dc2626] hover:bg-[#b91c1c] active:scale-[0.98] text-white font-black text-base flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                    >
                      <span>{isRw ? 'Gura nonaha' : 'Buy now'}</span>
                      <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Purchase Confirmation Modal */}
      {confirmProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white border-2 border-[#dc2626] rounded-t-3xl sm:rounded-2xl p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between border-b-2 border-[#fecaca] pb-3">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-[#dc2626] block">
                  VIP {confirmProduct.vipLevel}
                </span>
                <h3 className="font-black text-[#7f1d1d] text-xl">
                  {isRw ? 'Emeza kugura igicuruzwa' : 'Confirm VIP Purchase'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setConfirmProduct(null)}
                aria-label="Close"
                className="min-h-[40px] min-w-[40px] rounded-full flex items-center justify-center text-[#991b1b] hover:bg-[#fee2e2] cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-[#fef2f2] border-2 border-[#fecaca]">
              <img
                src={getProductImage(confirmProduct)}
                alt={isRw ? confirmProduct.nameRw : confirmProduct.nameEn}
                className="w-24 h-24 rounded-xl object-cover border-2 border-[#dc2626] shrink-0"
              />
              <div className="min-w-0">
                <h4 className="font-black text-base text-[#7f1d1d] line-clamp-2">
                  {isRw ? confirmProduct.nameRw : confirmProduct.nameEn}
                </h4>
                <span className="text-xl font-black text-[#dc2626] tabular-nums block mt-1">
                  {confirmProduct.price.toLocaleString()} Frw
                </span>
              </div>
            </div>

            <div className="space-y-2.5 text-sm bg-white rounded-2xl border-2 border-[#fecaca] p-4 tabular-nums">
              <div className="flex justify-between">
                <span className="font-bold text-[#991b1b]">{isRw ? 'Inyungu ku munsi:' : 'Daily return:'}</span>
                <span className="font-black text-[#dc2626]">
                  +{confirmProduct.dailyIncome.toLocaleString()} Frw
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-[#991b1b]">{isRw ? 'Igihe cy’amasezerano:' : 'Duration:'}</span>
                <span className="font-black text-[#7f1d1d]">
                  {confirmProduct.cycleDays} {isRw ? 'iminsi' : 'days'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-[#991b1b]">{isRw ? 'Inyungu yose hamwe:' : 'Total income:'}</span>
                <span className="font-black text-[#7f1d1d]">
                  {confirmProduct.totalIncome.toLocaleString()} Frw
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t-2 border-[#fecaca]">
                <span className="font-bold text-[#991b1b]">
                  {isRw ? 'Asigara kuri konti nyuma yo kugura:' : 'Balance after purchase:'}
                </span>
                <span className="font-black text-[#7f1d1d]">
                  {(user.balance - confirmProduct.price).toLocaleString()} Frw
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setConfirmProduct(null)}
                disabled={isPurchasing}
                className="py-3.5 rounded-full bg-[#fee2e2] hover:bg-[#fecaca] text-[#991b1b] font-black text-sm uppercase tracking-wider cursor-pointer"
              >
                {isRw ? 'Hagarika' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmPurchase}
                disabled={isPurchasing}
                className="py-3.5 rounded-full bg-[#dc2626] hover:bg-[#b91c1c] text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>
                  {isPurchasing
                    ? isRw
                      ? 'Birakorwa...'
                      : 'Processing...'
                    : isRw
                      ? 'Emeza Ugure'
                      : 'Confirm Buy'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
