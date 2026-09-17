import { useState, useEffect } from 'react';
import client from '../../../core/api/client';
import type { Meeting, Attendee, AttendeeStatus } from './meeting_model';
import { mockEmployees } from './meetings_data';

export function useMeetingsController() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [topic, setTopic] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [points, setPoints] = useState<string[]>([]);
  const [newAttendeeName, setNewAttendeeName] = useState('');
  const [newPoint, setNewPoint] = useState('');
  const [activeReasonModal, setActiveReasonModal] = useState<{meetingId: string, attendeeId: string} | null>(null);
  const [absenceReason, setAbsenceReason] = useState('');
  const [expandedMeetingId, setExpandedMeetingId] = useState<string | null>(null);

  const fetchMeetings = async () => {
    try {
      const response = await client.get('/meetings');
      setMeetings(response.data);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const openEditor = (meeting?: Meeting) => {
    if (meeting) {
      setEditingId(meeting.id);
      setTopic(meeting.topic);
      setDate(meeting.date);
      setTime(meeting.time);
      setLocation(meeting.location);
      setAttendees(meeting.attendees || []);
      setPoints(meeting.points || []);
    } else {
      setEditingId(null);
      setTopic('');
      setDate('');
      setTime('');
      setLocation('');
      setAttendees([]);
      setPoints([]);
    }
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    setEditingId(null);
  };

  const saveMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    const meetingData = {
      topic,
      date,
      time,
      location,
      attendees,
      points
    };

    try {
      if (editingId) {
        await client.put(`/meetings/${editingId}`, meetingData);
      } else {
        await client.post('/meetings', meetingData);
      }
      fetchMeetings();
      closeEditor();
    } catch (error) {
      console.error('Error saving meeting:', error);
    }
  };

  const deleteMeeting = async (id: string) => {
    try {
      await client.delete(`/meetings/${id}`);
      setMeetings(meetings.filter(m => m.id !== id));
    } catch (error) {
      console.error('Error deleting meeting:', error);
    }
  };

  const changeAttendeeStatus = async (meetingId: string, attendeeId: string, status: AttendeeStatus, reason?: string) => {
    const meeting = meetings.find(m => m.id === meetingId);
    if (!meeting) return;
    
    const updatedAttendees = (meeting.attendees || []).map(a => 
      a.id === attendeeId ? { ...a, status, reason: reason || a.reason } : a
    );
    
    try {
      await client.put(`/meetings/${meetingId}`, { ...meeting, attendees: updatedAttendees });
      setMeetings(meetings.map(m => m.id === meetingId ? { ...m, attendees: updatedAttendees } : m));
    } catch (error) {
      console.error('Error updating attendee status:', error);
    }
  };

  const openAdd = () => openEditor();
  const openEdit = (meeting: Meeting) => openEditor(meeting);
  const handleSave = saveMeeting;
  const handleDelete = deleteMeeting;

  const toggleEmployee = (id: string, name: string) => {
    setAttendees(prev => {
      const exists = prev.find(a => a.id === id);
      if (exists) {
        return prev.filter(a => a.id !== id);
      } else {
        return [...prev, { id, name, status: 'pending' as AttendeeStatus }];
      }
    });
  };

  const handleRemoveAttendee = (id: string) => {
    setAttendees(prev => prev.filter(a => a.id !== id));
  };

  const handleAddPoint = () => {
    if (newPoint.trim()) {
      setPoints([...points, newPoint.trim()]);
      setNewPoint('');
    }
  };

  const handleRemovePoint = (index: number) => {
    setPoints(points.filter((_, i) => i !== index));
  };

  const submitAbsence = () => {
    if (activeReasonModal) {
      changeAttendeeStatus(activeReasonModal.meetingId, activeReasonModal.attendeeId, 'absent', absenceReason);
      setActiveReasonModal(null);
      setAbsenceReason('');
    }
  };

  return {
    meetings,
    isEditorOpen,
    editingId,
    topic, setTopic,
    date, setDate,
    time, setTime,
    location, setLocation,
    attendees, setAttendees,
    points, setPoints,
    openAdd,
    openEdit,
    closeEditor,
    handleSave,
    handleDelete,
    changeAttendeeStatus,
    mockEmployees,
    
    newAttendeeName, setNewAttendeeName,
    newPoint, setNewPoint,
    activeReasonModal, setActiveReasonModal,
    absenceReason, setAbsenceReason,
    expandedMeetingId, setExpandedMeetingId,
    toggleEmployee,
    handleRemoveAttendee,
    handleAddPoint,
    handleRemovePoint,
    submitAbsence
  };
}

