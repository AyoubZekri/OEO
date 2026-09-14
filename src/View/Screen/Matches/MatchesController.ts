import { useState, useEffect } from 'react';
import axios from 'axios';
import { Applink } from '../../../LinkApi';
import type { Match } from './match_model';

export const useMatchesController = () => {
  const [matches, setMatches] = useState<Match[]>([]);
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

  const fetchMatches = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(Applink.matches, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.status === 'success') {
        setMatches(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
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

  return {
    matches,
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
    closeResultDialog
  };
};
