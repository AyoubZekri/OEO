import { useState } from 'react';
import { LoginData } from './logen_data';
import { Crud } from '../../../../core/class/Crud';

import { useAuth } from '../../../../core/context/AuthContext';

export const useLoginController = (onLoginSuccess: () => void) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);

    const crud = new Crud();
    const loginData = new LoginData(crud);

    try {
      const response = await loginData.postdata(password, email);
      console.log("==================", response);
      if (response && response.status === 'success') {
        if (response.data && response.data.token) {
          login(response.data.token, response.data.user, response.data.role);
        }
        onLoginSuccess();
      } else {
        alert(response?.message || 'فشل تسجيل الدخول. تأكد من صحة البيانات.');
      }
    } catch (error) {
      console.error("Login error", error);
      alert('حدث خطأ أثناء الاتصال بالخادم.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    handleLogin,
  };
};
