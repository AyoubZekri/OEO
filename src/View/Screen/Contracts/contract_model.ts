export class ContractModel {
  id: string;
  individuals_id: string;
  beneficiary: string;
  contractType: string;
  contractNumber: string; // From the user's note: this should be the id
  startDate: string;
  endDate: string;
  contractValue: number;
  paymentMethod: string;
  numberOfPayments: number;
  paymentValue: number;
  monthlySalary: number;
  winBonus: number;
  goalsBonus: number;
  notes: string;
  status: string;
  entitlements: any[]; // Assuming entitlements aren't fully implemented in the backend yet, we'll keep it empty or mock it
  installments?: { installment_number: string, amount: number }[];

  constructor(data: any) {
    this.id = data.id?.toString() || '';
    this.individuals_id = data.individuals_id?.toString() || '';
    
    // Beneficiary name from relationship
    if (data.individual) {
      this.beneficiary = `${data.individual.first_name || ''} ${data.individual.last_name || ''}`.trim();
      
      // Determine contract type from individual type
      if (data.individual.type === 'player') this.contractType = 'لاعب';
      else if (data.individual.type === 'coach') this.contractType = 'مدرب';
      else this.contractType = 'موظف / إداري / طبيب';
    } else {
      this.beneficiary = 'مستفيد غير معروف';
      this.contractType = 'غير محدد';
    }

    // "ملاحضة رقم العقد هو رقم id تع السجل" -> Contract number is the ID
    this.contractNumber = this.id.padStart(4, '0');
    
    this.startDate = data.start_date ? data.start_date.split('T')[0] : '';
    this.endDate = data.end_date ? data.end_date.split('T')[0] : '';
    this.contractValue = Number(data.Contract_value) || 0;
    this.numberOfPayments = Number(data.Number_payments) || 1;
    this.monthlySalary = Number(data.Monthly_Salary) || 0;
    this.winBonus = Number(data.Winning_Bonus) || 0;
    this.goalsBonus = Number(data.Goals_Bonus) || 0;
    this.notes = data.nots || '';
    this.status = data.status || 'active';
    
    // Calculated fields
    this.paymentMethod = 'شهري';
    this.paymentValue = this.numberOfPayments > 0 ? this.contractValue / this.numberOfPayments : 0;
    
    // For now, no entitlements from backend, we might generate them on the fly if needed
    this.entitlements = [];
    
    this.installments = data.installments ? data.installments.map((inst: any) => ({
      installment_number: inst.installment_number,
      amount: Number(inst.amount) || 0
    })) : [];
  }

  static fromJson(json: any): ContractModel {
    return new ContractModel(json);
  }
}
