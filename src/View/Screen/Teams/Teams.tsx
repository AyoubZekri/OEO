import React from 'react';
import { Plus, Edit2, Trash2, Users } from 'lucide-react';
import { useTeamsController } from './TeamsController';
import { TeamDialog } from './TeamDialog';
import { useAuth } from '../../../core/context/AuthContext';
import './Teams.css';

export const Teams: React.FC = () => {
  const { permissions, isFullAccess } = useAuth();
  const hasAccess = (check: boolean) => isFullAccess || check;
  const controller = useTeamsController();

  return (
    <div className="teams-container">
      <div className="teams-header">
        {hasAccess(permissions.teams.add) && (
          <button className="add-team-btn" onClick={controller.openAddDialog}>
            <Plus size={20} />
            إضافة فريق
          </button>
        )}
      </div>

      {controller.isLoading ? (
        <div className="loading-container" style={{ minHeight: '300px' }}>
          <div className="premium-loader">
            <div className="loader-ring"></div>
            <div className="loader-ring"></div>
            <div className="loader-ring"></div>
            <div className="loader-dot"></div>
          </div>
          <p className="loading-text">جاري تحميل الفئات...</p>
        </div>
      ) : (
        <div className="teams-grid">
          {controller.teams.map(team => (
            <div key={team.id} className="team-card">
              <div className="team-icon-wrapper">
                <Users size={32} strokeWidth={1.5} />
              </div>
              
              <h2 className="team-name">{team.name}</h2>
              
              <div className="team-card-actions">
                {hasAccess(permissions.teams.edit) && (
                  <button className="team-action-btn edit" onClick={() => controller.openEditDialog(team)} title="تعديل">
                    <Edit2 size={18} />
                  </button>
                )}
                {hasAccess(permissions.teams.delete) && (
                  <button className="team-action-btn delete" onClick={() => controller.handleDeleteTeam(team.id)} title="حذف">
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <TeamDialog 
        isOpen={controller.isDialogOpen} 
        onClose={controller.closeDialog} 
        onSave={controller.handleSaveTeam} 
        teamToEdit={controller.teamToEdit}
      />
    </div>
  );
};
