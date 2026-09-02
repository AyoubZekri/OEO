import { type CorrespondenceModel } from './correspondence_model';

let mockCorrespondences: CorrespondenceModel[] = [
  {
    id: '1',
    memberId: 1,
    correspondenceNumber: '001/2026',
    date: '2026-08-25',
    subject: 'الغياب عن التدريبات',
    type: 'طلب توضيح',
    text: 'نطلب منكم توضيح أسباب الغياب المتكرر عن التدريبات الأسبوع الماضي...',
    requiredAction: 'الرد خلال 48 ساعة',
    adminName: 'المدير الرياضي',
    status: 'pending',
    createdAt: '2026-08-25T10:00:00Z'
  },
  {
    id: '2',
    memberId: 2,
    correspondenceNumber: '002/2026',
    date: '2026-08-26',
    subject: 'دعوة لاجتماع',
    type: 'استدعاء',
    text: 'ندعوكم لحضور اجتماع الإدارة لمناقشة تجديد العقد...',
    requiredAction: 'الحضور يوم الإثنين القادم',
    adminName: 'رئيس النادي',
    status: 'delivered',
    createdAt: '2026-08-26T14:30:00Z'
  }
];

export const getCorrespondences = (): CorrespondenceModel[] => {
  return [...mockCorrespondences];
};

export const getCorrespondencesByMember = (memberId: number): CorrespondenceModel[] => {
  return mockCorrespondences.filter(c => c.memberId === memberId);
};

export const addCorrespondence = (data: Omit<CorrespondenceModel, 'id' | 'createdAt'>): CorrespondenceModel => {
  const newCorrespondence: CorrespondenceModel = {
    ...data,
    id: Date.now().toString(),
    createdAt: new Date().toISOString()
  };
  mockCorrespondences = [newCorrespondence, ...mockCorrespondences];
  return newCorrespondence;
};

export const updateCorrespondenceStatus = (id: string, status: CorrespondenceModel['status']): void => {
  mockCorrespondences = mockCorrespondences.map(c => 
    c.id === id ? { ...c, status } : c
  );
};

export const deleteCorrespondence = (id: string): void => {
  mockCorrespondences = mockCorrespondences.filter(c => c.id !== id);
};
