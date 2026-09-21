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
}
