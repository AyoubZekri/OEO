import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export interface PlayerAttendance {
  id: number;
  name: string;
  status: 'حاضر' | 'متأخر' | 'غائب مبرر' | 'غائب غير مبرر' | null;
  note: string;
}

export const useTakeAttendanceController = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Mock data for players
  const [attendanceList, setAttendanceList] = useState<PlayerAttendance[]>([
    { id: 1, name: 'أحمد بن علي', status: null, note: '' },
    { id: 2, name: 'خالد مرزوق', status: null, note: '' },
    { id: 3, name: 'ياسين براهيمي', status: null, note: '' },
    { id: 4, name: 'محمد الأمين', status: null, note: '' },
    { id: 5, name: 'رياض محرز', status: null, note: '' },
  ]);

  const handleStatusChange = (playerId: number, newStatus: PlayerAttendance['status']) => {
    setAttendanceList(prev => 
      prev.map(player => 
        player.id === playerId ? { ...player, status: newStatus } : player
      )
    );
  };

  const handleNoteChange = (playerId: number, newNote: string) => {
    setAttendanceList(prev => 
      prev.map(player => 
        player.id === playerId ? { ...player, note: newNote } : player
      )
    );
  };

  const handleSave = () => {
    // Check if everyone has a status
    const unrecorded = attendanceList.filter(p => !p.status);
    if (unrecorded.length > 0) {
      alert(`يرجى تحديد حالة جميع اللاعبين. متبقي ${unrecorded.length} لاعب.`);
      return;
    }

    console.log('Saved attendance for session:', id, attendanceList);
    alert('تم حفظ كشف الحضور بنجاح!');
    navigate(-1); // go back
  };

  const handleBack = () => {
    navigate(-1);
  };

  return {
    sessionId: id,
    attendanceList,
    handleStatusChange,
    handleNoteChange,
    handleSave,
    handleBack
  };
};
