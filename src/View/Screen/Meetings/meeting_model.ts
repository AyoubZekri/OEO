export type AttendeeStatus = 'pending' | 'confirmed' | 'absent' | 'حاضر' | 'متأخر' | 'غائب مبرر' | 'غائب غير مبرر';

export interface Attendee {
  id: string;
  name: string;
  status: AttendeeStatus;
  reason?: string;
}

/** A point sent by a member concerned by the meeting, kept with who sent it */
export interface SentMeetingPoint {
  id: string;
  text: string;
  author: string;
  user_id?: number;
  member_id?: number | null;
  created_at?: string;
}

/** A meeting's point: the administration's text, or a point sent by a member */
export type MeetingPoint = string | SentMeetingPoint;

export interface Meeting {
  id: string;
  topic: string;
  date: string;
  time: string;
  location: string;
  attendees: Attendee[];
  points: MeetingPoint[];
}
