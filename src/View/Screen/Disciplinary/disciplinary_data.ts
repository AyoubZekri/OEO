export interface DisciplinaryModel {
  id: string;
  memberId: string;
  memberName: string;
  actionType: 'تنبيه' | 'إنذار' | 'طلب توضيح' | 'إحالة على الجهة التأديبية المختصة' | 'استدعاء جلسة' | 'واقعة';
  incidentDate: string;
  /** The incident's time of day ("HH:MM"), when it has one */
  incidentTime?: string;
  reason: string;
  status: 'مفتوح' | 'منفذ' | 'غير منفذ' | 'متأخر' | 'ملغى';
  incidentLocation?: string;
  violatedRule?: string;
  presentPeople?: string;
  attachments?: string;
  deadlineOrHearingDate?: string;
  hearingLocation?: string;
  /** A hearing: who runs it, and when it closed ("HH:MM"; its minutes are printed once it is) */
  hearingOfficer?: string;
  hearingEndTime?: string;
  /** The hearing's time of day ("HH:MM"), when its date has one */
  hearingTime?: string;
  player_statements?: string;
  admin_notes?: string;
  decision_outcome?: string;
  decision_reasons?: string;
  is_acknowledged?: boolean;
  acknowledged_at?: string;
  effective_date?: string;
  signed_document?: string;
}

export const mockDisciplinaryData: DisciplinaryModel[] = [
  {
    id: "1",
    memberId: "m1",
    memberName: "أحمد بن علي",
    actionType: "تنبيه",
    incidentDate: "2026-08-10",
    reason: "التأخر المتكرر عن التدريبات",
    status: "منفذ"
  },
  {
    id: "2",
    memberId: "m2",
    memberName: "ياسين كريم",
    actionType: "إنذار",
    incidentDate: "2026-08-15",
    reason: "سلوك غير رياضي أثناء المباراة",
    status: "مفتوح"
  },
  {
    id: "3",
    memberId: "m3",
    memberName: "رياض محرز",
    actionType: "طلب توضيح",
    incidentDate: "2026-08-20",
    reason: "الغياب عن الاجتماع الفني",
    status: "مفتوح"
  },
  {
    id: "4",
    memberId: "m4",
    memberName: "خالد سعيد",
    actionType: "إحالة على الجهة التأديبية المختصة",
    incidentDate: "2026-08-25",
    reason: "شجار مع الحكم",
    status: "ملغى"
  }
];
