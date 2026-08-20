import { useState, useEffect } from 'react';
import { TeamsData } from './teams_data';
import { Crud } from '../../../core/class/Crud';

import { TeamModel } from './team_model';

export const useTeamsController = () => {
  const [teams, setTeams] = useState<TeamModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const crud = new Crud();
  const teamsData = new TeamsData(crud);

  const fetchTeams = async () => {
    setIsLoading(true);
    const response = await teamsData.getTeams();
    if (response) {
      if (Array.isArray(response)) {
        setTeams(response.map(TeamModel.fromJson));
      } else if (response.data && Array.isArray(response.data)) {
        setTeams(response.data.map(TeamModel.fromJson));
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTeams();
  }, []);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [teamToEdit, setTeamToEdit] = useState<TeamModel | null>(null);

  const openAddDialog = () => {
    setTeamToEdit(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (team: TeamModel) => {
    setTeamToEdit(team);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setTeamToEdit(null);
  };

  const handleSaveTeam = async (teamData: Omit<TeamModel, 'id' | 'toJson'>) => {
    setIsLoading(true);
    const tempModel = new TeamModel({ id: teamToEdit?.id || '', ...teamData });
    const payload = tempModel.toJson();
    delete payload.id;

    if (teamToEdit) {
      const response = await teamsData.editTeam({ id: teamToEdit.id, ...payload });
      if (response && !response.error) {
        fetchTeams();
        closeDialog();
      } else {
        alert('حدث خطأ أثناء تعديل الفريق');
      }
    } else {
      const response = await teamsData.addTeam(payload);
      if (response && !response.error) {
        fetchTeams();
        closeDialog();
      } else {
        alert('حدث خطأ أثناء إضافة الفريق');
      }
    }
    setIsLoading(false);
  };

  const handleDeleteTeam = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الفريق؟')) {
      setIsLoading(true);
      const response = await teamsData.deleteTeam(id);
      if (response && !response.error) {
        fetchTeams();
      } else {
        alert('حدث خطأ أثناء حذف الفريق');
      }
      setIsLoading(false);
    }
  };

  return {
    teams,
    isDialogOpen,
    teamToEdit,
    isLoading,
    openAddDialog,
    openEditDialog,
    closeDialog,
    handleSaveTeam,
    handleDeleteTeam,
  };
};
