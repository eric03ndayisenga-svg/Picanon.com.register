import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  MapPin,
  Clock,
  Send,
  Headphones,
} from 'lucide-react';
import { Language, AdminSettings } from '../types';
import { picanonBrandEmblem, picanonHeroBanner } from '../assets/images';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminSettings: AdminSettings;
  language: Language;
}

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
  adminSettings,
  language,
}) => {
  const isRw = language === 'rw';
  const [activeSection, setActiveSection] = useState<'company' | 'products' | 'license' | 'contact'>('company');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in font-sans">
      <div className="w-full max-w-md bg-white border-2 border-[#dc2626] rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom">
        {/* Header */}
        <div className="p-4 border-b-2 border-[#fecaca] flex items-center justify-between bg-[#dc2626] text-white">
          <div className="flex items-center gap-3">
            <img
              src={picanonBrandEmblem}
              alt="Picanon Emblem"
              className="w-12 h-12 rounded-full object-cover border-2 border-white"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-xl text-white tracking-tight">
                  Picanon
                </h3>
                <span className="text-xs font-black text-[#dc2626] bg-white px-2 py-0.5 rounded-full">
                  Official
                </span>
              </div>
              <p className="text-xs font-bold text-white/95">
                {isRw
                  ? "Imyambaro n'Inkweto · Global Fashion House (USA HQ)"
                  : 'Luxury Apparel & Footwear · Global Fashion House (USA HQ)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white hover:bg-white/20 cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="grid grid-cols-4 p-1.5 bg-[#fee2e2] border-b-2 border-[#fecaca] text-xs font-black gap-1">
          <button
            onClick={() => setActiveSection('company')}
            className={`py-2.5 px-1 rounded-lg text-center transition-all cursor-pointer ${
              activeSection === 'company'
                ? 'bg-[#dc2626] text-white shadow-xs'
                : 'text-[#991b1b] hover:bg-white/60'
            }`}
          >
            {isRw ? 'Sosiyete' : 'Overview'}
          </button>
          <button
            onClick={() => setActiveSection('products')}
            className={`py-2.5 px-1 rounded-lg text-center transition-all cursor-pointer ${
              activeSection === 'products'
                ? 'bg-[#dc2626] text-white shadow-xs'
                : 'text-[#991b1b] hover:bg-white/60'
            }`}
          >
            {isRw ? 'Imyambaro' : 'Catalog'}
          </button>
          <button
            onClick={() => setActiveSection('license')}
            className={`py-2.5 px-1 rounded-lg text-center transition-all cursor-pointer ${
              activeSection === 'license'
                ? 'bg-[#dc2626] text-white shadow-xs'
                : 'text-[#991b1b] hover:bg-white/60'
            }`}
          >
            {isRw ? 'Ibyemezo' : 'License'}
          </button>
          <button
            onClick={() => setActiveSection('contact')}
            className={`py-2.5 px-1 rounded-lg text-center transition-all cursor-pointer ${
              activeSection === 'contact'
                ? 'bg-[#dc2626] text-white shadow-xs'
                : 'text-[#991b1b] hover:bg-white/60'
            }`}
          >
            {isRw ? 'Twandikire' : 'Contact'}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-sm font-bold text-[#7f1d1d] leading-relaxed flex-1">
          {activeSection === 'company' && (
            <div className="space-y-4">
              <div className="rounded-2xl overflow-hidden aspect-[16/9] border-2 border-[#dc2626] bg-[#991b1b]">
                <img
                  src={picanonHeroBanner}
                  alt="Picanon Flagship Boutique"
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <h4 className="font-black text-base text-[#b91c1c] mb-1">
                  {isRw ? "Ibyerekeye Picanon (Imyambaro & Inkweto)" : 'About Picanon Apparel & Footwear'}
                </h4>
                <p className="text-[#7f1d1d]">
                  {isRw
                    ? "Picanon ni sosiyete mpuzamahanga ikora ibijyanye n'imyambaro n'inkweto byo ku rwego rwo hejuru ifite icyicaro muri Leta Zunze Ubumwe z'Amerika (USA). Itunganya inkweto z'uruhu rwa kijyambere, imyambaro ya streetwear, amakoti n'amapantaro bidoze mu buhanga buhanitse, n'inkweto za siporo zigurishwa ku isi yose."
                    : 'Picanon is an international clothing and footwear enterprise headquartered in the United States (USA). Designing crafted leather sneakers, Chelsea boots, contemporary streetwear, and bespoke tailored garments distributed across global flagship boutiques.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div className="p-3.5 rounded-xl bg-[#fef2f2] border-2 border-[#fecaca]">
                  <span className="text-xs uppercase font-black text-[#991b1b] block">Specialty</span>
                  <span className="font-black text-base text-[#7f1d1d]">
                    {isRw ? "Imyambaro & Inkweto" : 'Apparel & Shoes'}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#fef2f2] border-2 border-[#fecaca]">
                  <span className="text-xs uppercase font-black text-[#991b1b] block">Global HQ</span>
                  <span className="font-black text-base text-[#7f1d1d]">New York, USA</span>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'products' && (
            <div className="space-y-3">
              <h4 className="font-black text-base text-[#b91c1c]">
                {isRw ? "Ibyiciro by'Imyambaro n'Inkweto" : 'Core Fashion & Footwear Lines'}
              </h4>
              <div className="space-y-2.5">
                <div className="p-3.5 rounded-xl border-2 border-[#fecaca] bg-[#fef2f2]">
                  <h5 className="font-black text-[#7f1d1d]">1. Luxury Leather Sneakers & Runners</h5>
                  <p className="text-xs font-bold text-[#991b1b] mt-0.5">
                    {isRw
                      ? "Inkweto z'uruhu rw'umwimerere n'iza siporo zifite umukorere uramba kandi uteye neza."
                      : 'Hand-stitched full-grain leather sneakers and technical knit athletic footwear.'}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border-2 border-[#fecaca] bg-[#fef2f2]">
                  <h5 className="font-black text-[#7f1d1d]">2. Heritage Chelsea & Dress Boots</h5>
                  <p className="text-xs font-bold text-[#991b1b] mt-0.5">
                    {isRw
                      ? "Inkweto ndende z'uruhu rwa calfskin zikoreshwa ku kazi no mu birori."
                      : 'Goodyear-welted calfskin Chelsea boots engineered for all-day comfort.'}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border-2 border-[#fecaca] bg-[#fef2f2]">
                  <h5 className="font-black text-[#7f1d1d]">3. Urban Streetwear & Heavyweight Cotton</h5>
                  <p className="text-xs font-bold text-[#991b1b] mt-0.5">
                    {isRw
                      ? 'Hoodies, amajacket ya denim, n’amapantaro ya kijyambere akozwe mu pamba y’umwimerere.'
                      : 'Heavyweight organic cotton hoodies, selvedge denim overshirts, and tailored cargos.'}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border-2 border-[#fecaca] bg-[#fef2f2]">
                  <h5 className="font-black text-[#7f1d1d]">4. Bespoke Suits & Atelier Outerwear</h5>
                  <p className="text-xs font-bold text-[#991b1b] mt-0.5">
                    {isRw
                      ? "Amakoti n'amapantaro by'umwuga bidoze mu bwoya bwiza bwo ku rwego rw'isi."
                      : 'Tailored wool blazers, coats, and runway atelier garments crafted to exact fit.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'license' && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl border-2 border-[#dc2626] bg-[#fef2f2] text-[#7f1d1d] space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-[#dc2626] shrink-0" />
                  <span className="font-black text-base">Official Commercial Certification</span>
                </div>
                <p className="text-sm font-bold text-[#991b1b]">
                  Picanon operates internationally from the United States (USA) in full compliance with global apparel & footwear trade standards, secure payment processing, and ethical craftsmanship guidelines.
                </p>
              </div>

              <div className="p-4 rounded-xl border-2 border-[#fecaca] space-y-2 bg-white">
                <div className="flex justify-between">
                  <span className="text-[#991b1b]">Registry Code:</span>
                  <span className="font-mono font-black text-[#7f1d1d]">US-PICANON-2026-HQ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#991b1b]">Consumer Protection:</span>
                  <span className="font-black text-[#dc2626]">Guaranteed 100%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#991b1b]">Payout Network:</span>
                  <span className="font-black text-[#7f1d1d]">MTN & Airtel MoMo (24/7)</span>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'contact' && (
            <div className="space-y-3">
              <h4 className="font-black text-base text-[#b91c1c]">
                {isRw ? "Ubufasha n'Aderesi" : 'Customer Support & Location'}
              </h4>

              <div className="space-y-2.5">
                <div className="p-3.5 rounded-xl border-2 border-[#fecaca] flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-[#dc2626] shrink-0" />
                  <div>
                    <span className="font-black text-sm text-[#7f1d1d] block">Fashion Flagship HQ</span>
                    <span className="text-xs font-bold text-[#991b1b]">SoHo Fashion District, New York, USA</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border-2 border-[#fecaca] flex items-center gap-3">
                  <Clock className="w-5 h-5 text-[#dc2626] shrink-0" />
                  <div>
                    <span className="font-black text-sm text-[#7f1d1d] block">Operating Hours</span>
                    <span className="text-xs font-bold text-[#991b1b]">Open 24/7 · Automated Payments</span>
                  </div>
                </div>

                <a
                  href={adminSettings.telegramSupport || 'https://t.me/Picanon_support'}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3.5 rounded-xl bg-[#dc2626] text-white flex items-center justify-between font-black hover:bg-[#b91c1c] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Send className="w-5 h-5 text-white" />
                    <span>Official Telegram Support</span>
                  </div>
                  <span className="text-xs text-white/90">@Picanon_support</span>
                </a>

                <a
                  href={adminSettings.telegramGroup || 'https://t.me/picanonrw1'}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3.5 rounded-xl border-2 border-[#dc2626] flex items-center justify-between font-black text-[#b91c1c] hover:bg-[#fef2f2] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Headphones className="w-5 h-5 text-[#dc2626]" />
                    <span>Picanon Group</span>
                  </div>
                  <span className="text-xs text-[#dc2626]">@picanonrw1</span>
                </a>

                <a
                  href={adminSettings.telegramChannel || 'https://t.me/Picanon_channel'}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3.5 rounded-xl border-2 border-[#dc2626] flex items-center justify-between font-black text-[#b91c1c] hover:bg-[#fef2f2] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Send className="w-5 h-5 text-[#dc2626]" />
                    <span>Picanon Channel</span>
                  </div>
                  <span className="text-xs text-[#dc2626]">@Picanon_channel</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
