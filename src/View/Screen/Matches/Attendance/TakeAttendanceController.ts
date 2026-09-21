import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Applink } from '../../../../LinkApi';

export interface PlayerAttendance {
  id: number;
  name: string;
  shirt_number?: string;
  photo?: string;
  status: 'حاضر' | 'متأخر' | 'غائب مبرر' | 'غائب غير مبرر' | null;
  note: string;
}

export interface MatchInfo {
  match_id: number;
  match_date: string;
  location: string;
  start_time: string;
  end_time: string;
  team_name: string;
}

export const useTakeAttendanceController = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [attendanceList, setAttendanceList] = useState<PlayerAttendance[]>([]);
  const [matchInfo, setMatchInfo] = useState<MatchInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchAttendance(id);
  }, [id]);

  const fetchAttendance = async (matchId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${Applink.server}/matches/${matchId}/attendance`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      const data = response.data;
      setMatchInfo({
        match_id: data.match_id,
        match_date: data.match_date,
        location: data.location,
        start_time: data.start_time,
        end_time: data.end_time,
        team_name: data.team_name,
      });
      setAttendanceList(data.players);
    } catch (err: any) {
      const errorMsg = err.response ? JSON.stringify(err.response.data) : err.message;
      console.error("Backend fetch error:", err);
      console.error("Error details:", errorMsg);
      setError(`تعذّر جلب بيانات المباراة أو اللاعبين: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleSave = async () => {
    const unrecorded = attendanceList.filter(p => !p.status);
    if (unrecorded.length > 0) {
      alert(`يرجى تحديد حالة جميع اللاعبين. متبقي ${unrecorded.length} لاعب.`);
      return;
    }

    setIsSaving(true);
    try {
      await axios.post(
        `${Applink.server}/match-attendance/save`,
        {
          match_id: id,
          records: attendanceList.map(p => ({
            player_id: p.id,
            status: p.status,
            note: p.note,
          })),
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      alert('تم حفظ كشف الحضور بنجاح!');
      navigate(-1);
    } catch (err) {
      alert('حدث خطأ أثناء حفظ الكشف.');
    } finally {
      setIsSaving(false);
    }
  };

  const markAll = (status: PlayerAttendance['status']) => {
    setAttendanceList(prev => prev.map(p => ({ ...p, status })));
  };

  const handleBack = () => navigate(-1);

  const stats = {
    total: attendanceList.length,
    present: attendanceList.filter(p => p.status === 'حاضر').length,
    late: attendanceList.filter(p => p.status === 'متأخر').length,
    excused: attendanceList.filter(p => p.status === 'غائب مبرر').length,
    absent: attendanceList.filter(p => p.status === 'غائب غير مبرر').length,
  };

  return {
    matchId: id,
    matchInfo,
    attendanceList,
    isLoading,
    isSaving,
    error,
    stats,
    handleStatusChange,
    handleNoteChange,
    handleSave,
    handleBack,
    markAll,
  };
};
