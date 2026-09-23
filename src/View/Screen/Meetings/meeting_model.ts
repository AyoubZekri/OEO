export type AttendeeStatus = 'pending' | 'confirmed' | 'absent' | 'حاضر' | 'متأخر' | 'غائب مبرر' | 'غائب غير مبرر';

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
