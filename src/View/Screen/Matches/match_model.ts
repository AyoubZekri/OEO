export interface Match {
  id: number;
  competition?: string;
  opponent?: string;
  match_title?: string;
  match_date?: string;
  location?: string;
  gathering_time?: string;
  gathering_location?: string;
  coach_id?: any;
  admin_id?: any;
  team_id?: number;
  team_score?: number | null;
  opponent_score?: number | null;
  match_status?: string | null;
  opponent_club_id?: number | null;
  opponent_club?: {
    id: number;
    name: string;
    symbol: string;
    logo: string;
  };
  opponentClub?: {
    id: number;
    name: string;
    symbol: string;
    logo: string;
  };
  team?: {
    id: number;
    name: string;
    category: string;
  };
  attendance_stats?: {
    total: number;
    present: number;
    absent: number;
  };
  formation?: string;
  created_at?: string;
  match_duration?: string | number;
}

export interface MatchGoal {
  id: number;
  match_id: number;
  scorer_id: number;
  assist_id?: number | null;
  minute: number;
  scorer_first_name?: string;
  scorer_last_name?: string;
  assist_first_name?: string;
  assist_last_name?: string;
}

export interface MatchEvent {
  id: string;
  minute: number;
  type: 'goal' | 'substitution' | 'yellow_card' | 'red_card' | 'second_yellow';
  description: string;
  playerIn?: string;
  playerOut?: string;
  playerInPhoto?: string;
  playerOutPhoto?: string;
  scorer?: string;
  assist?: string;
  playerName?: string;
}
