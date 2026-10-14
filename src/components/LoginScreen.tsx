import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Store,
  Mail,
  Phone,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Lock,
  User,
  Zap,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const {
    signInGoogle,
    signInFacebook,
    signInEmail,
    signUpEmail,
    signInPhone,
    signInDirect,
    authError,
    setAuthError,
  } = useAuth();

  // Active Login Method Tab: 'email' | 'phone' | 'google' | 'facebook'
  const [activeTab, setActiveTab] = useState<'email' | 'phone' | 'social'>('email');

  // Email form state
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [shopkeeperName, setShopkeeperName] = useState('');

  // Phone form state
  const [phoneNumber, setPhoneNumber] = useState('0300-1234567');
  const [phoneName, setPhoneName] = useState('Shopkeeper');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('123456');

  // Loading & Local feedback
  const [loading, setLoading] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Clear errors when switching tabs
  const handleTabSwitch = (tab: 'email' | 'phone' | 'social') => {
    setActiveTab(tab);
    setAuthError(null);
    setSuccessNotice(null);
  };

  // 1. Google Login Handler
  const handleGoogleLogin = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      await signInGoogle();
    } catch (err: any) {
      setAuthError(err?.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  // 2. Facebook Login Handler
  const handleFacebookLogin = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      await signInFacebook();
    } catch (err: any) {
      setAuthError(err?.message || 'Facebook sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  // 3. Email Login / Register Handler
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setAuthError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setAuthError(null);
    try {
      if (isRegisterMode) {
        await signUpEmail(email.trim(), password, shopkeeperName.trim());
      } else {
        await signInEmail(email.trim(), password);
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Email authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // 4. Phone OTP Handler
  const handleSendOtp = () => {
    if (!phoneNumber.trim() || phoneNumber.length < 10) {
      setAuthError('Please enter a valid Pakistani mobile number (e.g. 0300-1234567).');
      return;
    }
    setOtpSent(true);
    setSuccessNotice('SMS verification code sent! Enter code below or use default demo code.');
    setAuthError(null);
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);
    try {
      await signInPhone(phoneNumber.trim(), otpCode.trim(), phoneName.trim());
    } catch (err: any) {
      setAuthError(err?.message || 'Phone verification failed');
    } finally {
      setLoading(false);
    }
  };

  // 5. One-Click Instant Access
  const handleDirectAccess = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      await signInDirect('Shop Owner', 'howercommerce@gmail.com');
    } catch (err: any) {
      setAuthError(err?.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex flex-col justify-center items-center p-4">
      {/* Subtle background mesh */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-200">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-emerald-100 rounded-2xl text-emerald-700 mb-3 shadow-xs">
            <Store className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Smart Shop Management</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Physical Retail Point of Sale, Billing & Inventory System
          </p>
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 text-[11px] font-bold rounded-full border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Pakistan Retail Edition (PKR / Rs.)
          </div>
        </div>

        {/* Error Alert Box with Popup Blocker Guidance */}
        {authError && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs leading-relaxed space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block">Sign-in Notice:</span>
                <span>{authError}</span>
              </div>
            </div>

            {authError.toLowerCase().includes('popup') && (
              <div className="pt-2 border-t border-rose-200/80 flex items-center justify-between text-[11px]">
                <span className="text-rose-700 font-medium">Want to bypass browser popups?</span>
                <button
                  type="button"
                  onClick={handleDirectAccess}
                  className="px-2.5 py-1 bg-emerald-700 text-white font-bold rounded-lg hover:bg-emerald-800 transition cursor-pointer"
                >
                  ⚡ Direct Shop Access
                </button>
              </div>
            )}
          </div>
        )}

        {/* Success Notice */}
        {successNotice && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Auth Method Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-2xl text-xs font-bold mb-5">
          <button
            type="button"
            onClick={() => handleTabSwitch('email')}
            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'email'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabSwitch('phone')}
            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'phone'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Mobile Phone</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabSwitch('social')}
            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'social'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Google / FB</span>
          </button>
        </div>

        {/* TAB 1: EMAIL & PASSWORD LOGIN / SIGN UP */}
        {activeTab === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-3.5 text-xs">
            {isRegisterMode && (
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Shopkeeper / Store Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={shopkeeperName}
                    onChange={(e) => setShopkeeperName(e.target.value)}
                    placeholder="e.g. Haji Aslam / Bismillah Store"
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="font-bold text-slate-700 block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@yourshop.com"
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : isRegisterMode ? (
                <>
                  <span>Create Account & Enter Shop</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Sign In with Email</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(!isRegisterMode);
                  setAuthError(null);
                }}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-bold hover:underline cursor-pointer"
              >
                {isRegisterMode
                  ? 'Already have an account? Sign in here'
                  : 'New shopkeeper? Create an account with Email'}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: MOBILE PHONE NUMBER & SMS OTP LOGIN */}
        {activeTab === 'phone' && (
          <form onSubmit={handlePhoneSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Shopkeeper Name (Optional)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={phoneName}
                  onChange={(e) => setPhoneName(e.target.value)}
                  placeholder="e.g. Tariq Mehmood"
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Mobile Number (Pakistan / International)
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="0300-1234567"
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shrink-0 cursor-pointer"
                >
                  {otpSent ? 'Resend' : 'Send Code'}
                </button>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-bold text-slate-700">Verification Code (OTP)</label>
                <span className="text-[10px] text-emerald-600 font-semibold">Demo code: 123456</span>
              </div>
              <input
                type="text"
                required
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="Enter 6-digit code"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-mono text-center tracking-widest font-black text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Verifying Phone...</span>
              ) : (
                <>
                  <span>Verify Mobile & Open POS</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 3: SOCIAL LOGIN (GOOGLE GMAIL & FACEBOOK) */}
        {activeTab === 'social' && (
          <div className="space-y-3 text-xs">
            {/* Google Gmail Sign-in */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-xl border border-slate-300 shadow-xs hover:shadow transition disabled:opacity-60 cursor-pointer group"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign in with Google (Gmail)</span>
            </button>

            {/* Facebook Sign-in */}
            <button
              type="button"
              onClick={handleFacebookLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold rounded-xl shadow-xs hover:shadow transition disabled:opacity-60 cursor-pointer"
            >
              <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>Continue with Facebook</span>
            </button>
          </div>
        )}

        {/* ONE-CLICK INSTANT ACCESS (BYPASS POP-UP BLOCKERS) */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleDirectAccess}
            disabled={loading}
            className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
          >
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>Instant Shopkeeper Access (Bypass Pop-ups)</span>
          </button>
          <p className="text-[10px] text-slate-400 text-center mt-1.5">
            Logs into your store catalog directly with live Firebase Firestore synchronization.
          </p>
        </div>

        {/* Feature summary bullets */}
        <div className="mt-5 pt-4 border-t border-slate-100 text-[11px] text-slate-600 space-y-1.5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Thermal 80mm & A4 Invoices with JazzCash, Easypaisa & Cash</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Automatic Stock Decrement & Real-time Khata Ledger</span>
          </div>
        </div>
      </div>
    </div>
  );
};
