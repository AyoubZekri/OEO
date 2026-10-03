import { useState, useEffect } from 'react';
import axios from 'axios';
import { Applink } from '../../../LinkApi';
import type { Match } from './match_model';

/** personal: the matches of my category only (personal space), read only */
export const useMatchesController = ({ personal = false }: { personal?: boolean } = {}) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  
  // Callups state
  const [isCallupsDialogOpen, setIsCallupsDialogOpen] = useState(false);
  const [selectedMatchForCallup, setSelectedMatchForCallup] = useState<Match | null>(null);

  // View callups list state
  const [isViewCallupsDialogOpen, setIsViewCallupsDialogOpen] = useState(false);
  const [selectedMatchForViewCallups, setSelectedMatchForViewCallups] = useState<Match | null>(null);
  const [isAdministrativeReportDialogOpen, setIsAdministrativeReportDialogOpen] = useState(false);
  const [selectedMatchForAdministrativeReport, setSelectedMatchForAdministrativeReport] = useState<Match | null>(null);

  // View administrative report state
  const [isViewAdministrativeReportDialogOpen, setIsViewAdministrativeReportDialogOpen] = useState(false);
  const [selectedMatchForViewAdministrativeReport, setSelectedMatchForViewAdministrativeReport] = useState<Match | null>(null);

  // Set match result state
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
  const [selectedMatchForResult, setSelectedMatchForResult] = useState<Match | null>(null);

  // Timeline state
  const [isTimelineDialogOpen, setIsTimelineDialogOpen] = useState(false);
  const [selectedMatchForTimeline, setSelectedMatchForTimeline] = useState<Match | null>(null);

  // Player Stats state
  const [isPlayerStatsDialogOpen, setIsPlayerStatsDialogOpen] = useState(false);
  const [selectedMatchForPlayerStats, setSelectedMatchForPlayerStats] = useState<Match | null>(null);

  const fetchMatches = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (personal) {
        const mine = await axios.get(`${Applink.matches}/mine`, { headers: { Authorization: `Bearer ${token}` } });
        if (mine.data.status === 'success') setMatches(mine.data.data);
        return;
      }
      const response = await axios.get(Applink.matches, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.status === 'success') {
        const matchesData = response.data.data;
        
        // Fetch attendance stats for each match sequentially to avoid 429 Too Many Requests
        const matchesWithStats = [];
        for (const match of matchesData) {
          if (match.attendance_stats) {
            matchesWithStats.push(match);
            continue;
          }

          try {
            const attResponse = await axios.get(
              Applink.matchAttendance(match.id),
              { headers: { Authorization: `Bearer ${token}` } }
            );
            
            // Handle possible 'data' wrapper from Laravel response
            const responseData = attResponse.data.status === 'success' ? attResponse.data.data : attResponse.data;
            const players = responseData.players || [];
            
            const total = players.length;
            const present = players.filter((p: any) => p.status === 'حاضر' || p.status === 'متأخر').length;
            const absent = players.filter((p: any) => p.status === 'غائب غير مبرر' || p.status === 'غائب مبرر').length;
            
            matchesWithStats.push({
              ...match,
              attendance_stats: { total, present, absent }
            });
          } catch (err) {
            matchesWithStats.push({
              ...match,
              attendance_stats: { total: 0, present: 0, absent: 0 }
            });
          }
        }

        setMatches(matchesWithStats);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه المباراة؟')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(Applink.deleteMatch, { id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMatches();
    } catch (error) {
      console.error('Error deleting match:', error);
    }
  };

  const openAddDialog = () => {
    setEditingMatch(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (match: Match) => {
    setEditingMatch(match);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingMatch(null);
  };

  const openCallupsDialog = (match: Match) => {
    setSelectedMatchForCallup(match);
    setIsCallupsDialogOpen(true);
  };

  const closeCallupsDialog = () => {
    setIsCallupsDialogOpen(false);
    setSelectedMatchForCallup(null);
  };

  const openViewCallupsDialog = (match: Match) => {
    setSelectedMatchForViewCallups(match);
    setIsViewCallupsDialogOpen(true);
  };

  const closeViewCallupsDialog = () => {
    setIsViewCallupsDialogOpen(false);
    setSelectedMatchForViewCallups(null);
  };

  const openAdministrativeReportDialog = (match: Match) => {
    setSelectedMatchForAdministrativeReport(match);
    setIsAdministrativeReportDialogOpen(true);
  };

  const closeAdministrativeReportDialog = () => {
    setIsAdministrativeReportDialogOpen(false);
    setSelectedMatchForAdministrativeReport(null);
  };

  const openViewAdministrativeReportDialog = (match: Match) => {
    setSelectedMatchForViewAdministrativeReport(match);
    setIsViewAdministrativeReportDialogOpen(true);
  };

  const closeViewAdministrativeReportDialog = () => {
    setIsViewAdministrativeReportDialogOpen(false);
    setSelectedMatchForViewAdministrativeReport(null);
  };

  const openResultDialog = (match: Match) => {
    setSelectedMatchForResult(match);
    setIsResultDialogOpen(true);
  };

  const closeResultDialog = () => {
    setIsResultDialogOpen(false);
    setSelectedMatchForResult(null);
  };

  const openTimelineDialog = (match: Match) => {
    setSelectedMatchForTimeline(match);
    setIsTimelineDialogOpen(true);
  };

  const closeTimelineDialog = () => {
    setIsTimelineDialogOpen(false);
    setSelectedMatchForTimeline(null);
  };

  const openPlayerStatsDialog = (match: Match) => {
    setSelectedMatchForPlayerStats(match);
    setIsPlayerStatsDialogOpen(true);
  };

  const closePlayerStatsDialog = () => {
    setIsPlayerStatsDialogOpen(false);
    setSelectedMatchForPlayerStats(null);
  };

  return {
    personal,
    matches,
    isLoading,
    isDialogOpen,
    editingMatch,
    isCallupsDialogOpen,
    selectedMatchForCallup,
    isViewCallupsDialogOpen,
    selectedMatchForViewCallups,
    fetchMatches,
    handleDelete,
    openAddDialog,
    openEditDialog,
    closeDialog,
    openCallupsDialog,
    closeCallupsDialog,
    openViewCallupsDialog,
    closeViewCallupsDialog,
    isAdministrativeReportDialogOpen,
    selectedMatchForAdministrativeReport,
    openAdministrativeReportDialog,
    closeAdministrativeReportDialog,
    isViewAdministrativeReportDialogOpen,
    selectedMatchForViewAdministrativeReport,
    openViewAdministrativeReportDialog,
    closeViewAdministrativeReportDialog,
    isResultDialogOpen,
    selectedMatchForResult,
    openResultDialog,
    closeResultDialog,
    isTimelineDialogOpen,
    selectedMatchForTimeline,
    openTimelineDialog,
    closeTimelineDialog,
    isPlayerStatsDialogOpen,
    selectedMatchForPlayerStats,
    openPlayerStatsDialog,
    closePlayerStatsDialog
  };
};
