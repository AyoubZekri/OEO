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
  /** Management list: what is still to do (players called up, starters, players rated, reports, attendance sheet saved) */
  callups_count?: number;
  starters_count?: number;
  rated_count?: number;
  reports_count?: number;
  attendance_taken_at?: string | null;
  /** Personal space: my call-up in this match (null: not called up) */
  my_callup?: { is_starter: boolean; rating: number | string | null; yellow_cards: number; red_cards: number; goals: number } | null;
  /** Personal space: my absence / late record in this match */
  my_absence?: string | null;
  my_absence_note?: string;
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
