import { useState, useEffect } from 'react';
import { Crud } from '../../../core/class/Crud';
import { Applink } from '../../../LinkApi';

export interface OperationItem {
  id: string; // temp id for UI
  equipment_id: string;
  quantity: string;
  condition: string;
}

export const useEquipmentOperationController = () => {
  const [operations, setOperations] = useState<any[]>([]);
  const [equipments, setEquipments] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const crud = new Crud();

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [opsRes, eqRes, memRes] = await Promise.all([
        crud.getData(Applink.equipmentOperations),
        crud.getData(Applink.equipments),
        crud.getData(Applink.individuals),
      ]);
      
      const opsData = opsRes._tag === 'Right' ? opsRes.right : [];
      const eqData = eqRes._tag === 'Right' ? eqRes.right : [];
      const memData = memRes._tag === 'Right' ? memRes.right : [];

      console.log('opsData:', opsData);

      let extractedOps = [];
      if (Array.isArray(opsData)) extractedOps = opsData;
      else if (opsData?.data && Array.isArray(opsData.data)) extractedOps = opsData.data;
      else if (opsData?.equipment_operations && Array.isArray(opsData.equipment_operations)) extractedOps = opsData.equipment_operations;
      else if (opsData?.operations && Array.isArray(opsData.operations)) extractedOps = opsData.operations;

      setOperations(extractedOps);
      setEquipments(Array.isArray(eqData) ? eqData : (eqData?.data && Array.isArray(eqData.data) ? eqData.data : []));
      setMembers(Array.isArray(memData) ? memData : (memData?.data && Array.isArray(memData.data) ? memData.data : []));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const createOperation = async (memberId: string, operationDate: string, sportsSeason: string, items: OperationItem[]) => {
    const payload = {
      member_id: memberId,
      operation_date: operationDate,
      sports_season: sportsSeason,
      items: items.map(i => ({
        equipment_id: i.equipment_id,
        quantity: Number(i.quantity),
        condition: i.condition
      }))
    };
    const res = await crud.postDataheaders(Applink.createEquipmentOperation, payload);
    const data = res._tag === 'Right' ? res.right : res.left;
    if (data && data.message) {
      await fetchInitialData();
      return true;
    }
    return false;
  };

  const returnEquipment = async (movementId: string, returnDate: string, returnCondition: string) => {
    const payload = {
      movement_id: movementId,
      return_date: returnDate,
      return_condition: returnCondition
    };
    const res = await crud.postDataheaders(Applink.returnEquipmentOperation, payload);
    const data = res._tag === 'Right' ? res.right : res.left;
    if (data && data.message) {
      await fetchInitialData();
      return true;
    }
    return false;
  };

  const undoReturnEquipment = async (movementId: string) => {
    const payload = { movement_id: movementId };
    // Assuming backend will have an endpoint for this, we add it to Applink later, 
    // or we use a fallback if it doesn't exist. We'll use undoReturnEquipmentOperation in Applink.
    const res = await crud.postDataheaders((Applink as any).undoReturnEquipmentOperation || `${Applink.server}/equipment-operations/undo-return`, payload);
    const data = res._tag === 'Right' ? res.right : res.left;
    if (data && data.message) {
      await fetchInitialData();
      return true;
    }
    return false;
  };

  const updateOperation = async (id: number | string, memberId: string, operationDate: string, sportsSeason: string, items: OperationItem[]) => {
    const payload = {
      id: id,
      member_id: memberId,
      operation_date: operationDate,
      sports_season: sportsSeason,
      items: items.map(i => ({
        equipment_id: i.equipment_id,
        quantity: Number(i.quantity),
        condition: i.condition
      }))
    };
    const res = await crud.postDataheaders(`${Applink.server}/equipment-operations/update`, payload);
    const data = res._tag === 'Right' ? res.right : res.left;
    if (data && data.message) {
      await fetchInitialData();
      return true;
    }
    return false;
  };

  const deleteOperation = async (id: number | string) => {
    const payload = { id: id };
    const res = await crud.postDataheaders(`${Applink.server}/equipment-operations/delete`, payload);
    const data = res._tag === 'Right' ? res.right : res.left;
    if (data && data.message) {
      await fetchInitialData();
      return true;
    }
    return false;
  };

  return {
    operations,
    equipments,
    members,
    isLoading,
    createOperation,
    updateOperation,
    deleteOperation,
    returnEquipment,
    undoReturnEquipment
  };
};

