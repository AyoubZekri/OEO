export interface DisciplinaryModel {
  id: string;
  memberId: string;
  memberName: string;
  actionType: 'تنبيه' | 'إنذار' | 'طلب توضيح' | 'إحالة على الجهة التأديبية المختصة';
  incidentDate: string;
  reason: string;
  status: 'مفتوح' | 'منفذ' | 'ملغى';
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
