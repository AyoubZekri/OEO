export class EquipmentModel {
  id: string;
  name: string;
  totalQuantity: number;
  availableQuantity: number;
  image?: string | null;
  holders: any[];
  movements: any[];

  constructor({ 
    id, 
    name, 
    totalQuantity, 
    availableQuantity, 
    image, 
    holders,
    movements 
  }: { 
    id: string; 
    name: string; 
    totalQuantity: number; 
    availableQuantity: number; 
    image?: string | null; 
    holders?: any[];
    movements?: any[];
  }) {
    this.id = id;
    this.name = name;
    this.totalQuantity = totalQuantity;
    this.availableQuantity = availableQuantity;
    this.image = image;
    this.holders = holders || [];
    this.movements = movements || [];
  }

  static fromJson(json: any): EquipmentModel {
    const tQty = json.totalQuantity ?? json.total_quantity ?? json.quantity ?? 0;
    const aQty = json.availableQuantity ?? json.available_quantity ?? tQty;
    
    const movements = json.movements || [];
    // Calculate holders: members who currently have 'تسليم' (delivered) movements for this equipment
    // Group by member to sum quantities if a member took the same equipment multiple times
    const holdersMap = new Map<string, any>();
    
    movements.forEach((mov: any) => {
      if (mov.movement_status === 'تسليم' && mov.operation && mov.operation.member) {
        const member = mov.operation.member;
        const memberId = member.id.toString();
        const existing = holdersMap.get(memberId);
        
        if (existing) {
          existing.quantity += mov.quantity;
          existing.last_date = mov.delivery_date > existing.last_date ? mov.delivery_date : existing.last_date;
        } else {
          holdersMap.set(memberId, {
            id: memberId,
            name: `${member.first_name} ${member.last_name}`,
            quantity: mov.quantity,
            last_date: mov.delivery_date,
            photo: member.photo
          });
        }
      }
    });

    return new EquipmentModel({
      id: json.id?.toString() || '',
      name: json.name || '',
      totalQuantity: Number(tQty) || 0,
      availableQuantity: Number(aQty) || 0,
      image: json.image,
      holders: Array.from(holdersMap.values()),
      movements: movements
    });
  }

  toJson(): any {
    return {
      id: this.id,
      name: this.name,
      total_quantity: this.totalQuantity,
      available_quantity: this.availableQuantity,
      image: this.image,
      holders: this.holders,
      movements: this.movements
    };
  }
}
