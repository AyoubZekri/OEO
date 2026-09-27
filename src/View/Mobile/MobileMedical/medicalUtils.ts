import { Applink } from '../../../LinkApi';
import type { PlayerMedicalRecord } from '../../Screen/Medical/medical_model';

/* eslint-disable @typescript-eslint/no-explicit-any -- people come untyped from the API */

export type MedicalMode = 'injury' | 'initial_exam' | 'final_exam' | 'return_decision';

// Stage rules of the desktop medical cards
export const initialDone = (r: PlayerMedicalRecord) => r.record_status !== 'مفتوح/مصاب';
export const finalDone = (r: PlayerMedicalRecord) =>
  ['بانتظار قرار العودة', 'مغلق/متعافي', 'قيد التأهيل'].includes(r.record_status);
export const recovered = (r: PlayerMedicalRecord) => r.record_status === 'مغلق/متعافي';

/** 1 (only the injury) to 4 (recovered) */
export const stageOf = (r: PlayerMedicalRecord) => (recovered(r) ? 4 : finalDone(r) ? 3 : initialDone(r) ? 2 : 1);

export const STATUS_TONE: Record<string, string> = {
  'مفتوح/مصاب': 'red',
  'بانتظار الفحص النهائي': 'amber',
  'بانتظار قرار العودة': 'blue',
  'قيد التأهيل': 'amber',
  'مغلق/متعافي': 'green',
};
export const toneOf = (r: PlayerMedicalRecord) => STATUS_TONE[r.record_status] || 'muted';

export const personName = (p: any, fallback = 'غير معروف') =>
  p?.name || (p?.first_name ? `${p.first_name} ${p.last_name || ''}`.trim() : fallback);

export const personPhoto = (p: any) => {
  const photo: string | undefined = p?.photo;
  if (!photo || photo.includes('default') || photo.includes('ui-avatars')) return null;
  return photo.startsWith('http') ? photo : `${Applink.image}/${photo.replace(/^\//, '')}`;
};

export const dayOnly = (value?: string | null) => (value || '').split('T')[0];

/** Whole days from `day` to today (positive = in the past) */
export const daysSince = (day?: string | null) => {
  if (!day) return null;
  const [y, m, d] = dayOnly(day).split('-').map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  if (isNaN(date.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((today.getTime() - date.getTime()) / 86400000);
};

export const daysText = (n: number) => (n === 1 ? 'يوم' : n === 2 ? 'يومين' : n <= 10 ? `${n} أيام` : `${n} يوماً`);
/* eslint-enable @typescript-eslint/no-explicit-any */
