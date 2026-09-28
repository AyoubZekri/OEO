/* eslint-disable @typescript-eslint/no-explicit-any -- operations come untyped from the API */

export type EquipmentPrintType = 'handover' | 'return';

// Data of the handover / return receipt of one operation, shared by the desktop and phone print dialogs
export const buildEquipmentReceipt = (operation: any, members: any[], printType: EquipmentPrintType) => {
  // Find full member object from members list to get relations like team_name
  const memberId = operation.member_id || operation.individual?.id || operation.member?.id;
  const fullMember = members.find(m => String(m.id) === String(memberId));

  const memberName = operation.individual
    ? `${operation.individual.first_name} ${operation.individual.last_name}`
    : (operation.member ? `${operation.member.first_name} ${operation.member.last_name}` : '');

  const shirtNumber = operation.individual?.Shirt_number || operation.member?.Shirt_number || operation.individual?.shirt_number || operation.member?.shirt_number || fullMember?.Shirt_number || fullMember?.shirt_number || '';
  const category = fullMember?.team_name || fullMember?.team?.name || operation.individual?.team?.name || operation.member?.team?.name || operation.individual?.category || operation.member?.category || '';

  let itemsToPrint: any[];

  if (printType === 'handover') {
    // For handover, show all items in the operation
    itemsToPrint = (operation.movements || []).map((mov: any) => ({
      name: mov.equipment?.name || '',
      quantity: mov.quantity,
      conditionHandover: mov.condition || mov.delivery_condition || '',
      returnDate: '',
      conditionReturn: ''
    }));
  } else {
    // For return, show only returned items
    itemsToPrint = (operation.movements || [])
      .filter((mov: any) => mov.return_date)
      .map((mov: any) => ({
        name: mov.equipment?.name || '',
        quantity: mov.quantity,
        conditionHandover: mov.condition || mov.delivery_condition || '',
        returnDate: mov.return_date ? new Date(mov.return_date).toLocaleDateString('en-GB') : '',
        conditionReturn: mov.return_condition || ''
      }));
  }

  // Calculate handover date (use operation date)
  const handoverDate = operation.operation_date
    ? new Date(operation.operation_date).toLocaleDateString('en-GB')
    : '';

  return {
    recordNumber: operation.id.toString(),
    season: operation.sports_season || '',
    playerName: memberName,
    shirtNumber: shirtNumber?.toString(),
    category,
    handoverDate,
    items: itemsToPrint,
    printType,
  };
};
/* eslint-enable @typescript-eslint/no-explicit-any */
