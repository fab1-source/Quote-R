import React, { useState } from 'react';
import { Lock, User, ShieldCheck, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { InterglassEmblem } from './InterglassLogo';
import { UserAccount } from '../types';
import { authenticateUser } from '../utils/userStorage';

interface LoginScreenProps {
  onLoginSuccess: (user: UserAccount) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      const result = authenticateUser(username, password);
      setIsLoading(false);
      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMessage(result.error || 'Authentication failed. Please check credentials.');
      }
    }, 150);
  };

  const handleSelectUsername = (selectedUsername: string) => {
    setUsername(selectedUsername);
    setPassword('');
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100 font-sans relative overflow-hidden">
      {/* Background Decorative Rings */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-red-900/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-900/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Card */}
      <div className="w-full max-w-md bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden relative z-10">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-[#7B1818] to-[#991B1B] text-white p-6 text-center relative">
          <div className="flex justify-center mb-3">
            <div className="p-2.5 bg-white rounded-xl shadow-md">
              <InterglassEmblem className="w-12 h-12" />
            </div>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">INTER GLASS CO. LLC.</h1>
          <p className="text-xs text-red-100 font-medium tracking-wider uppercase mt-0.5">
            Internal Quotation & Production ERP Portal
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-black/20 rounded-full text-[11px] text-red-100 border border-white/10">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span>Authorized Personnel Access Only</span>
          </div>
        </div>

        {/* Login Form Body */}
        <form onSubmit={handleLogin} className="p-6 sm:p-8 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Access Denied: </span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. HOD, ESTIMATOR1, FACTORY1"
                autoComplete="username"
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-300 focus:border-[#7B1818] rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 font-medium transition"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-300 focus:border-[#7B1818] rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 font-medium transition"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-[#7B1818] hover:bg-[#8F1D1D] active:bg-[#681414] text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            <span>{isLoading ? 'Signing In...' : 'Sign In to Portal'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Quick Select User Account (Usernames only - passwords hidden) */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Select User Account:
              </span>
              <span className="text-[10px] text-slate-400">Click to select username</span>
            </div>

            <div className="grid grid-cols-1 gap-2 text-xs">
              {/* ADMIN - HOD */}
              <button
                type="button"
                onClick={() => handleSelectUsername('HOD')}
                className="w-full p-2.5 rounded-lg border border-red-200 bg-red-50/60 hover:bg-red-100/70 text-left transition flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="font-bold text-red-950 flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-red-700 text-white text-[10px] font-extrabold uppercase">
                      ADMIN
                    </span>
                    <span className="font-mono font-bold">HOD</span>
                  </div>
                  <div className="text-[11px] text-red-800 mt-0.5">Complete portal access & Users management</div>
                </div>
                <span className="text-red-700 text-xs font-semibold opacity-0 group-hover:opacity-100 transition">
                  Select &rarr;
                </span>
              </button>

              {/* ESTIMATION - ESTIMATOR1 */}
              <button
                type="button"
                onClick={() => handleSelectUsername('ESTIMATOR1')}
                className="w-full p-2.5 rounded-lg border border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 text-left transition flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="font-bold text-blue-950 flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-blue-700 text-white text-[10px] font-extrabold uppercase">
                      ESTIMATION
                    </span>
                    <span className="font-mono font-bold">ESTIMATOR1</span>
                  </div>
                  <div className="text-[11px] text-blue-800 mt-0.5">Quotations & Cost Sheets portal</div>
                </div>
                <span className="text-blue-700 text-xs font-semibold opacity-0 group-hover:opacity-100 transition">
                  Select &rarr;
                </span>
              </button>

              {/* PRODUCTION - FACTORY1 */}
              <button
                type="button"
                onClick={() => handleSelectUsername('FACTORY1')}
                className="w-full p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/70 text-left transition flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-700 text-white text-[10px] font-extrabold uppercase">
                      PRODUCTION
                    </span>
                    <span className="font-mono font-bold">FACTORY1</span>
                  </div>
                  <div className="text-[11px] text-emerald-800 mt-0.5">Job Cards production portal</div>
                </div>
                <span className="text-emerald-700 text-xs font-semibold opacity-0 group-hover:opacity-100 transition">
                  Select &rarr;
                </span>
              </button>
            </div>
          </div>
        </form>

        {/* Footer info */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 text-center text-[11px] text-slate-500">
          Inter Glass Co. LLC. Ajman, UAE • Security & Access Control
        </div>
      </div>
    </div>
  );
};
