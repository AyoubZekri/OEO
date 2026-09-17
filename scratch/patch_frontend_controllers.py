import os

frontend_path = r"d:\MyProject\KaidNews\OlympicOEO\src\View\Screen"

meeting_controller = os.path.join(frontend_path, r"Meetings\MeetingsController.ts")
decision_controller = os.path.join(frontend_path, r"Decisions\DecisionsController.ts")

meeting_content = """import { useState, useEffect } from 'react';
import client from '../../../core/api/client';

export const mockEmployees = [
  { id: '1', name: 'أحمد بن علي', role: 'صحفي' },
  { id: '2', name: 'محمد صالح', role: 'مراسل' },
  { id: '3', name: 'سارة خالد', role: 'محررة' },
  { id: '4', name: 'بن سالم بريك', role: 'المكلف بالعتاد و الاستديو' }
];

export type AttendeeStatus = 'pending' | 'confirmed' | 'absent';

export interface Attendee {
  id: string;
  name: string;
  status: AttendeeStatus;
  reason?: string;
}

export interface Meeting {
  id: string;
  topic: string;
  date: string;
  time: string;
  room: string;
  attendees: Attendee[];
  points: string[];
}

export function useMeetingsController() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [topic, setTopic] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [room, setRoom] = useState('');
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [points, setPoints] = useState<string[]>([]);
  
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
      setRoom(meeting.room);
      setAttendees(meeting.attendees || []);
      setPoints(meeting.points || []);
    } else {
      setEditingId(null);
      setTopic('');
      setDate('');
      setTime('');
      setRoom('');
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
      room,
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

  return {
    meetings,
    isEditorOpen,
    editingId,
    topic, setTopic,
    date, setDate,
    time, setTime,
    room, setRoom,
    attendees, setAttendees,
    points, setPoints,
    openEditor,
    closeEditor,
    saveMeeting,
    deleteMeeting,
    changeAttendeeStatus
  };
}
"""

decision_content = """import { useState, useEffect } from 'react';
import client from '../../../core/api/client';

export type DecisionStatus = 'pending' | 'in-progress' | 'completed';

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface Decision {
  id: string;
  meeting_id: string;
  category?: string;
  type?: 'normal' | 'checklist';
  checklist_items?: ChecklistItem[];
  text: string;
  assignee_ids: string[];
  deadline?: string;
  progress: number; // 0 to 100
}

export function useDecisionsController() {
  const [decisions, setDecisions] = useState<Decision[]>([]);

  const fetchDecisions = async () => {
    try {
      const response = await client.get('/decisions');
      setDecisions(response.data);
    } catch (error) {
      console.error('Error fetching decisions:', error);
    }
  };

  useEffect(() => {
    fetchDecisions();
  }, []);

  const addDecision = async (decision: Omit<Decision, 'id'>) => {
    try {
      await client.post('/decisions', decision);
      fetchDecisions();
    } catch (error) {
      console.error('Error adding decision:', error);
    }
  };

  const updateDecision = async (id: string, updatedFields: Partial<Decision>) => {
    try {
      await client.put(`/decisions/${id}`, updatedFields);
      setDecisions(decisions.map(d => d.id === id ? { ...d, ...updatedFields } : d));
    } catch (error) {
      console.error('Error updating decision:', error);
    }
  };

  const deleteDecision = async (id: string) => {
    try {
      await client.delete(`/decisions/${id}`);
      setDecisions(decisions.filter(d => d.id !== id));
    } catch (error) {
      console.error('Error deleting decision:', error);
    }
  };

  const updateProgress = (id: string, newProgress: number) => {
    const clampedProgress = Math.min(100, Math.max(0, newProgress));
    updateDecision(id, { progress: clampedProgress });
  };

  return {
    decisions,
    addDecision,
    updateDecision,
    deleteDecision,
    updateProgress
  };
}
"""

with open(meeting_controller, "w", encoding="utf-8", newline="\n") as f:
    f.write(meeting_content)

with open(decision_controller, "w", encoding="utf-8", newline="\n") as f:
    f.write(decision_content)

print("Frontend controllers patched successfully.")
