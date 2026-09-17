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
  location: string;
  attendees: Attendee[];
  points: string[];
}
