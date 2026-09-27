import axios from 'axios';
import { Applink } from '../../../LinkApi';

/* eslint-disable @typescript-eslint/no-explicit-any -- the match API returns untyped objects */

export const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
  Accept: 'application/json',
});

export const playerIdOf = (p: any) => p.player_id || p.individual_id || p.id;
export const nameOf = (details: any) => `${details?.first_name || ''} ${details?.last_name || ''}`.trim() || 'غير معروف';
export const numberOf = (details: any) => details?.shirt_number || details?.Shirt_number || '';

/**
 * Called-up players of a match, each with `playerDetails` (same mapping as the desktop dialogs).
 * With `fallbackToAll`, every individual is returned when the match has no call-ups (result dialog rule).
 */
export const loadCalledUp = async (matchId: number, fallbackToAll = false): Promise<any[]> => {
  const headers = authHeaders();
  const [playersRes, callupsRes] = await Promise.all([
    axios.get(Applink.individuals, { headers }).catch(() => null),
    axios.get(Applink.matchCallups(matchId), { headers }).catch(() => null),
  ]);
  const allInds = playersRes && (playersRes.data?.status === 'success' || Array.isArray(playersRes.data))
    ? (Array.isArray(playersRes.data) ? playersRes.data : playersRes.data.data)
    : [];

  if (callupsRes?.data?.status === 'success') {
    return callupsRes.data.data.map((callup: any) => {
      if (callup.player_id && typeof callup.player_id === 'object') {
        return { ...callup, playerDetails: callup.player_id, player_id: callup.player_id.id };
      }
      const id = callup.player_id || callup.individual_id || callup.individuals_id || callup.member_id;
      const playerDetails = allInds.find((ind: any) => String(ind.id) === String(id));
      return { ...callup, playerDetails: playerDetails || { first_name: 'لاعب', last_name: 'غير معروف', id } };
    });
  }
  return fallbackToAll ? allInds.map((ind: any) => ({ playerDetails: ind })) : [];
};

/** Goals and call-ups (with cards, subs and positions) recorded for a match */
export const loadMatchEvents = async (matchId: number): Promise<{ goals: any[]; callups: any[] }> => {
  const res = await axios.get(Applink.matchEvents(matchId), { headers: authHeaders() });
  return { goals: res.data?.data?.goals || [], callups: res.data?.data?.callups || [] };
};

export const errorMessage = (error: any) =>
  error?.response?.data?.message || error?.response?.data?.error || error?.message || '';
/* eslint-enable @typescript-eslint/no-explicit-any */
