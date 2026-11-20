import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  CheckCheck,
  Users,
  Radio,
  Headphones,
} from 'lucide-react';
import { Language, AdminSettings } from '../types';
import { picanonBrandEmblem } from '../assets/images';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read';
}

interface LiveChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  adminSettings: AdminSettings;
  userPhone?: string;
}

export const LiveChatModal: React.FC<LiveChatModalProps> = ({
  isOpen,
  onClose,
  language,
  adminSettings,
}) => {
  const isRw = language === 'rw';
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const initialGreeting: ChatMessage = {
    id: 'welcome-1',
    sender: 'agent',
    text: isRw
      ? "Muraho neza! Murakaza neza kuri Live Chat ya Picanon. Ndi Sarah wo ku biro by'ubufasha bya Picanon. Niteguye kugufasha ako kanya ku bibazo byo kubitsa (MoMo/Airtel), kubikuza, imyambaro n'inkweto bya VIP cyangwa inyungu z'itsinda (38% cashback)."
      : 'Hello! Welcome to Picanon Live Support. I am Sarah from our customer care desk. How can I assist you right now regarding deposits, instant withdrawals, VIP apparel & footwear packages, or referral cashback?',
    timestamp: 'Just now',
    status: 'read',
  };

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('picanon_live_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return [initialGreeting];
  });

  const [inputText, setInputText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [confirmClear, setConfirmClear] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem('picanon_live_chat_history', JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [isOpen, messages, isTyping]);

  if (!isOpen) return null;

  const quickQuestions = isRw
    ? [
        { label: 'Uburyo bwo Kubitsa', query: 'Ndashaka kumenya uburyo bwo kubitsa kuri MoMo cyangwa Airtel' },
        { label: 'Kubikuza & Amafaranga Make', query: 'Amafaranga make yo kubikuza ni angahe kandi bifata igihe kingana iki?' },
        { label: 'VIP 0 – VIP 10', query: 'Ndashaka kumenya ibyerekeye VIP 0 (3,000 RWF) kugeza kuri VIP 10 n\'inyungu zayo' },
        { label: 'Komisiyo (38%)', query: 'Nsobanurira uburyo bwo kubona 38% by\'amafaranga iyo natumiye inshuti' },
        { label: 'Telegram', query: 'Mwangereka ku itsinda rya Telegram n\'umuyobozi w\'amakuru?' },
      ]
    : [
        { label: 'How to Deposit', query: 'How do I deposit using MoMo or Airtel Money?' },
        { label: 'Withdrawal Speed', query: 'What is the minimum withdrawal and processing time?' },
        { label: 'VIP 0 – VIP 10', query: 'Tell me about VIP 0 (3,000 RWF) through VIP 10 pricing and daily yield' },
        { label: 'Team 38% Cashback', query: 'How does the 38% Level 1 referral cashback work?' },
        { label: 'Official Telegram', query: 'Where can I access the official Telegram group and support?' },
      ];

  const generateAgentReply = (userQuery: string): string => {
    const q = userQuery.toLowerCase();

    if (q.includes('bitsa') || q.includes('deposit') || q.includes('momo') || q.includes('airtel')) {
      const minDep = (adminSettings.minDeposit || 1000).toLocaleString();
      return isRw
        ? `Kubitsa muri Picanon bikorwa ako kanya! Kanda ahanditse "Kubitsa" (Recharge) ahabanza, uhitemo MTN MoMo cyangwa Airtel Money. Byibuze ni RWF ${minDep}. Amafaranga ahita agera kuri konti yawe 24/7.`
        : `Recharging is fully automated 24/7! Click "Recharge" on your home screen, select MTN MoMo or Airtel Money. The minimum deposit is RWF ${minDep}. Your balance reflects in your account promptly.`;
    }

    if (q.includes('bikuza') || q.includes('withdraw') || q.includes('amafaranga make') || q.includes('minimum')) {
      const minWith = (adminSettings.minWithdrawal || 1000).toLocaleString();
      const feePct = adminSettings.withdrawalFeePercent ?? 10;
      return isRw
        ? `Kubikuza bitangirira ku RWF ${minWith} gusa! Ushobora kubikuza inshuro zigera kuri 5 ku munsi kuri MTN cyangwa Airtel yawe. Ikiguzi cy'umusoro ni ${feePct}% kandi amafaranga agera kuri telefone yawe mu mutekano usesuye.`
        : `Withdrawals start from just RWF ${minWith}! You can withdraw up to 5 times per day to your MTN or Airtel Money number. The withdrawal tax fee is ${feePct}%, and funds are credited safely.`;
    }

    if (q.includes('vip') || q.includes('sneaker') || q.includes('shoe') || q.includes('inyungu') || q.includes('3000') || q.includes('3,000') || q.includes('6000') || q.includes('6,000')) {
      return isRw
        ? 'Imyambaro n\'inkweto bya VIP bya Picanon bihereye kuri VIP 0 kugeza kuri VIP 10! VIP 0 (Picanon Starter Canvas Sneakers) igura RWF 3,000 igatanga RWF 600 buri munsi mu minsi 40 (Yose ni RWF 24,000), naho VIP 1 igura RWF 6,000 ikinjiza RWF 1,200 ku munsi. Inyungu ya VIP yakirwa rimwe mu masaha 24!'
        : 'Picanon VIP apparel & footwear packages run from VIP 0 up to VIP 10! VIP 0 (Picanon Starter Canvas Sneakers) costs RWF 3,000 and earns RWF 600/day for 40 days (RWF 24,000 total), and VIP 1 costs RWF 6,000 earning RWF 1,200/day. VIP returns are claimed once every 24 hours!';
    }

    if (q.includes('itsinda') || q.includes('team') || q.includes('38') || q.includes('komisiyo') || q.includes('cashback')) {
      return isRw
        ? 'Iyo watumiye inshuti igakora konti igashora imari muri VIP, uhita wakira 38% by\'amafaranga ashyizemo ako kanya! Urwego rwa 2 rutanga 2%, naho urwego rwa 3 rugatanga 1%.'
        : 'When friends you invite sign up and invest, you instantly receive 38% cashback deposited into your account! Level 2 team gives 2%, and Level 3 team gives 1%.';
    }

    if (q.includes('telegram') || q.includes('group') || q.includes('support') || q.includes('channel')) {
      return isRw
        ? `Ushobora kwifatanya n'itsinda ryacu rya Picanon Group (${adminSettings.telegramGroup || 'https://t.me/picanonrw1'}), kuri Channel (${adminSettings.telegramChannel || 'https://t.me/Picanon_channel'}), cyangwa ukavugana na Support kuri ${adminSettings.telegramSupport || 'https://t.me/Picanon_support'}.`
        : `You can join Picanon Group at ${adminSettings.telegramGroup || 'https://t.me/picanonrw1'}, follow our Channel at ${adminSettings.telegramChannel || 'https://t.me/Picanon_channel'}, or message Support directly at ${adminSettings.telegramSupport || 'https://t.me/Picanon_support'}.`;
    }

    return isRw
      ? `Urakoze kutwandikira! Ubutumwa bwawe bwakiriwe n'itsinda ry'ubufasha rya Picanon. Niba ushaka ubufasha bwihariye, ushobora no kutwandikira kuri Telegram yacu: ${adminSettings.telegramSupport || 'https://t.me/Picanon_support'}.`
      : `Thank you for reaching out! Your inquiry has been received by Picanon support. You can also chat directly on our official Telegram: ${adminSettings.telegramSupport || 'https://t.me/Picanon_support'}.`;
  };

  const handleSendMessage = (textToSend?: string) => {
    const messageContent = (textToSend || inputText).trim();
    if (!messageContent) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: messageContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'delivered',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      const replyText = generateAgentReply(messageContent);
      const agentMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'read',
      };
      setMessages((prev) => [...prev, agentMsg]);
      setIsTyping(false);
    }, 700);
  };

  const handleClearHistory = () => {
    setMessages([initialGreeting]);
    localStorage.removeItem('picanon_live_chat_history');
    setConfirmClear(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in font-sans">
      <div className="w-full max-w-md bg-white border-2 border-[#dc2626] rounded-t-3xl sm:rounded-2xl h-[620px] max-h-[95vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom">
        {/* Chat Header */}
        <div className="p-3.5 bg-[#dc2626] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <img
              src={picanonBrandEmblem}
              alt="Picanon"
              className="w-11 h-11 rounded-full object-cover border-2 border-white"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-white">
                  Picanon Live Support
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-white text-[#dc2626] text-[10px] font-black">
                  Online
                </span>
              </div>
              <p className="text-xs font-bold text-white/95">
                Sarah (Picanon Support Desk) • 24/7
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {confirmClear ? (
              <div className="flex items-center gap-1 mr-1">
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="text-xs font-black text-white bg-white/20 px-2.5 py-1 rounded-lg cursor-pointer"
                >
                  {isRw ? 'Oya' : 'No'}
                </button>
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="text-xs text-[#dc2626] bg-white font-black px-2.5 py-1 rounded-lg cursor-pointer"
                >
                  {isRw ? 'Siba' : 'Clear'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="text-xs font-black text-white/90 hover:text-white px-2 py-1 rounded cursor-pointer"
                title="Clear"
              >
                {isRw ? 'Siba' : 'Clear'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-full text-white hover:bg-white/20 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Direct Telegram Group / Channel / Support Team Strip */}
        <div className="px-3 py-2.5 bg-white border-b-2 border-[#fecaca] grid grid-cols-3 gap-2 shrink-0">
          <a
            href={adminSettings.telegramGroup || 'https://t.me/picanonrw1'}
            target="_blank"
            rel="noreferrer"
            className="flex flex-col items-center justify-center gap-1 py-2 px-1.5 rounded-xl bg-[#fef2f2] hover:bg-[#fee2e2] border border-[#fecaca] text-[#b91c1c] text-center transition-colors"
          >
            <Users className="w-4 h-4 text-[#dc2626]" />
            <span className="text-[11px] font-black leading-tight">Telegram Group</span>
          </a>
          <a
            href={adminSettings.telegramChannel || 'https://t.me/Picanon_channel'}
            target="_blank"
            rel="noreferrer"
            className="flex flex-col items-center justify-center gap-1 py-2 px-1.5 rounded-xl bg-[#fef2f2] hover:bg-[#fee2e2] border border-[#fecaca] text-[#b91c1c] text-center transition-colors"
          >
            <Radio className="w-4 h-4 text-[#dc2626]" />
            <span className="text-[11px] font-black leading-tight">Telegram Channel</span>
          </a>
          <a
            href={adminSettings.telegramSupport || 'https://t.me/Picanon_support'}
            target="_blank"
            rel="noreferrer"
            className="flex flex-col items-center justify-center gap-1 py-2 px-1.5 rounded-xl bg-[#dc2626] hover:bg-[#b91c1c] text-white text-center transition-colors"
          >
            <Headphones className="w-4 h-4 text-white" />
            <span className="text-[11px] font-black leading-tight">Support Team</span>
          </a>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#fff5f5] text-sm font-bold">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <img
                    src={picanonBrandEmblem}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover border-2 border-[#dc2626] shrink-0 self-end mb-1"
                  />
                )}
                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-3 shadow-2xs leading-relaxed ${
                    isUser
                      ? 'bg-[#dc2626] text-white rounded-br-xs'
                      : 'bg-white text-[#7f1d1d] border-2 border-[#fecaca] rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <div
                    className={`flex items-center justify-end gap-1 mt-1 text-[10px] font-black ${
                      isUser ? 'text-white/90' : 'text-[#991b1b]'
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    {isUser && <CheckCheck className="w-3.5 h-3.5 text-white" />}
                  </div>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center gap-2 text-[#991b1b] text-xs">
              <img
                src={picanonBrandEmblem}
                alt=""
                className="w-7 h-7 rounded-full object-cover shrink-0 border border-[#dc2626]"
              />
              <div className="px-3 py-2 bg-white rounded-full border-2 border-[#fecaca] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#dc2626] animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-[#dc2626] animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-[#dc2626] animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-2.5 bg-white border-t-2 border-[#fecaca] overflow-x-auto flex gap-2 no-scrollbar shrink-0">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q.query)}
              className="whitespace-nowrap px-3 py-1.5 rounded-full bg-[#fee2e2] hover:bg-[#dc2626] text-[#b91c1c] hover:text-white text-xs font-black transition-colors shrink-0 cursor-pointer"
            >
              {q.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t-2 border-[#fecaca] flex items-center gap-2 shrink-0">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            placeholder={isRw ? 'Andika ubutumwa hano...' : 'Type a message...'}
            className="flex-1 px-4 py-3 bg-[#fef2f2] border-2 border-[#fca5a5] rounded-full text-sm font-bold text-[#7f1d1d] placeholder-[#fca5a5] focus:outline-none focus:border-[#dc2626]"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim()}
            className="w-11 h-11 rounded-full bg-[#dc2626] text-white flex items-center justify-center disabled:opacity-40 hover:bg-[#b91c1c] transition-all shrink-0 cursor-pointer"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
