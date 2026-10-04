import { useCallback, useEffect, useState } from 'react';
import client from '../../../core/api/client';
import type { AgendaItem } from '../../Mobile/MobileMeetings/meetingUtils';
import { meetingPointsApi } from '../Meetings/meetingPointsApi';
import type { MyMeetingDecision } from '../Meetings/MeetingDecisionsList';

/** A meeting I am invited to, as /meetings/mine returns it */
export interface MyMeeting {
  id: string;
  topic: string;
  date: string;
  time: string;
  location: string;
  attendees: { id: string; name: string; status: string }[];
  my_status: string;
  /** The meeting's points in their order: author null = the administration, else the member who sent it */
  points: Omit<AgendaItem, 'key'>[];
  /** Points may still be proposed (the meeting has not started) */
  can_propose: boolean;
  decisions: MyMeetingDecision[];
}

/** Personal space: my meetings, and the discussion points I propose */
export const useMyMeetings = () => {
  const [meetings, setMeetings] = useState<MyMeeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await client.get('/meetings/mine');
      setMeetings(Array.isArray(res.data) ? res.data : []);
    } catch {
      /* the list stays as it was */
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- first load of my meetings
    load();
  }, [load]);

  /** Adds a point (the caller shows the server's message when refused) */
  const addPoint = async (meetingId: string, text: string) => {
    await meetingPointsApi.add(meetingId, text);
    await load();
  };

  const removePoint = async (meetingId: string, item: AgendaItem) => {
    if (await meetingPointsApi.remove(meetingId, item)) await load();
  };

  return { meetings, isLoading, addPoint, removePoint, reload: load };
};
