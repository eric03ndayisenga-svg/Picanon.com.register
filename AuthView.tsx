import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  Link as LinkIcon,
  Loader2,
  Eye,
  EyeOff,
  UserCheck,
  Trash2,
  LogIn,
} from 'lucide-react';
import {
  Language,
  UserAccount,
  AdminSettings,
  InvestmentRecord,
  Transaction,
  RechargeRequest,
  WithdrawRequest,
  TeamMemberSummary,
} from '../types';
import { picanonBrandEmblem, picanonHeroBanner } from '../assets/images';
import { ADMIN_USER } from '../data/mockData';
import {
  SavedAccountRecord,
  getSavedAccounts,
  saveAccountCredential,
  removeSavedAccount,
  purgeSavedAccountsOlderThan,
  normalizeRwandaPhone,
  formatDisplayPhone,
} from '../utils/savedAccounts';

interface AuthViewProps {
  onLoginSuccess: (
    user: UserAccount,
    meta?: {
      userToken?: string;
      adminToken?: string;
      investments?: InvestmentRecord[];
      transactions?: Transaction[];
      recharges?: RechargeRequest[];
      withdrawals?: WithdrawRequest[];
      teamMembers?: TeamMemberSummary[];
    }
  ) => void;
  onRegisterSuccess: (
    user: UserAccount,
    meta?: {
      userToken?: string;
      investments?: InvestmentRecord[];
      transactions?: Transaction[];
      teamMembers?: TeamMemberSummary[];
    }
  ) => void;
  language: Language;
  onToggleLanguage: () => void;
  onOpenAbout: () => void;
  adminSettings: AdminSettings;
  allUsers?: UserAccount[];
  initialInviteCode?: string;
  hasExplicitInvite?: boolean;
  initialPhone?: string;
}

export const AuthView: React.FC<AuthViewProps> = ({
  onLoginSuccess,
  onRegisterSuccess,
  language,
  allUsers = [],
  initialInviteCode = 'PICANON',
  hasExplicitInvite = false,
  initialPhone = '',
}) => {
  const isRw = language === 'rw';
  const [savedAccounts, setSavedAccounts] = useState<SavedAccountRecord[]>(() =>
    getSavedAccounts()
  );
  const [isRegister, setIsRegister] = useState<boolean>(hasExplicitInvite);

  const [phone, setPhone] = useState<string>(() => {
    if (initialPhone) return initialPhone;
    if (hasExplicitInvite) return '';
    const list = getSavedAccounts();
    return list[0]?.phone || '';
  });

  const [password, setPassword] = useState<string>(() => {
    if (initialPhone || hasExplicitInvite) return '';
    const list = getSavedAccounts();
    return list[0]?.password || '';
  });

  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [inviteCode, setInviteCode] = useState<string>(initialInviteCode);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [quickLoginPhone, setQuickLoginPhone] = useState<string | null>(null);

  useEffect(() => {
    setSavedAccounts(getSavedAccounts());
  }, []);

  const switchMode = (toRegister: boolean) => {
    setIsRegister(toRegister);
    setError(null);
    if (toRegister) {
      setPhone('');
      setPassword('');
      setConfirmPassword('');
    } else {
      const list = getSavedAccounts();
      setSavedAccounts(list);
      if (list.length > 0 && !phone.trim()) {
        setPhone(list[0].phone);
        setPassword(list[0].password);
      }
    }
  };

  const performLogin = async (rawPhone: string, rawPassword: string, remember: boolean) => {
    setError(null);
    const cleanPhone = normalizeRwandaPhone(rawPhone);

    if (!cleanPhone || cleanPhone.length < 9) {
      setError(
        isRw
          ? 'Shyiramo numero ya telefone nyayo (urugero: 078XXXXXXX)'
          : 'Please enter a valid phone number (e.g. 078XXXXXXX)'
      );
      return;
    }

    const cleanPassword = rawPassword.trim();
    if (!cleanPassword || cleanPassword.length < 4) {
      setError(
        isRw
          ? 'Ijambobanga rigomba kugira byibuze inyuguti cyangwa imibare 4'
          : 'Please enter your password (minimum 4 characters)'
      );
      return;
    }

    const isAdminAccount = cleanPhone === '0793002388';
    if (isAdminAccount && cleanPassword !== 'eric123') {
      setError(
        isRw
          ? 'Ijambobanga rya Admin ntabwo ari ryo! Shyiramo: eric123'
          : 'Invalid Admin password! Please enter: eric123'
      );
      return;
    }

    const savedMatch = savedAccounts.find(
      (a) => a.phone === cleanPhone && a.password === cleanPassword
    );

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          password: cleanPassword,
          inviteCode: inviteCode.trim(),
          savedAt: savedMatch?.savedAt,
          savedSnapshot: savedMatch?.userSnapshot,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (!isAdminAccount) {
          if (remember) {
            setSavedAccounts(
              saveAccountCredential({
                phone: cleanPhone,
                password: cleanPassword,
                userSnapshot: data.user,
              })
            );
          } else {
            setSavedAccounts(removeSavedAccount(cleanPhone));
          }
        }
        onLoginSuccess(data.user, {
          userToken: data.userToken,
          adminToken: data.adminToken,
          investments: data.investments,
          transactions: data.transactions,
          recharges: data.recharges,
          withdrawals: data.withdrawals,
          teamMembers: data.teamMembers,
        });
        return;
      }

      if (res.status === 401) {
        setError(
          isRw
            ? 'Ijambobanga ryanditswe ntabwo ari ryo. Reba neza.'
            : 'Incorrect password for this account. Please try again.'
        );
        return;
      }

      if (res.status === 403) {
        setError(
          isRw
            ? 'Iyi konti yahagaritswe by’agateganyo n’ubuyobozi.'
            : 'This account has been suspended by administration.'
        );
        return;
      }

      if (res.status === 404) {
        const errPayload = await res.json().catch(() => ({}));
        const resetAt = Number(errPayload?.resetAt || 0);
        if (resetAt > 0) {
          purgeSavedAccountsOlderThan(resetAt);
          setSavedAccounts(getSavedAccounts());
        }
        setError(
          isRw
            ? "Iyi numero ntabwo iriyandikisha. Kanda hejuru kuri 'Iyandikishe' ukore konti."
            : "Account not found. Tap 'Register' above to create an account."
        );
        return;
      }

      const fallbackErr = await res.json().catch(() => ({}));
      throw new Error(fallbackErr.error || 'Server login fallback');
    } catch {
      // Offline / static fallback
      if (isAdminAccount) {
        onLoginSuccess({
          ...ADMIN_USER,
          phone: '0793002388',
          password: 'eric123',
          isAdmin: true,
        });
        return;
      }

      const matchedLocal =
        allUsers.find((u) => u.phone === cleanPhone) ||
        (savedMatch?.userSnapshot ? { ...savedMatch.userSnapshot, password: savedMatch.password } : undefined);

      if (matchedLocal) {
        if (matchedLocal.password && matchedLocal.password !== cleanPassword) {
          setError(
            isRw
              ? 'Ijambobanga ryanditswe ntabwo ari ryo. Reba neza.'
              : 'Incorrect password for this account. Please try again.'
          );
          return;
        }
        if (remember) {
          setSavedAccounts(
            saveAccountCredential({
              phone: cleanPhone,
              password: cleanPassword,
              userSnapshot: matchedLocal,
            })
          );
        } else {
          setSavedAccounts(removeSavedAccount(cleanPhone));
        }
        onLoginSuccess(matchedLocal);
        return;
      }

      setError(
        isRw
          ? "Iyi numero ntabwo iriyandikisha. Kanda hejuru kuri 'Iyandikishe' ukore konti."
          : "Account not found. Tap 'Register' above to create an account."
      );
    } finally {
      setIsSubmitting(false);
      setQuickLoginPhone(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isRegister) {
      await performLogin(phone, password, rememberMe);
      return;
    }

    // REGISTER FLOW
    const cleanPhone = normalizeRwandaPhone(phone);
    if (!cleanPhone || cleanPhone.length < 9) {
      setError(
        isRw
          ? 'Shyiramo numero ya telefone nyayo (urugero: 078XXXXXXX)'
          : 'Please enter a valid phone number (e.g. 078XXXXXXX)'
      );
      return;
    }

    const cleanPassword = password.trim();
    if (!cleanPassword || cleanPassword.length < 4) {
      setError(
        isRw
          ? 'Ijambobanga rigomba kugira byibuze inyuguti cyangwa imibare 4'
          : 'Please enter your password (minimum 4 characters)'
      );
      return;
    }

    const isAdminAccount = cleanPhone === '0793002388';
    if (isAdminAccount) {
      setError(
        isRw
          ? 'Iyi numero ya Admin isanzwe ikora. Kanda kuri Injira.'
          : 'This Admin account already exists. Please use Log in.'
      );
      return;
    }

    if (cleanPassword !== confirmPassword.trim()) {
      setError(
        isRw
          ? "Amagambo y'ibanga yombi ntabwo ahuje. Subiramo neza."
          : 'Passwords do not match. Please confirm carefully.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          password: cleanPassword,
          inviteCode: inviteCode.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Automatically save registered account for easy 1-tap login later
        setSavedAccounts(
          saveAccountCredential({
            phone: cleanPhone,
            password: cleanPassword,
            userSnapshot: data.user,
          })
        );
        onRegisterSuccess(data.user, {
          userToken: data.userToken,
          investments: data.investments || [],
          transactions: data.transactions || [],
        });
        return;
      }

      if (res.status === 409) {
        setError(
          isRw
            ? 'Iyi numero ifite konti isanzwe irimo. Kanda kuri Injira hejuru.'
            : 'An account with this phone already exists. Please log in above.'
        );
        return;
      }

      const errData = await res.json().catch(() => ({}));
      setError(errData.error || (isRw ? 'Ntibyakunze kwiyandikisha.' : 'Registration failed.'));
      return;
    } catch {
      const existing = allUsers.find((u) => u.phone === cleanPhone);
      if (existing) {
        setError(
          isRw
            ? 'Iyi numero ifite konti isanzwe irimo. Kanda kuri Injira hejuru.'
            : 'An account with this phone already exists. Please log in above.'
        );
        return;
      }

      const cleanInv = inviteCode.trim().toUpperCase();
      const validRef =
        cleanInv && cleanInv !== 'PICANON' && cleanInv !== '8019JCP2' ? cleanInv : undefined;
      const newUser: UserAccount = {
        id: `user-${cleanPhone}`,
        phone: cleanPhone,
        password: cleanPassword,
        balance: 1500,
        totalIncome: 1500,
        totalWithdrawn: 0,
        totalRecharged: 0,
        vipLevel: 0,
        referralCode: `PIC${cleanPhone.slice(-6)}`,
        referredBy: validRef,
        teamCountLevel1: 0,
        teamCountLevel2: 0,
        teamCountLevel3: 0,
        teamCommission: 0,
        teamCommissionLevel1: 0,
        teamCommissionLevel2: 0,
        teamCommissionLevel3: 0,
        freeSpins: 2,
        hasClaimedWelcomeBonus: true,
        isAdmin: false,
        createdAt: new Date().toISOString().split('T')[0],
        redeemedCodes: [],
      };
      setSavedAccounts(
        saveAccountCredential({
          phone: cleanPhone,
          password: cleanPassword,
          userSnapshot: newUser,
        })
      );
      onRegisterSuccess(newUser, {
        transactions: [
          {
            id: `tx-welcome-${Date.now()}`,
            userId: newUser.id,
            type: 'welcome_bonus',
            amount: 1500,
            status: 'completed',
            timestamp: new Date().toLocaleString('en-GB'),
            description: 'Impano yo Kwinjira (Welcome Bonus - 1,500 RWF)',
          },
        ],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (acc: SavedAccountRecord) => {
    if (isSubmitting) return;
    setPhone(acc.phone);
    setPassword(acc.password);
    setRememberMe(true);
    setQuickLoginPhone(acc.phone);
    await performLogin(acc.phone, acc.password, true);
  };

  const handleForgetAccount = (e: React.MouseEvent, targetPhone: string) => {
    e.stopPropagation();
    const updated = removeSavedAccount(targetPhone);
    setSavedAccounts(updated);
    if (normalizeRwandaPhone(phone) === targetPhone) {
      setPhone(updated[0]?.phone || '');
      setPassword(updated[0]?.password || '');
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#7f1d1d] flex flex-col justify-center relative overflow-x-hidden font-sans">
      <div className="mx-auto w-full max-w-md px-4 sm:px-6 py-6 flex flex-col items-center">
        <div className="w-full bg-white rounded-[32px] border-2 border-[#fecaca] shadow-[0_12px_32px_rgba(220,38,38,0.12)] p-5 sm:p-6 flex flex-col items-center justify-center">
          {/* Large Showcase Photo Banner */}
          <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden border-2 border-[#dc2626] mb-4 relative shadow-md bg-[#991b1b]">
            <img
              src={picanonHeroBanner}
              alt="Picanon Collections"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#991b1b]/85 via-[#991b1b]/25 to-transparent flex items-end p-3.5">
              <div className="flex items-center gap-3">
                <img
                  src={picanonBrandEmblem}
                  alt="Picanon"
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md shrink-0"
                />
                <div>
                  <h2 className="font-display text-2xl font-black tracking-[0.22em] text-white uppercase leading-none">
                    PICANON
                  </h2>
                  <span className="text-sm font-black text-white/95 block mt-1">
                    {isRw ? "Imyambaro n'Inkweto" : 'Luxury Apparel & Footwear'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Top 2-Tab Mode Switcher */}
          <div className="w-full grid grid-cols-2 gap-2 p-1.5 rounded-full bg-[#fef2f2] border-2 border-[#fecaca] mb-4">
            <button
              type="button"
              onClick={() => switchMode(false)}
              className={`py-2.5 px-3 rounded-full font-display font-black text-base transition-all cursor-pointer ${
                !isRegister
                  ? 'bg-[#dc2626] text-white shadow-sm'
                  : 'text-[#991b1b] hover:bg-white'
              }`}
            >
              {isRw ? 'Injira' : 'Log in'}
            </button>
            <button
              type="button"
              onClick={() => switchMode(true)}
              className={`py-2.5 px-3 rounded-full font-display font-black text-base transition-all cursor-pointer ${
                isRegister
                  ? 'bg-[#dc2626] text-white shadow-sm'
                  : 'text-[#991b1b] hover:bg-white'
              }`}
            >
              {isRw ? 'Iyandikishe' : 'Register'}
            </button>
          </div>

          {/* Invitation Link Badge if referral link was used */}
          {hasExplicitInvite && initialInviteCode && (
            <div className="w-full mb-4 p-3 bg-[#fef2f2] border-2 border-[#dc2626] rounded-2xl flex items-center gap-2 text-sm font-black text-[#b91c1c]">
              <LinkIcon className="w-5 h-5 text-[#dc2626] shrink-0" />
              <span>
                {isRw
                  ? `Winjiriye kuri link ya Picanon: ${initialInviteCode}`
                  : `Invited via Picanon link: ${initialInviteCode}`}
              </span>
            </div>
          )}

          {/* Page Title */}
          <h1 className="font-display text-3xl font-black text-[#b91c1c] tracking-tight mb-4 text-balance text-center">
            {isRegister
              ? isRw
                ? 'Kora konti nshya'
                : 'Create an account'
              : isRw
                ? 'Kwinjira muri Konti'
                : 'Log in'}
          </h1>

          {error && (
            <div className="w-full mb-4 p-3.5 bg-[#fef2f2] border-2 border-[#dc2626] rounded-xl text-[#b91c1c] text-sm font-black flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 text-[#dc2626]" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            {/* Phone Number Input */}
            <div>
              <label
                htmlFor="picanon-phone"
                className="block text-base font-black text-[#7f1d1d] mb-1.5"
              >
                {isRw ? 'Numero ya telefone' : 'Phone number'}
              </label>
              <div className="flex rounded-xl border-2 border-[#fca5a5] overflow-hidden focus-within:border-[#dc2626] focus-within:ring-2 focus-within:ring-[#dc2626]/20 transition-all bg-white">
                <div className="bg-[#dc2626] text-white px-4 py-3.5 flex items-center justify-center font-black text-base tracking-wide shrink-0">
                  +250
                </div>
                <input
                  id="picanon-phone"
                  name="username"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="078XXXXXXX"
                  className="w-full px-4 py-3.5 text-base font-extrabold text-[#7f1d1d] placeholder-[#fca5a5] focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="picanon-password"
                className="block text-base font-black text-[#7f1d1d] mb-1.5"
              >
                {isRw ? 'Ijambobanga' : 'Password'}
              </label>
              <div className="flex items-center rounded-xl border-2 border-[#fca5a5] overflow-hidden focus-within:border-[#dc2626] focus-within:ring-2 focus-within:ring-[#dc2626]/20 transition-all bg-white">
                <input
                  id="picanon-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder={isRw ? 'Shyiramo ijambobanga ryawe' : 'Please enter your password'}
                  className="w-full px-4 py-3.5 text-base font-extrabold text-[#7f1d1d] placeholder-[#fca5a5] focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="px-3.5 py-3.5 text-[#dc2626] hover:bg-[#fef2f2] cursor-pointer shrink-0"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (Register mode) */}
            {isRegister && (
              <div>
                <label
                  htmlFor="picanon-confirm-password"
                  className="block text-base font-black text-[#7f1d1d] mb-1.5"
                >
                  {isRw ? 'Emeza ijambobanga' : 'Confirm password'}
                </label>
                <div className="flex items-center rounded-xl border-2 border-[#fca5a5] overflow-hidden focus-within:border-[#dc2626] focus-within:ring-2 focus-within:ring-[#dc2626]/20 transition-all bg-white">
                  <input
                    id="picanon-confirm-password"
                    name="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder={isRw ? 'Subiramo ijambobanga' : 'Confirm your password'}
                    className="w-full px-4 py-3.5 text-base font-extrabold text-[#7f1d1d] placeholder-[#fca5a5] focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    className="px-3.5 py-3.5 text-[#dc2626] hover:bg-[#fef2f2] cursor-pointer shrink-0"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Referral / Invitation Code (Register mode) */}
            {isRegister && (
              <div>
                <label
                  htmlFor="picanon-invite-code"
                  className="block text-sm font-black text-[#991b1b] mb-1.5"
                >
                  {isRw ? "Kode y'ubutumire (Referral Code)" : 'Referral Code'}
                </label>
                <div className="rounded-xl border-2 border-[#fca5a5] overflow-hidden focus-within:border-[#dc2626] focus-within:ring-2 focus-within:ring-[#dc2626]/20 transition-all bg-white">
                  <input
                    id="picanon-invite-code"
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="PICANON"
                    className="w-full px-4 py-3.5 text-base font-mono font-black tracking-wider text-[#7f1d1d] placeholder-[#fca5a5] focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Remember Password Checkbox (Login mode) */}
            {!isRegister && (
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2.5 text-base font-extrabold text-[#991b1b] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-5 h-5 rounded border-[#dc2626] accent-[#dc2626]"
                  />
                  <span>{isRw ? 'Bika konti & ijambobanga' : 'Save account & password'}</span>
                </label>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-full bg-[#dc2626] text-white font-display font-black text-lg hover:bg-[#b91c1c] active:scale-[0.99] transition-all shadow-lg cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                <span>
                  {isRegister
                    ? isRw
                      ? 'Iyandikishe nonaha'
                      : 'Register now'
                    : isRw
                      ? 'Injira nonaha'
                      : 'Log in now'}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
