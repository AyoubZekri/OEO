import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Applink } from '../../../LinkApi';
import type { Match } from './match_model';
import { FORMATIONS } from './Lineup/FormationConfig';

/* eslint-disable @typescript-eslint/no-explicit-any -- call-ups and players come untyped from the API */

/**
 * Called-up players of a match and everything the FootballPitch needs to show / save the line-up.
 * Shared by the desktop ViewMatchCallupsDialog and the phone line-up page.
 */
export const useMatchLineup = (isOpen: boolean, matchData: Match | null) => {
  const [calledUpPlayers, setCalledUpPlayers] = useState<any[]>([]);
  // Starts loading when mounted already open (phone page), so no empty state flashes first
  const [isLoading, setIsLoading] = useState(isOpen && !!matchData);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCalledUpPlayers = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      };

      let playersRes: any = null;
      let callupsRes: any = null;

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

      const allInds = (playersRes && (playersRes.data.status === 'success' || Array.isArray(playersRes.data)))
          ? (Array.isArray(playersRes.data) ? playersRes.data : playersRes.data.data)
          : [];

      if (callupsRes && callupsRes.data && callupsRes.data.status === 'success') {
        const callups = callupsRes.data.data;

        // Map the callup data to the actual player details
        const playersList = callups.map((callup: any) => {
          if (callup.player_id && typeof callup.player_id === 'object') {
            return {
              ...callup,
              playerDetails: callup.player_id,
              player_id: callup.player_id.id
            };
          }

          const callupPlayerId = callup.player_id || callup.individual_id || callup.individuals_id || callup.member_id || callup.memberId;
          const playerDetails = allInds.find((ind: any) => String(ind.id) === String(callupPlayerId));
          return {
            ...callup,
            playerDetails: playerDetails || { first_name: 'لاعب', last_name: 'غير معروف', id: callupPlayerId }
          };
        });

        setCalledUpPlayers(playersList);
      } else {
        setCalledUpPlayers([]);
      }

    } catch (error) {
      console.error('Error processing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load when opened, reset when closed (same behaviour as the original dialog)
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isOpen && matchData) {
      fetchCalledUpPlayers();
    } else {
      setSearchQuery('');
      setCalledUpPlayers([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, matchData]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const filteredPlayers = calledUpPlayers.filter(p =>
    `${p.playerDetails.first_name} ${p.playerDetails.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const { initialPlacements, initialCustomPositions } = useMemo(() => {
    const placements: Record<string, number> = {};
    const custom: Record<string, {x: number, y: number}> = {};
    const formation = matchData?.formation || "4-3-3";
    const config = FORMATIONS[formation];

    if (config && calledUpPlayers.length > 0) {
      const availableSpots = [...config.positions];

      calledUpPlayers.forEach(p => {
        if (p.is_starter && p.position_x != null && p.position_y != null) {
          const px = parseFloat(p.position_x);
          const py = parseFloat(p.position_y);

          let closestSpot: any = null;
          let minD = Infinity;

          availableSpots.forEach(spot => {
             const d = Math.sqrt(Math.pow(spot.x - px, 2) + Math.pow(spot.y - py, 2));
             if (d < minD) {
               minD = d;
               closestSpot = spot;
             }
          });

          if (closestSpot) {
             const playerId = p.player_id || p.individual_id || p.id;
             placements[closestSpot.id] = playerId;

             // If distance is > 0.1, it means user moved it from default position
             if (Math.abs(closestSpot.x - px) > 0.1 || Math.abs(closestSpot.y - py) > 0.1) {
               custom[closestSpot.id] = { x: px, y: py };
             }

             availableSpots.splice(availableSpots.indexOf(closestSpot), 1);
          }
        }
      });
    }

    return { initialPlacements: placements, initialCustomPositions: custom };
  }, [calledUpPlayers, matchData?.formation]);

  // Shape expected by FootballPitch
  const pitchCallups = calledUpPlayers.map(p => {
    const pid = p.player_id || p.individual_id || p.id;
    return {
      player_id: pid,
      name: `${p.playerDetails.first_name} ${p.playerDetails.last_name}`,
      player: {
        ...p.playerDetails,
        shirt_number: p.playerDetails?.shirt_number || p.shirt_number,
      },
      notes: p.notes,
      is_starter: p.is_starter == 1 || p.is_starter === true,
      subbed_out_minute: p.subbed_out_minute || null,
      subbed_in_minute: p.subbed_in_minute || null,
      replaced_by_id: p.replaced_by_id || null,
      shirt_number: p.playerDetails?.shirt_number || p.shirt_number,
      // stats
      rating: p.rating != null ? Number(p.rating) : null,
      yellow_cards: p.yellow_cards || 0,
      red_cards: p.red_cards || 0,
      red_card_type: p.red_card_type || null,
    };
  });

  const goals = calledUpPlayers.flatMap((p: any) =>
    (p.goals || []).map((g: any) => ({
      ...g,
      scorer_id: p.player_id || p.individual_id || p.id,
    }))
  );

  const saveLineup = async (formation: string, starters: { player_id: number, position_x: number, position_y: number, is_starter: boolean }[]) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        Applink.server + '/matches/callups/lineup',
        {
          match_id: matchData!.id,
          formation: formation,
          players: starters
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (matchData) {
        // Kept from the original dialog: the reload places starters using the new formation
        // eslint-disable-next-line react-hooks/immutability
        matchData.formation = formation;
      }
      alert('تم حفظ التشكيلة بنجاح');
      fetchCalledUpPlayers();
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء حفظ التشكيلة');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    calledUpPlayers,
    filteredPlayers,
    searchQuery,
    setSearchQuery,
    isLoading,
    initialPlacements,
    initialCustomPositions,
    pitchCallups,
    goals,
    saveLineup,
  };
};
/* eslint-enable @typescript-eslint/no-explicit-any */
