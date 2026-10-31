import axios from 'axios';
import { showSnackbar } from '../../../../core/functions/Snacpar';

/** A task form's message (a choice not made, a wrong order of dates…): a snackbar at the side of the page */
export const warn = (text: string) => showSnackbar('خطأ', text, '#ef4444');

/** A save that failed: the server's answer already has its snackbar; anything else gets one */
export const warnUnlessServer = (e: unknown) => {
  if (!axios.isAxiosError((e as Error)?.cause)) warn((e as Error)?.message || 'تعذر الحفظ');
};
