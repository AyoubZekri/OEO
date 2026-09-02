export interface CorrespondenceModel {
  id: string;
  memberId: number;
  correspondenceNumber: string;
  date: string;
  subject: string;
  type: string;
  otherType?: string;
  text: string;
  requiredAction: string;
  adminName: string;
  status: 'pending' | 'delivered' | 'closed';
  createdAt: string;
}
