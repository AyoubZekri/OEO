import React from 'react';
import { useTranslation } from 'react-i18next';
import { LogIn } from 'lucide-react';
import { CustomInput } from '../../../widget/CustomInput';
import { useLoginController } from './LoginController';
import './Login.css';

interface LoginProps {
  onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const { t } = useTranslation();
  const controller = useLoginController(onLoginSuccess);

  return (
    <div className="login-wrapper">
      
      <div className="login-container">
        <div className="login-header">
          <div className="login-logo">
            OEO
          </div>
          <h1>{t('login.welcome_back', 'مرحباً بعودتك')}</h1>
          <p>{t('login.subtitle', 'قم بتسجيل الدخول للوصول إلى لوحة التحكم')}</p>
        </div>

        <form className="login-form" onSubmit={controller.handleLogin}>
          <CustomInput 
            label={t('users.email', 'البريد الإلكتروني')} 
            type="email" 
            placeholder="example@kaidnews.com" 
            required 
            value={controller.email}
            onChange={(e) => controller.setEmail(e.target.value)}
          />
          
          <CustomInput 
            label={t('users.password', 'كلمة المرور')} 
            type="password" 
            placeholder="••••••••" 
            required 
            value={controller.password}
            onChange={(e) => controller.setPassword(e.target.value)}
          />

          <div className="login-options">
            <label className="checkbox-label" style={{ fontSize: '0.85rem' }}>
              <input type="checkbox" />
              <span>{t('login.remember_me', 'تذكرني')}</span>
            </label>
          </div>

          <button 
            type="submit" 
            className={`btn-login ${controller.isLoading ? 'loading' : ''}`}
            disabled={controller.isLoading}
          >
            {controller.isLoading ? (
              <span className="spinner"></span>
            ) : (
              <>
                <LogIn size={20} />
                {t('login.submit', 'تسجيل الدخول')}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
