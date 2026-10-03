import axios from 'axios';
import { Applink } from '../../../LinkApi';

export interface TrainingSessionModel {
  id?: number;
  team_id?: string;
  team_name?: string;
  date: string;
  location: string;
  start: string;
  end: string;
  status: string;
  attendance_stats?: {
    total: number;
    present: number;
    absent: number;
  };
  /** Personal space: my absence / late record in this session (null when none) */
  my_absence?: string | null;
  my_absence_note?: string;
}

export const TrainingSessionData = {
  getSessions: async (teamId?: string): Promise<TrainingSessionModel[]> => {
    try {
      const ts = Date.now();
      const url = teamId 
        ? `${Applink.server}/training-sessions?team_id=${teamId}&t=${ts}`
        : `${Applink.server}/training-sessions?t=${ts}`;
        
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching training sessions:', error);
      throw error;
    }
  },

  /** Personal space: the sessions of my category, with my attendance */
  getMySessions: async (): Promise<TrainingSessionModel[]> => {
    const response = await axios.get(`${Applink.server}/training-sessions/mine?t=${Date.now()}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  },

  saveSession: async (session: TrainingSessionModel): Promise<any> => {
    try {
      const isUpdate = !!session.id;
      const url = isUpdate 
        ? `${Applink.server}/training-sessions/update` 
        : `${Applink.server}/training-sessions/create`;
        
      const response = await axios.post(url, session, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error saving training session:', error);
      throw error;
    }
  },

  deleteSession: async (id: number): Promise<any> => {
    try {
      const response = await axios.post(`${Applink.server}/training-sessions/delete`, { id }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting training session:', error);
      throw error;
    }
  },

  updateStatus: async (id: number, status: string): Promise<any> => {
    try {
      const response = await axios.post(`${Applink.server}/training-sessions/update-status`, { id, status }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating session status:', error);
      throw error;
    }
  }
};

