import axios, { type AxiosInstance } from 'axios';
import client from './client';
import { Applink } from '../../LinkApi';
import { showSnackbar } from '../functions/Snacpar';
import { setConnectionProblem } from './connectionState';

/**
 * Every error coming back from the server shows as a snackbar at the side of the page: the axios requests (the api
 * client) and the fetch ones (the Crud class). Its text is the server's own — the first field error, else its message.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
const NO_SERVER = 'تعذر الاتصال بالخادم';
const FALLBACK = 'تعذر تنفيذ العملية، حاول مرة أخرى';

// Laravel's own English messages, in Arabic
const ARABIC: Record<string, string> = {
  'Unauthenticated.': 'انتهت الجلسة، سجّل الدخول من جديد',
  'This action is unauthorized.': 'ليست لديك صلاحية لهذه العملية',
  'Forbidden': 'ليست لديك صلاحية لهذه العملية',
  'Not Found': 'العنصر غير موجود',
  'Server Error': 'خطأ في الخادم، حاول لاحقاً',
  'Too Many Attempts.': 'محاولات كثيرة، انتظر قليلاً ثم أعد المحاولة',
};

/** The server's text for a failed answer (its body, already read) */
const messageOf = (data: any): string => {
  const first = data?.errors ? Object.values(data.errors).flat()[0] : null;
  const text = typeof first === 'string' ? first : typeof data?.message === 'string' && data.message ? data.message : FALLBACK;
  if (/^The route .* could not be found\.$/.test(text)) return 'الرابط غير موجود في الخادم';
  if (/^No query results for model/.test(text)) return 'العنصر غير موجود';
  return ARABIC[text] || text;
};

const show = (text: string) => showSnackbar('خطأ', text, '#ef4444');

const isLogout = (url?: string) => Boolean(url?.endsWith('/logout'));

// The last answer tells the empty pages what to draw: no connection, a failing server, or nothing wrong
const noteStatus = (status?: number) => setConnectionProblem(status === undefined ? 'offline' : status >= 500 ? 'server' : null);

const watch = (instance: AxiosInstance) => {
  instance.interceptors.response.use(response => {
    noteStatus(response.status);
    return response;
  }, error => {
    if (!axios.isCancel(error) && axios.isAxiosError(error) && !isLogout(error.config?.url)) {
      noteStatus(error.response?.status);
      show(error.response ? messageOf(error.response.data) : NO_SERVER);
    }
    return Promise.reject(error);
  });
};

let installed = false;

/** Installed once at start */
export const reportApiErrors = () => {
  if (installed) return;
  installed = true;
  watch(axios);
  watch(client);

  const realFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const ours = url.startsWith(Applink.server) && !isLogout(url);
    let response: Response;
    try {
      response = await realFetch(input, init);
    } catch (e) {
      if (ours && (e as Error)?.name !== 'AbortError') {
        noteStatus(undefined);
        show(NO_SERVER);
      }
      throw e;
    }
    if (ours) noteStatus(response.status);
    if (ours && !response.ok) {
      // A copy is read, the page still reading the answer itself
      response.clone().json().then(messageOf, () => FALLBACK).then(show);
    }
    return response;
  };
};
/* eslint-enable @typescript-eslint/no-explicit-any */
