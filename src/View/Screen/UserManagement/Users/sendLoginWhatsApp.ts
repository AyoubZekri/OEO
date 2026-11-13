import { Capacitor } from '@capacitor/core';
import client from '../../../../core/api/client';
import { showSnackbar } from '../../../../core/functions/Snacpar';

/**
 * Users' actions: send an account's login (email and current password) in WhatsApp; the receiver is picked there.
 * A password set before copies were kept is unknown: a new one is generated from the edit window first.
 */
export const sendLoginWhatsApp = async (user: { id: string; email: string }) => {
  // On a computer the tab is opened now, while it is still the click (a tab opened after waiting is blocked)
  const tab = Capacitor.isNativePlatform() ? null : window.open('', '_blank');
  try {
    const res = await client.post('/users/password', { id: user.id });
    const password: string | null = res.data?.password ?? null;
    if (!password) {
      tab?.close();
      showSnackbar('كلمة المرور غير معروفة', 'ولّد كلمة مرور جديدة من تعديل المستخدم ثم أرسلها', '#f59e0b');
      return;
    }
    const text = `معلومات الدخول إلى حسابك:
البريد الإلكتروني: ${user.email}
كلمة المرور: ${password}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    if (tab) tab.location.href = url;
    else window.location.href = url; // the phone app hands the link to WhatsApp
  } catch {
    tab?.close();
  }
};
