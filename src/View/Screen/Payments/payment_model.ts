export interface PaymentMember {
  id: string;
  firstName: string;
  lastName: string;
  placeOfBirth: string;
  dateOfBirth: string;
  contractType: string;
  memberRole: string; // صفة العضو
  nationalId: string;
  contractNumber: string;
  phoneNumber: string;
}

export interface PaymentRecord {
  id: string;
  transactionType?: 'دفع' | 'مصروف' | 'مصاريف استثنائية';
  memberId?: string;
  fundId?: string;
  fund_id?: string;
  amount: number;
  paymentMethod: string; // نقدا, تحويل بنكي, صك, حوالة, دفع إلكتروني, أخرى
  paymentDate: string;
  checkNumber?: string;
  amountNature: string; // راتب شهري, نتيجة, تحفيز, إلخ
  installmentNumber?: string; // If amountNature is 'رقم دفعة'
  
  // Conditional fields
  dateFrom?: string; // For 'رقم دفعة'
  dateTo?: string; // For 'رقم دفعة'
  month?: string; // For 'راتب شهري'
  year?: string; // For 'راتب شهري'
  occasion?: string; // For 'اخرى' and others
  numberOfMonths?: number; // For 'راتب شهري'
  numberOfGoals?: number; // For 'تسجيل أهداف'

  notes?: string;
  member?: any;
  postal_check?: string;
  receipt_file?: string | File | null;
  contract_id?: string;
  /** A purchase on credit: amount is what has been paid, creditTotal its full price, creditor who it is owed to */
  isCredit?: boolean;
  creditTotal?: number | null;
  creditor?: string | null;
}
