import { useEffect, useState } from 'react';
import axios from 'axios';
import { Applink } from '../../../LinkApi';
import type { DisciplinaryModel } from '../Disciplinary/disciplinary_data';
import type { AbsenceRecord } from '../Absence/AbsenceRequestsController';

export interface EquipmentMovementRecord {
  equipment?: { name?: string };
  equipment_name?: string;
  name?: string;
  quantity?: number;
  delivery_date?: string;
  return_date?: string | null;
}

interface EquipmentOperation {
  member_id?: string | number;
  individual_id?: string | number;
  operation_date?: string;
  movements?: EquipmentMovementRecord[];
}

export type RecordTone = 'pos' | 'warn' | 'neg' | 'muted';

// Same rule as DisciplinaryController: a decision means executed, an open item past its deadline is late
export const disciplinaryStatus = (d: DisciplinaryModel): string => {
  const hasDecision = !!(d.decision_outcome?.trim() || d.admin_notes?.trim() || d.decision_reasons?.trim());
  if (hasDecision && d.status !== 'ملغى') return 'منفذ';
  if (d.status === 'مفتوح' && d.deadlineOrHearingDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(d.deadlineOrHearingDate);
    deadline.setHours(0, 0, 0, 0);
    if (deadline < today) return 'متأخر';
  }
  return d.status;
};

export const DISCIPLINARY_STATUS_TONE: Record<string, RecordTone> = {
  'منفذ': 'pos',
  'مفتوح': 'warn',
  'متأخر': 'neg',
  'غير منفذ': 'neg',
  'ملغى': 'muted',
};

export type AbsenceKind = 'absence' | 'late' | 'leave' | 'request';

// Unify spellings: أ/إ/آ → ا, ة → ه, drop diacritics (تأخر = تاخر, متأخر = متاخر)
const normalizeArabic = (text: string) =>
  text.replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/[\u064B-\u0652]/g, '').trim().toLowerCase();

/**
 * Kind of an absence record from its absence_type. Matched loosely because records come from the
 * absences page ("تأخر") and from attendance sheets ("متأخر"), with or without hamza.
 */
export const absenceKind = (a: AbsenceRecord): { kind: AbsenceKind; label: string } => {
  const type = normalizeArabic(a.absence_type || '');
  if (type.includes('تاخر') || type.includes('late')) return { kind: 'late', label: 'تأخر' };
  if (type.includes('مغادره') || type.includes('leave')) return { kind: 'leave', label: 'مغادرة' };
  if (type.includes('عطله') || type.includes('request')) return { kind: 'request', label: 'طلب عطلة' };
  return { kind: 'absence', label: 'غياب' };
};

const JUSTIFIED_LABEL: Record<AbsenceKind, string> = {
  absence: 'غياب مبرر',
  late: 'تأخر مبرر',
  leave: 'مغادرة مبررة',
  request: 'طلب مقبول',
};

// Justification status, worded for the kind of record (same wording as the absences page)
export const absenceStatus = (a: AbsenceRecord): { label: string; tone: RecordTone } => {
  const { kind } = absenceKind(a);
  switch (a.justification_status) {
    case 'مقبول':
    case 'accepted':
      return { label: JUSTIFIED_LABEL[kind], tone: 'pos' };
    case 'مرفوض':
    case 'rejected':
      return { label: kind === 'request' ? 'طلب مرفوض' : 'تبرير مرفوض', tone: 'neg' };
    case 'قيد_الدراسة':
    case 'pending':
      return { label: kind === 'request' ? 'قيد المراجعة' : 'قيد مراجعة التبرير', tone: 'warn' };
    default:
      return { label: kind === 'request' ? 'بدون رد' : 'بدون تبرير', tone: 'neg' };
  }
};

export const movementName = (m: EquipmentMovementRecord, index: number) =>
  m.equipment?.name || m.equipment_name || m.name || `عتاد #${index + 1}`;

const listFrom = (data: unknown): unknown[] => {
  const body = data as { data?: unknown } | unknown[] | undefined;
  if (Array.isArray(body)) return body;
  return Array.isArray(body?.data) ? body.data : [];
};

interface RecordData {
  memberId: string;
  movements: EquipmentMovementRecord[];
  disciplinary: DisciplinaryModel[];
  absences: AbsenceRecord[];
}

/**
 * Equipment movements, disciplinary actions and absences of one member (null = nothing to load).
 * Shared by the desktop tracking record dialog and the phone tracking record page.
 */
export const useMemberRecord = (memberId: string | null) => {
  const [record, setRecord] = useState<RecordData | null>(null);

  useEffect(() => {
    if (!memberId) return;
    let cancelled = false;
    const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
    const isMember = (id: unknown) => String(id) === String(memberId);

    const load = async () => {
      const [eqRes, discRes, absRes] = await Promise.allSettled([
        axios.get(`${Applink.equipmentOperations}?player_id=${memberId}`, { headers }),
        axios.get(Applink.disciplinary, { headers }),
        axios.get(`${Applink.server}/absences`, { headers }),
      ]);
      if (cancelled) return;

      // Each movement gets its operation date when it has no delivery date of its own
      const operations = eqRes.status === 'fulfilled'
        ? (listFrom(eqRes.value.data) as EquipmentOperation[]).filter(op => isMember(op.member_id) || isMember(op.individual_id))
        : [];
      const movements = operations.flatMap(op =>
        (op.movements || []).map(m => ({ ...m, delivery_date: m.delivery_date || op.operation_date }))
      );

      const disciplinary = discRes.status === 'fulfilled'
        ? (listFrom(discRes.value.data) as DisciplinaryModel[]).filter(d => isMember(d.memberId))
        : [];

      const absences = absRes.status === 'fulfilled'
        ? (listFrom(absRes.value.data) as AbsenceRecord[])
          .filter(a => isMember(a.player_id))
          .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())
        : [];

      setRecord({ memberId, movements, disciplinary, absences });
    };

    load();
    return () => { cancelled = true; };
  }, [memberId]);

  // Data loaded for another member (or not loaded yet) counts as loading
  const current = record && record.memberId === memberId ? record : null;
  return {
    isLoading: !!memberId && !current,
    movements: current?.movements ?? [],
    disciplinary: current?.disciplinary ?? [],
    absences: current?.absences ?? [],
  };
};
