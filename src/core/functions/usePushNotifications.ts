import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import client from '../api/client';
import { DATA_CHANGED } from '../api/dataChanged';
import { useAuth } from '../context/AuthContext';
import { useSpace } from '../context/space';

// The notifications' channel (the server sends to it): heard, at the top of the screen, on the lock screen
const CHANNEL = 'alerts';

// The phone's last token: sent again at every sign-in, even before Firebase gives it again
const SAVED = 'push.token';

const sendToken = (token: string) => {
  try {
    localStorage.setItem(SAVED, token);
  } catch {
    // Not kept: Firebase gives it again next time
  }
  // Its answer in the app's log (adb logcat: «push:»), to follow it on a phone
  client.post('/me/push-token', { token })
    .then(() => console.info('push: token saved'))
    .catch(e => console.warn('push: token not saved', e?.response?.status ?? e?.message));
};

/**
 * The Android app's notifications (Firebase): at every sign-in (each account), the phone asks for permission and its
 * token goes to the server for that account (who gets which notification is decided there); a tapped notification
 * opens its place: the page in its data (link, in its space), or its task on the home page.
 * The «التنبيهات» channel (CHANNEL): the phone's sound, vibration, on the lock screen.
 */
export const usePushNotifications = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { space, setSpace } = useSpace();
  const account = user?.id || '';
  // The tap's way to its place, always the current one (the listener is added once per account)
  const goRef = useRef<(data: Record<string, string> | undefined) => void>(() => undefined);
  useEffect(() => {
    goRef.current = data => {
      // Its place: the page it names (in its space), or a task on the home page
      if (data?.space && data.space !== space && (data.space === 'personal' || data.space === 'management')) setSpace(data.space);
      const id = Number(data?.task_id) || null;
      navigate(data?.link || (id ? `/?task=${id}` : '/'));
    };
  });

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !account) return;
    let closed = false;
    (async () => {
      // This account: the token it had on this phone, at once
      const saved = localStorage.getItem(SAVED);
      if (saved) sendToken(saved);

      await PushNotifications.removeAllListeners();
      // The first channel had a sound file that does not exist (silent): gone, and a new one with the phone's sound
      await PushNotifications.deleteChannel({ id: 'tasks' }).catch(() => undefined);
      await PushNotifications.createChannel({
        id: CHANNEL,
        name: 'التنبيهات',
        description: 'المهام، الرسائل وكل تنبيهات النادي',
        importance: 5,
        visibility: 1,
        vibration: true,
        lights: true,
        lightColor: '#F97316',
      });
      await PushNotifications.addListener('registration', t => {
        if (!closed) sendToken(t.value);
      });
      // A notification came (the app open) or was tapped: the in-app alerts reload, so it shows there too
      await PushNotifications.addListener('pushNotificationReceived', () => window.dispatchEvent(new Event(DATA_CHANGED)));
      await PushNotifications.addListener('pushNotificationActionPerformed', a => {
        window.dispatchEvent(new Event(DATA_CHANGED));
        goRef.current(a.notification.data);
      });
      let perm = await PushNotifications.checkPermissions();
      if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') perm = await PushNotifications.requestPermissions();
      if (perm.receive !== 'granted' || closed) return;
      // Firebase gives the token (again) with «registration»
      await PushNotifications.register();
    })().catch(() => undefined);

    return () => {
      closed = true;
      PushNotifications.removeAllListeners().catch(() => undefined);
    };
  }, [account]);
};

/** Signing out: this phone gets no more notifications for the account (sent with the token still in hand) */
export const forgetPushToken = (token: string | null) => {
  if (!token || !Capacitor.isNativePlatform()) return;
  client.post('/me/push-token', { token: null }, { headers: { Authorization: `Bearer ${token}` } }).catch(() => undefined);
};
