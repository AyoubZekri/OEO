import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import client from '../../../../core/api/client';

export type MeetingAttendeeStatus = 'حاضر' | 'متأخر' | 'غائب مبرر' | 'غائب غير مبرر' | null;

export interface MeetingAttendeeFull {
  id: string;
  name: string;
  role?: string;
  status: MeetingAttendeeStatus;
  note: string;
}

export interface MeetingInfo {
  id: string;
  topic: string;
  date: string;
  time: string;
  location: string;
}

export const useTakeMeetingAttendanceController = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [attendanceList, setAttendanceList] = useState<MeetingAttendeeFull[]>([]);
  const [meetingInfo, setMeetingInfo] = useState<MeetingInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchMeeting(id);
  }, [id]);

  const fetchMeeting = async (meetingId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await client.get(`/meetings/${meetingId}`);
      const data = response.data;

      setMeetingInfo({
        id: data.id,
        topic: data.topic,
        date: data.date,
        time: data.time,
        location: data.location,
      });

      const validStatuses: MeetingAttendeeStatus[] = ['حاضر', 'متأخر', 'غائب مبرر', 'غائب غير مبرر'];
      const mapped: MeetingAttendeeFull[] = (data.attendees || []).map((a: any) => ({
        id: String(a.id),
        name: a.name,
        role: a.role || '',
        status: validStatuses.includes(a.status) ? a.status : null,
        note: a.reason || '',
      }));
      setAttendanceList(mapped);
    } catch (err: any) {
      const errorMsg = err.response ? JSON.stringify(err.response.data) : err.message;
      setError(`تعذّر جلب بيانات الاجتماع: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = (attendeeId: string, newStatus: MeetingAttendeeStatus) => {
    setAttendanceList(prev =>
      prev.map(a => a.id === attendeeId ? { ...a, status: newStatus } : a)
    );
  };

  const handleNoteChange = (attendeeId: string, newNote: string) => {
    setAttendanceList(prev =>
      prev.map(a => a.id === attendeeId ? { ...a, note: newNote } : a)
    );
  };

  const handleSave = async () => {
    const unrecorded = attendanceList.filter(a => !a.status);
    if (unrecorded.length > 0) {
      alert(`يرجى تحديد حالة جميع الأعضاء. متبقي ${unrecorded.length} عضو.`);
      return;
    }

    setIsSaving(true);
    try {
      // 1. Update the meeting attendees list
      const updatedAttendees = attendanceList.map(a => ({
        id: a.id,
        name: a.name,
        status: a.status,
        reason: a.note,
      }));

      await client.put(`/meetings/${id}`, {
        ...meetingInfo,
        attendees: updatedAttendees,
      });

      // 2. Create absence records for absent/late members automatically
      const absentOrLate = attendanceList.filter(
        a => a.status === 'غائب مبرر' || a.status === 'غائب غير مبرر' || a.status === 'متأخر'
      );

      if (absentOrLate.length > 0 && meetingInfo) {
        const absencePromises = absentOrLate.map(a =>
          client.post('/absences/create', {
            player_id: a.id,
            absence_type: a.status === 'متأخر' ? 'تأخر' : 'غياب',
            event_category: 'اجتماع',
            event_date: meetingInfo.date,
            meeting_id: id,
            meeting_topic: meetingInfo.topic,
            reason: a.note || '',
            justification_status: a.status === 'غائب مبرر' ? 'مقبول' : 'لا_يوجد',
            is_justified: a.status === 'غائب مبرر',
            record_source: 'اجتماع',
          }).catch(() => null) // Ignore duplicate errors if they already exist
        );
        await Promise.all(absencePromises);
      }

      alert('تم حفظ كشف الحضور بنجاح!');
      navigate(-1);
    } catch (err) {
      alert('حدث خطأ أثناء حفظ الكشف.');
    } finally {
      setIsSaving(false);
    }
  };

  const markAll = (status: MeetingAttendeeStatus) => {
    setAttendanceList(prev => prev.map(a => ({ ...a, status })));
  };

  const handleBack = () => navigate(-1);

  const stats = {
    total: attendanceList.length,
    present: attendanceList.filter(a => a.status === 'حاضر').length,
    late: attendanceList.filter(a => a.status === 'متأخر').length,
    excused: attendanceList.filter(a => a.status === 'غائب مبرر').length,
    absent: attendanceList.filter(a => a.status === 'غائب غير مبرر').length,
  };

  return {
    meetingId: id,
    meetingInfo,
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
