// Arabic labels of member types and player positions, shared by the phone pages

// The posts from the most to the least important (the staff's dropdowns follow this order)
export const TYPE_LABELS: Record<string, string> = {
  player: 'لاعب',
  supervisor: 'المشرف',
  general_coordinator: 'المنسق العام',
  admin: 'إداري',
  accountant: 'محاسب',
  coach: 'مدرب',
  assistant_coach: 'مساعد مدرب',
  goalkeeper_coach: 'مدرب حراس',
  physical_trainer: 'محضر بدني',
  doctor: 'طبيب',
  equipment_manager: 'مسؤول العتاد',
  employee: 'موظف',
};

export const POSITION_LABELS: Record<string, string> = {
  GK: 'حارس مرمى',
  CB: 'قلب دفاع',
  SW: 'ليبرو',
  RB: 'ظهير أيمن',
  LB: 'ظهير أيسر',
  RWB: 'ظهير جناح أيمن',
  LWB: 'ظهير جناح أيسر',
  CDM: 'وسط دفاعي',
  CM: 'وسط محوري',
  CAM: 'صانع ألعاب',
  RM: 'وسط أيمن',
  LM: 'وسط أيسر',
  RW: 'جناح أيمن',
  LW: 'جناح أيسر',
  SS: 'مهاجم ثانٍ',
  CF: 'قلب هجوم',
  ST: 'رأس حربة',
};
