import { useEffect, useState } from 'react';
import axios from 'axios';
import { Applink } from '../../../LinkApi';
import type { PlayerClearance } from './member_model';
import { useAuth } from '../../../core/context/AuthContext';

export type ClearanceStageId = 'general' | 'admin' | 'sporting' | 'medical' | 'financial' | 'equipment' | 'player';

export const CLEARANCE_STAGE_IDS: ClearanceStageId[] = ['general', 'admin', 'sporting', 'medical', 'financial', 'equipment', 'player'];

export const CLEARANCE_REASON_OPTIONS = [
  { value: 'انتهاء العقد بالتراضي', label: 'انتهاء العقد بالتراضي' },
  { value: 'إعارة', label: 'إعارة' },
  { value: 'انتقال', label: 'انتقال' },
  { value: 'فسخ عقد', label: 'فسخ عقد' },
];

export interface EquipmentMovement {
  return_date?: string | null;
  quantity?: number;
  name?: string;
  equipment_name?: string;
  equipment?: { name?: string };
}

interface EquipmentOperation {
  member_id?: string | number;
  individual_id?: string | number;
  movements?: EquipmentMovement[];
}

interface PaymentLike {
  type?: string;
  category?: string;
  status?: string;
}

interface StaffUser {
  id: string | number;
  name?: string;
}

interface RequestError {
  response?: { data?: { errors?: unknown; message?: string } };
}

// Field holding the id of whoever signed each department
const SIGNEE_FIELD: Partial<Record<ClearanceStageId, keyof PlayerClearance>> = {
  admin: 'admin_id',
  sporting: 'sporting_director_id',
  financial: 'finance_manager_id',
  equipment: 'equipment_manager_id',
  medical: 'medical_staff_id',
};

/**
 * Clearance ("إخلاء الطرف") card of a member: loading, signing each department and deleting.
 * Shared by the desktop ClearanceDialog and the phone MobileClearance.
 */
export const useClearance = (
  player: { id: string | number },
  isOpen: boolean,
  { onUpdate, onClose, onGeneralSaved }: { onUpdate?: () => void; onClose: () => void; onGeneralSaved?: () => void }
) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Partial<PlayerClearance>>({
    player_id: Number(player?.id),
    exit_date: '',
    exit_reason: '',
    general_notes: '',
  });

  // Starts in the loading state because the card is fetched as soon as it opens
  const [isLoading, setIsLoading] = useState(isOpen);
  const [isSaving, setIsSaving] = useState(false);
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [equipmentData, setEquipmentData] = useState<EquipmentOperation[]>([]);
  const [loansData, setLoansData] = useState<PaymentLike[]>([]);
  const [remainingPayments, setRemainingPayments] = useState<PaymentLike[]>([]);

  const fetchClearanceData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(Applink.getPlayerClearance(Number(player.id)), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === 'success' && res.data.data) {
        const data = res.data.data;
        setFormData({
          ...data,
          exit_date: data.exit_date?.split('T')[0] || '',
          equipment_cleared_at: data.equipment_cleared_at?.split('T')[0] || '',
          admin_cleared_at: data.admin_cleared_at?.split('T')[0] || '',
          sporting_cleared_at: data.sporting_cleared_at?.split('T')[0] || '',
          finance_cleared_at: data.finance_cleared_at?.split('T')[0] || '',
          medical_cleared_at: data.medical_cleared_at?.split('T')[0] || '',
          player_signed_at: data.player_signed_at?.split('T')[0] || '',
          equipment_manager_id: data.equipment_manager_id?.toString() || '',
          admin_id: data.admin_id?.toString() || '',
          sporting_director_id: data.sporting_director_id?.toString() || '',
          finance_manager_id: data.finance_manager_id?.toString() || '',
          medical_staff_id: data.medical_staff_id?.toString() || '',
        });
      } else {
        setFormData({ player_id: Number(player?.id), exit_date: '', exit_reason: '', general_notes: '' });
      }
    } catch (error) {
      console.error('Error fetching clearance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStaffList = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(Applink.users, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === 'success') {
        setStaffList(res.data.data);
      } else {
        setStaffList(res.data || []);
      }
    } catch (error) {
      console.error('Error fetching staff list:', error);
    }
  };

  const fetchExtraData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [eqRes, payRes] = await Promise.allSettled([
        axios.get(`${Applink.equipmentOperations}?player_id=${player.id}`, { headers }),
        axios.get(`${Applink.payments}?player_id=${player.id}`, { headers }),
      ]);

      if (eqRes.status === 'fulfilled') {
        const rawEqData = eqRes.value.data?.data || eqRes.value.data || [];
        const eqData: EquipmentOperation[] = Array.isArray(rawEqData)
          ? rawEqData.filter((op: EquipmentOperation) => String(op.member_id) === String(player.id) || String(op.individual_id) === String(player.id))
          : [];
        setEquipmentData(eqData);
      }

      if (payRes.status === 'fulfilled') {
        const payData = payRes.value.data?.data || payRes.value.data || [];
        if (Array.isArray(payData)) {
          const loans = payData.filter((p: PaymentLike) => p.type === 'سلفة' || p.type === 'loan' || p.category === 'loan');
          const remaining = payData.filter((p: PaymentLike) => p.status === 'متبقي' || p.status === 'pending' || p.status === 'unpaid');
          setLoansData(loans);
          setRemainingPayments(remaining);
        }
      }
    } catch (error) {
      console.error('Error fetching extra data:', error);
    }
  };

  useEffect(() => {
    if (!isOpen || !player) return;
    // Data fetch on open: every state update happens after its request resolves
    // eslint-disable-next-line react-hooks/set-state-in-effect
    Promise.all([fetchClearanceData(), fetchStaffList(), fetchExtraData()]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, player]);

  const checkIsComplete = (stageId: string) => {
    if (stageId === 'general') return !!formData.exit_date;
    if (stageId === 'admin') return formData.admin_status === 'مكتمل';
    if (stageId === 'sporting') return formData.sporting_status === 'مكتمل';
    if (stageId === 'medical') return formData.medical_status === 'مكتمل';
    if (stageId === 'financial') return formData.financial_status === 'مكتمل';
    if (stageId === 'equipment') return formData.equipment_status === 'مكتمل';
    if (stageId === 'player') return !!formData.player_signature;
    return false;
  };

  const hasCard = !!formData.exit_date || !!formData.id;
  const completedCount = CLEARANCE_STAGE_IDS.filter(id => checkIsComplete(id)).length;
  const progressPercent = Math.round((completedCount / CLEARANCE_STAGE_IDS.length) * 100);

  const handleSign = async (department: string) => {
    if (department === 'general' && (!formData.exit_date || !formData.exit_reason)) {
      alert('الرجاء تعبئة تاريخ وسبب المغادرة');
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const now = new Date().toISOString().split('T')[0];
      const updates: Record<string, string | number | boolean | null | undefined> = { player_id: player.id };

      if (department === 'general') {
        updates.exit_date = formData.exit_date;
        updates.exit_reason = formData.exit_reason;
        updates.general_notes = formData.general_notes;
      } else if (department === 'admin') {
        updates.admin_status = 'مكتمل';
        updates.admin_id = user?.id ? parseInt(user.id) : null;
        updates.admin_cleared_at = now;
      } else if (department === 'sporting') {
        updates.sporting_status = 'مكتمل';
        updates.sporting_director_id = user?.id ? parseInt(user.id) : null;
        updates.sporting_cleared_at = now;
      } else if (department === 'medical') {
        updates.medical_status = 'مكتمل';
        updates.medical_staff_id = user?.id ? parseInt(user.id) : null;
        updates.medical_cleared_at = now;
      } else if (department === 'financial') {
        updates.financial_status = 'مكتمل';
        updates.finance_manager_id = user?.id ? parseInt(user.id) : null;
        updates.finance_cleared_at = now;
      } else if (department === 'equipment') {
        updates.equipment_status = 'مكتمل';
        updates.equipment_manager_id = user?.id ? parseInt(user.id) : null;
        updates.equipment_cleared_at = now;
      } else if (department === 'player') {
        updates.player_signature = true;
        updates.player_signed_at = now;
      }

      await axios.post(Applink.savePlayerClearance, updates, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // The player's own signature closes the card: the member becomes inactive
      if (department === 'player') {
        try {
          await axios.post(Applink.updateIndividual, { id: player.id, status: 'inactive' }, {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
          });
          if (onUpdate) onUpdate();
        } catch (e) {
          console.error('Failed to change member status to inactive', e);
        }
      }

      if (department === 'general') {
        onGeneralSaved?.();
      } else {
        alert('تم التوقيع بنجاح');
      }

      fetchClearanceData();
    } catch (error) {
      const details = (error as RequestError).response?.data;
      if (details?.errors) {
        console.error('Validation Error Details:', details.errors);
      } else {
        console.error('Error signing clearance:', error);
      }
      alert(details?.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('هل أنت متأكد من حذف بطاقة الإخلاء بالكامل؟ (لا يمكن التراجع)')) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(Applink.deletePlayerClearance(Number(player.id)), {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
      });

      // Cancelling the clearance makes the member active again
      try {
        await axios.post(Applink.updateIndividual, { id: player.id, status: 'active' }, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
        });
        if (onUpdate) onUpdate();
      } catch (e) {
        console.error('Failed to restore member status to active', e);
      }

      onClose();
    } catch (error) {
      console.error('Error deleting clearance:', error);
      alert('حدث خطأ أثناء الحذف');
    } finally {
      setIsSaving(false);
    }
  };

  const getSigneeName = (id: string | undefined | null) => {
    if (!id) return '—';
    return staffList.find(s => s.id.toString() === id.toString())?.name || id;
  };

  const signeeOf = (stageId: ClearanceStageId) => {
    const field = SIGNEE_FIELD[stageId];
    return field ? getSigneeName(formData[field]?.toString()) : '—';
  };

  return {
    formData,
    setFormData,
    isLoading,
    isSaving,
    staffList,
    equipmentData,
    loansData,
    remainingPayments,
    checkIsComplete,
    hasCard,
    completedCount,
    progressPercent,
    handleSign,
    handleDelete,
    getSigneeName,
    signeeOf,
  };
};
