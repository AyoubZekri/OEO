import { useState, useEffect } from 'react';
import axios from 'axios';
import { Applink } from '../../../LinkApi';
import type { Match } from './match_model';

export type MedicalState = 'healthy' | 'treatment' | 'injured';

/**
 * Players of the match's team with their medical state, and the saved call-ups.
 * Shared by the desktop MatchCallupsDialog and the phone call-ups page.
 */
export const useMatchCallups = (isOpen: boolean, matchData: Match | null, onClose: () => void) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [players, setPlayers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState<Record<number, { notes: string }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const fetchPlayersAndCallups = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      let playersRes: any = null;
      let callupsRes: any = null;
      let medicalsRes: any = null;

      try {
        playersRes = await axios.get(Applink.individuals, { headers });
      } catch (err: any) {
        console.error('Error fetching individuals:', err);
      }

      try {
        callupsRes = await axios.get(Applink.matchCallups(matchData!.id), { headers });
      } catch (err: any) {
        console.error('Error fetching callups:', err);
      }

      try {
        medicalsRes = await axios.get(Applink.medicalRecords, { headers });
      } catch (err: any) {
        console.error('Error fetching medical records:', err);
      }

      if (playersRes && (playersRes.data.status === 'success' || Array.isArray(playersRes.data))) {
        const allInds = Array.isArray(playersRes.data) ? playersRes.data : playersRes.data.data;
        const matchDate = matchData?.match_date ? new Date(matchData.match_date.split('T')[0]) : new Date();
        const medRecords = (medicalsRes?.data?.data || medicalsRes?.data || []);

        const onlyPlayers = allInds.filter((ind: any) => {
          if (!ind) return false;
          const roleName = ind.role?.name ? ind.role.name.trim() : '';
          const isPlayer = roleName === 'لاعب' || ind.type === 'لاعب' || ind.type === 'player';

          const matchTeamId = matchData?.team_id;
          const playerTeamId = ind.team_id || ind.team?.id;

          if (matchTeamId) {
            return isPlayer && playerTeamId === matchTeamId;
          }
          return isPlayer;
        }).map((player: any) => {
          let medicalState: MedicalState = 'healthy';
          let doctorNote = '';

          const pRecords = medRecords.filter((r: any) => {
            const pid = (r.player_id && typeof r.player_id === 'object') ? r.player_id.id : r.player_id;
            return pid == player.id || pid == player.individual_id || pid == player.member_id;
          });
          pRecords.sort((a: any, b: any) => b.id - a.id);

          const latestRecord = pRecords[0];

          if (latestRecord) {
            if (latestRecord.record_status === 'مغلق/متعافي') {
              const date1 = latestRecord.absence_from ? new Date(latestRecord.absence_from.split('T')[0]).getTime() : 0;
              const date2 = latestRecord.absence_to ? new Date(latestRecord.absence_to.split('T')[0]).getTime() : 0;
              const maxDate = Math.max(date1, date2);

              if (maxDate > 0 && matchDate.getTime() <= maxDate) {
                medicalState = 'treatment';
                doctorNote = latestRecord.restrictions || latestRecord.diagnosis || 'مرحلة العلاج - يتطلب الانتباه';
              }
            } else {
              // Any other state ('مفتوح/مصاب', 'بانتظار الفحص النهائي', etc) means strictly injured
              medicalState = 'injured';
            }
          } else if (player.status && typeof player.status === 'string' && player.status.includes('مصاب')) {
            // Fallback: If they have 'مصاب' in their general status but no active medical record
            medicalState = 'injured';
          }

          return { ...player, medicalState, doctorNote };
        });
        setPlayers(onlyPlayers || []);
      }

      const currentSelected: Record<number, { notes: string }> = {};
      if (callupsRes && callupsRes.data) {
        const callupsArray = Array.isArray(callupsRes.data) ? callupsRes.data : (callupsRes.data.data || []);
        callupsArray.forEach((callup: any) => {
          const rawId = callup.player_id || callup.individual_id || callup.individuals_id || callup.member_id || callup.memberId;
          const callupPlayerId = typeof rawId === 'object' && rawId !== null ? rawId.id : rawId;

          if (callupPlayerId) {
            currentSelected[callupPlayerId] = { notes: callup.notes || '' };
          }
        });
      }
      setSelectedPlayers(currentSelected);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load when opened, reset when closed (same behaviour as the original dialog)
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isOpen && matchData) {
      fetchPlayersAndCallups();
    } else {
      setSearchQuery('');
      setSelectedPlayers({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, matchData]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleTogglePlayer = (player: any) => {
    if (player.medicalState === 'injured') return;

    setSelectedPlayers(prev => {
      const newSelected = { ...prev };
      if (newSelected[player.id]) {
        delete newSelected[player.id];
      } else {
        newSelected[player.id] = { notes: player.medicalState === 'treatment' ? player.doctorNote : '' };
      }
      return newSelected;
    });
  };

  /** Calls up every player who is not injured (keeps notes already written) */
  const selectAllAvailable = () => {
    setSelectedPlayers(prev => {
      const next = { ...prev };
      players.filter(p => p.medicalState !== 'injured').forEach(p => {
        if (!next[p.id]) next[p.id] = { notes: p.medicalState === 'treatment' ? p.doctorNote : '' };
      });
      return next;
    });
  };

  const clearAll = () => setSelectedPlayers({});

  const handleNoteChange = (playerId: number, notes: string) => {
    setSelectedPlayers(prev => ({
      ...prev,
      [playerId]: { ...prev[playerId], notes }
    }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!matchData) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const playersArray = Object.entries(selectedPlayers)
        .filter(([, data]) => data !== undefined)
        .map(([id, data]) => ({
          player_id: parseInt(id),
          individual_id: parseInt(id),
          member_id: parseInt(id),
          notes: data.notes || ''
        }));

      const res = await axios.post(Applink.createMatchCallup, {
        match_id: matchData.id,
        players: playersArray
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.status === 'success') {
        onClose();
      }
    } catch (error: any) {
      console.error('Error saving callups:', error);
      const serverMsg = error.response?.data?.message || error.response?.data?.error || error.message || '';
      alert(`حدث خطأ أثناء حفظ الاستدعاءات\n${serverMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const filteredPlayers = players.filter(p =>
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.shirt_number && p.shirt_number.toString().includes(searchQuery)) ||
    (p.Shirt_number && p.Shirt_number.toString().includes(searchQuery))
  );

  return {
    players,
    filteredPlayers,
    searchQuery,
    setSearchQuery,
    selectedPlayers,
    isSubmitting,
    isLoading,
    handleTogglePlayer,
    handleNoteChange,
    handleSubmit,
    selectAllAvailable,
    clearAll,
  };
};
