import React, { useState, useEffect } from 'react';
import { ChevronRight, Users } from 'lucide-react';
import { UserAccount, TeamMemberSummary, Language } from '../types';
import {
  picanonTeamBanner,
  picanonHeroBanner,
  picanonVip7Atelier,
  picanonVip8Showroom,
  picanonBrandEmblem,
  picanonTailoredSuit,
  picanonVip5Tracksuit,
  picanonLeatherBoots,
  picanonVip6Capsule,
  picanonAthleticRunners,
  picanonVip9Couture,
  picanonStreetwearCollection,
  picanonVip10Empire,
} from '../assets/images';
import { buildInviteUrl } from '../utils/inviteLink';

interface TeamViewProps {
  user: UserAccount;
  teamMembers?: TeamMemberSummary[];
  language: Language;
}

const TEAM_HERO_SLIDES = [
  {
    image: picanonHeroBanner,
    labelRw: 'Picanon Luxury Fashion',
    labelEn: 'Picanon Partner Network',
  },
  {
    image: picanonTeamBanner,
    labelRw: 'Itsinda rya Picanon VIP',
    labelEn: 'Picanon VIP Team',
  },
  {
    image: picanonVip7Atelier,
    labelRw: 'Atelier & Imyambaro ya Luxury',
    labelEn: 'Runway Atelier & Partners',
  },
  {
    image: picanonVip8Showroom,
    labelRw: 'Amaduka Mpuzamahanga ya Picanon',
    labelEn: 'Global Flagship Showrooms',
  },
  {
    image: picanonTailoredSuit,
    labelRw: 'Imyambaro & Inkweto Byemejwe',
    labelEn: 'Certified Tailoring & Footwear',
  },
];

const TEAM_GALLERY_ITEMS = [
  { image: picanonTeamBanner, titleRw: 'LV1 (38%)', titleEn: 'LV1 (38%)' },
  { image: picanonVip5Tracksuit, titleRw: 'Siporo & Luxe', titleEn: 'Athletic Luxe' },
  { image: picanonLeatherBoots, titleRw: 'Chelsea Boots', titleEn: 'Leather Boots' },
  { image: picanonVip6Capsule, titleRw: 'Flagship Capsule', titleEn: 'Boutique Capsule' },
  { image: picanonAthleticRunners, titleRw: 'Inkweto za Pro', titleEn: 'Pro Runners' },
  { image: picanonVip9Couture, titleRw: 'Paris & Milan', titleEn: 'Milan Couture' },
  { image: picanonStreetwearCollection, titleRw: 'Urban Style', titleEn: 'Streetwear Set' },
  { image: picanonVip10Empire, titleRw: 'Diamond Empire', titleEn: 'Diamond Crown' },
];

export const TeamView: React.FC<TeamViewProps> = ({
  user,
  teamMembers = [],
  language,
}) => {
  const isRw = language === 'rw';
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [heroIndex, setHeroIndex] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % TEAM_HERO_SLIDES.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const inviteCode = (user.referralCode || 'PICANON').trim().toUpperCase();
  const inviteUrl = buildInviteUrl(inviteCode);

  const copyTextSafe = async (text: string) => {
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
  };

  const handleCopyCode = () => {
    void copyTextSafe(inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    void copyTextSafe(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const totalValidUsers =
    user.teamCountLevel1 + user.teamCountLevel2 + user.teamCountLevel3;
  const level1Commission = user.teamCommissionLevel1 ?? user.teamCommission ?? 0;
  const level2Commission = user.teamCommissionLevel2 ?? 0;
  const level3Commission = user.teamCommissionLevel3 ?? 0;
  const totalIncome = user.teamCommission || level1Commission + level2Commission + level3Commission;

  return (
    <div className="min-h-screen bg-white pb-28 max-w-md mx-auto animate-in fade-in duration-150">
      {/* 1. Top Red Header Bar: Team | My team > */}
      <header className="sticky top-0 z-30 bg-[#dc2626] text-white px-4 py-3.5 flex items-center justify-between shadow-sm">
        <h1 className="font-display font-black text-2xl tracking-tight text-white">
          {isRw ? 'Itsinda' : 'Team'}
        </h1>
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="inline-flex items-center gap-1 text-base font-extrabold text-white hover:opacity-90 active:scale-95 transition-all cursor-pointer"
        >
          <span>{isRw ? 'Itsinda ryanjye' : 'My team'}</span>
          <ChevronRight className={`w-5 h-5 stroke-[2.5] transition-transform ${showDetails ? 'rotate-90' : ''}`} />
        </button>
      </header>

      <div className="px-4 pt-4 space-y-5">
        {/* 2. Large Clean Rounded Hero Banner */}
        <div className="relative rounded-2xl overflow-hidden shadow-md border-2 border-[#dc2626] aspect-[16/9] bg-[#991b1b]">
          {TEAM_HERO_SLIDES.map((slide, idx) => (
            <img
              key={slide.labelEn}
              src={slide.image}
              alt={isRw ? slide.labelRw : slide.labelEn}
              referrerPolicy="no-referrer"
              className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 ${
                idx === heroIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            />
          ))}
        </div>

        {/* 3. Two-Column Invite Section (Square Emblem Card + Bold Red Heading & Copy Pills) */}
        <div className="flex items-center gap-3.5">
          {/* Left Square Picanon Card */}
          <div className="w-[38%] shrink-0">
            <div className="aspect-square rounded-2xl overflow-hidden border-2 border-[#dc2626] bg-[#dc2626] shadow-md flex flex-col items-center justify-center relative">
              <img
                src={picanonBrandEmblem}
                alt="Picanon"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#991b1b] via-[#dc2626]/80 to-transparent px-2 py-1.5 text-center">
                <span className="font-display font-black text-xs tracking-wider text-white uppercase">
                  PICANON
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Headline, Subtext, Code Pill + Copy, Link Pill + Copy */}
          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <h2 className="font-display font-black text-xl sm:text-2xl text-[#dc2626] leading-tight tracking-tight">
                {isRw ? 'Tumira inshuti zawe...' : 'Start inviting friends...'}
              </h2>
              <p className="text-xs sm:text-sm font-bold text-[#7f1d1d] mt-0.5">
                {isRw ? 'Sangiza kode cyangwa link' : 'Share invitation code or link'}
              </p>
            </div>

            {/* Invitation Code Pill + Solid Red Copy Button */}
            <div className="space-y-1.5">
              <div className="w-full rounded-full border-2 border-[#dc2626] bg-white px-3 py-1.5 text-center">
                <span className="font-display font-black text-sm text-[#7f1d1d] tracking-wider">
                  {inviteCode}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="w-full py-2 rounded-full bg-[#dc2626] hover:bg-[#b91c1c] text-white font-display font-black text-sm tracking-wide shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                {copiedCode ? (isRw ? 'Byakopewe!' : 'Copied!') : isRw ? 'Koporora' : 'Copy'}
              </button>
            </div>

            {/* Invitation Link Pill + Solid Red Copy Button */}
            <div className="space-y-1.5">
              <div className="w-full rounded-full border-2 border-[#dc2626] bg-white px-3 py-1.5 text-center">
                <span className="font-bold text-xs text-[#7f1d1d] block truncate">
                  {inviteUrl}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full py-2 rounded-full bg-[#dc2626] hover:bg-[#b91c1c] text-white font-display font-black text-sm tracking-wide shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                {copiedLink ? (isRw ? 'Byakopewe!' : 'Copied!') : isRw ? 'Koporora' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        {/* 4. Solid Red 2-Column Summary Banner (Total users > | Total Rewards >) */}
        <div className="rounded-xl bg-[#dc2626] text-white py-5 px-4 grid grid-cols-2 gap-3 shadow-md tabular-nums">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="text-center cursor-pointer hover:opacity-95 active:scale-98 transition-transform"
          >
            <span className="font-display font-black text-3xl sm:text-4xl block leading-none">
              {totalValidUsers}
            </span>
            <span className="inline-flex items-center justify-center gap-0.5 text-xs sm:text-sm font-extrabold text-white/95 mt-2">
              <span>{isRw ? 'Abanyamuryango' : 'Total users'}</span>
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="text-center cursor-pointer hover:opacity-95 active:scale-98 transition-transform"
          >
            <span className="font-display font-black text-2xl sm:text-3xl block leading-none truncate">
              RWF {totalIncome.toLocaleString()}
            </span>
            <span className="inline-flex items-center justify-center gap-0.5 text-xs sm:text-sm font-extrabold text-white/95 mt-2">
              <span>{isRw ? 'Ibihembo byose' : 'Total Rewards'}</span>
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </span>
          </button>
        </div>

        {/* 5. Expandable Team Members Details Panel (when tapping My team > or Total users >) */}
        {showDetails && (
          <div className="bg-white rounded-2xl border-2 border-[#dc2626] shadow-md p-4 space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b-2 border-[#fee2e2] pb-2.5">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#dc2626]" />
                <h3 className="font-display font-black text-base text-[#dc2626]">
                  {isRw ? "Urutonde rw'abo watumiye" : 'My Team Members'}
                </h3>
              </div>
              <span className="text-sm font-black text-[#7f1d1d] tabular-nums">
                {teamMembers.length} {isRw ? 'abantu' : 'users'}
              </span>
            </div>

            {teamMembers.length === 0 ? (
              <p className="text-sm font-bold text-[#991b1b] py-3 text-center leading-relaxed">
                {isRw
                  ? 'Nta muntu wari wiyandikisha kuri link yawe. Sangiza kode yawe hejuru wakire 38% ako kanya!'
                  : 'No invited members yet. Share your code above to earn 38% instantly!'}
              </p>
            ) : (
              <div className="divide-y divide-[#fee2e2] max-h-64 overflow-y-auto">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="py-3 flex items-center justify-between gap-2 text-sm"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`px-2.5 py-1 rounded-lg font-display font-black text-xs shrink-0 ${
                          member.level === 1
                            ? 'bg-[#dc2626] text-white'
                            : 'bg-[#fee2e2] text-[#dc2626] border border-[#fecaca]'
                        }`}
                      >
                        LV{member.level}
                      </span>
                      <div className="min-w-0">
                        <span className="font-mono font-black text-[#7f1d1d] block truncate">
                          {member.maskedPhone}
                        </span>
                        <span className="text-xs font-bold text-[#991b1b]">
                          VIP {member.vipLevel} · {member.createdAt}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 tabular-nums">
                      <span className="font-display font-black text-[#7f1d1d] block">
                        RWF {member.totalInvested.toLocaleString()}
                      </span>
                      <span className="text-xs text-[#dc2626] font-extrabold">
                        {isRw ? 'Yashoye' : 'Invested'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 6. Bold Centered Red Headline: INVITE FRIENDS TO JOIN THE TEAM */}
        <h2 className="font-display font-black text-lg sm:text-xl text-[#dc2626] text-center uppercase tracking-tight pt-1">
          {isRw ? "TUMIRA INSHUTI ZIFATANYE N'ITSINDA" : 'INVITE FRIENDS TO JOIN THE TEAM'}
        </h2>

        {/* 7. LV1 / LV2 / LV3 Rows Matching Screenshot */}
        <div className="bg-white divide-y-2 divide-[#fee2e2] border-t-2 border-b-2 border-[#fee2e2]">
          {[
            {
              lvl: 'LV1',
              rate: '38%',
              users: user.teamCountLevel1,
              rewards: level1Commission,
            },
            {
              lvl: 'LV2',
              rate: '2%',
              users: user.teamCountLevel2,
              rewards: level2Commission,
            },
            {
              lvl: 'LV3',
              rate: '1%',
              users: user.teamCountLevel3,
              rewards: level3Commission,
            },
          ].map((row) => (
            <div key={row.lvl} className="flex items-center justify-between py-4 gap-2 tabular-nums">
              {/* Solid Red LV Square Badge */}
              <div className="w-16 h-13 rounded-lg bg-[#dc2626] text-white font-display font-black text-xl flex items-center justify-center shrink-0 shadow-xs">
                {row.lvl}
              </div>

              {/* Commission */}
              <div className="flex-1 text-center">
                <span className="font-display font-black text-xl text-[#7f1d1d] block leading-tight">
                  {row.rate}
                </span>
                <span className="text-xs font-bold text-[#991b1b] block mt-0.5">
                  {isRw ? 'Komisiyo' : 'Commission'}
                </span>
              </div>

              {/* Users */}
              <div className="flex-1 text-center">
                <span className="font-display font-black text-xl text-[#7f1d1d] block leading-tight">
                  {row.users}
                </span>
                <span className="text-xs font-bold text-[#991b1b] block mt-0.5">
                  {isRw ? 'Abantu' : 'Users'}
                </span>
              </div>

              {/* Rewards */}
              <div className="flex-1 text-center">
                <span className="font-display font-black text-xl text-[#7f1d1d] block leading-tight">
                  {row.rewards.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-[#991b1b] block mt-0.5">
                  {isRw ? 'Ibihembo' : 'Rewards'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* 8. Continuous Repeating Picanon Photo Showcase Strip */}
        <div className="rounded-2xl bg-white border-2 border-[#fecaca] py-3.5 px-2.5 overflow-hidden shadow-xs">
          <div className="flex items-center justify-between px-2 pb-2.5">
            <span className="font-display text-sm font-black uppercase tracking-tight text-[#dc2626]">
              {isRw ? 'Imyambaro & Inkweto za Team' : 'Picanon Team Collection'}
            </span>
            <span className="font-display text-sm font-black text-[#dc2626]">
              38% + 2% + 1%
            </span>
          </div>
          <div className="overflow-hidden">
            <div className="animate-picanon-gallery items-center gap-3.5">
              {[...TEAM_GALLERY_ITEMS, ...TEAM_GALLERY_ITEMS].map((item, idx) => (
                <div
                  key={`${item.titleEn}-${idx}`}
                  className="w-40 shrink-0 rounded-xl overflow-hidden bg-white border-2 border-[#fecaca] relative group shadow-xs"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden">
                    <img
                      src={item.image}
                      alt={isRw ? item.titleRw : item.titleEn}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="px-3 py-1.5 bg-[#dc2626]">
                    <span className="font-display text-xs font-black text-white block truncate">
                      {isRw ? item.titleRw : item.titleEn}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 9. Explanatory Rules Text Card */}
        <div className="p-4 rounded-2xl bg-[#fef2f2] border-2 border-[#fecaca] text-sm font-bold text-[#7f1d1d] space-y-2.5 leading-relaxed">
          <p>
            {isRw
              ? "1. Iyo inshuti watumiye yiyandikishije igashora imari muri VIP, uhita wakira 38% by'amafaranga ashyizemo ako kanya."
              : '1. When friends you invite sign up and invest, you instantly receive 38% cashback.'}
          </p>
          <p>
            {isRw
              ? "2. Wakira 2% ku rwego rwa 2 (LV2) na 1% ku rwego rwa 3 (LV3) igihe abagize itsinda ryawe bashoye."
              : '2. You receive 2% cashback on Level 2 (LV2) and 1% on Level 3 (LV3) when your team invests.'}
          </p>
          <p>
            {isRw
              ? "3. Ibihembo by'amafaranga byoherezwa muri konti yawe ako kanya nyuma y'uko abagize itsinda ryawe bashoye imari."
              : '3. Cash rewards are deposited into your account right after your team members invest.'}
          </p>
        </div>
      </div>
    </div>
  );
};
