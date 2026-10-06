import React, { useState } from 'react';
import { Eye, EyeOff, Lock, LogIn, Mail } from 'lucide-react';
import type { useLoginController } from '../../Screen/Auth/Login/LoginController';
import './MobileLogin.css';

const CLUB_NAME = 'أولمبيك الوادي';

interface MobileLoginProps {
  c: ReturnType<typeof useLoginController>;
}

/** Phone login: the club's green header with its logo, the form on a sheet rising over it */
export const MobileLogin: React.FC<MobileLoginProps> = ({ c }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

  return (
    <div className="mlg" dir="rtl">
      <header className="mlg-hero">
        <img className="mlg-watermark" src="/LOGO.webp" alt="" aria-hidden="true" />
        <div className="mlg-crest">
          <img src="/LOGO.webp" alt={CLUB_NAME} />
        </div>
        <h1>{CLUB_NAME}</h1>
      </header>

      <main className="mlg-sheet">
        <div className="mlg-title">
          <h2>مرحباً بعودتك</h2>
          <p>سجّل الدخول للمتابعة إلى حسابك</p>
        </div>

        <form className="mlg-form" onSubmit={c.handleLogin}>
          <label className="mlg-field">
            <span className="mlg-label">البريد الإلكتروني</span>
            <span className="mlg-input">
              <Mail size={19} className="mlg-icon" />
              <input
                type="email"
                inputMode="email"
                autoComplete="username"
                dir="ltr"
                placeholder="example@kaidnews.com"
                required
                value={c.email}
                onChange={e => c.setEmail(e.target.value)}
              />
            </span>
          </label>

          <label className="mlg-field">
            <span className="mlg-label">كلمة المرور</span>
            <span className="mlg-input">
              <Lock size={19} className="mlg-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                dir="ltr"
                placeholder="••••••••"
                required
                value={c.password}
                onChange={e => c.setPassword(e.target.value)}
              />
              <button
                type="button"
                className="mlg-eye"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </span>
          </label>

          <label className="mlg-remember">
            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
            <span className="mlg-switch" aria-hidden="true" />
            <span>تذكرني</span>
          </label>

          <button type="submit" className="mlg-submit" disabled={c.isLoading}>
            {c.isLoading ? <span className="mlg-spinner" aria-label="جارٍ تسجيل الدخول" /> : <><LogIn size={20} /> تسجيل الدخول</>}
          </button>
        </form>

        <footer className="mlg-foot">© {new Date().getFullYear()} {CLUB_NAME}</footer>
      </main>
    </div>
  );
};
