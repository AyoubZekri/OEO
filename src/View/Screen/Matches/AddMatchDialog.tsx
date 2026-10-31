import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Applink } from '../../../LinkApi';
import { X } from 'lucide-react';
import { CustomInput } from '../../widget/CustomInput';
import { CustomDropdown } from '../../widget/CustomDropdown';

interface AddMatchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  matchData?: any;
}

export const AddMatchDialog: React.FC<AddMatchDialogProps> = ({ isOpen, onClose, onSave, matchData }) => {
  const [formData, setFormData] = useState({
    competition: '',
    opponent: '',
    match_title: '',
    match_date: '',
    location: '',
    gathering_time: '',
    gathering_location: '',
    coach_id: '', team_id: '',
    admin_id: '',
    match_status: 'upcoming',
    opponent_club_id: ''
  });

  const [individuals, setIndividuals] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // The fields to type left empty: their message under them
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowErrors(false);
      if (matchData) {
        setFormData({
          competition: matchData.competition || '',
          opponent: matchData.opponent || '',
          match_title: matchData.match_title || '',
          match_date: matchData.match_date ? matchData.match_date.substring(0, 16) : '',
          location: matchData.location || '',
          gathering_time: matchData.gathering_time ? matchData.gathering_time.substring(0, 16) : '',
          gathering_location: matchData.gathering_location || '',
          coach_id: matchData.coach_id?.id ? matchData.coach_id.id.toString() : (matchData.coach_id ? matchData.coach_id.toString() : ''),
          admin_id: matchData.admin_id?.id ? matchData.admin_id.id.toString() : (matchData.admin_id ? matchData.admin_id.toString() : ''),
          team_id: matchData.team_id?.id ? matchData.team_id.id.toString() : (matchData.team_id ? matchData.team_id.toString() : (matchData.team?.id ? matchData.team.id.toString() : '')),
          match_status: matchData.match_status || 'upcoming',
          opponent_club_id: matchData.opponent_club_id || ''
        });
      } else {
        setFormData({
          competition: '', opponent: '', match_title: '', match_date: '',
          location: '', gathering_time: '', gathering_location: '',
          coach_id: '', team_id: '', admin_id: '',
          match_status: 'upcoming',
          opponent_club_id: ''
        });
      }
      fetchDependencies();
    }
  }, [isOpen, matchData]);

  const fetchDependencies = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const [indRes, usersRes, teamsRes] = await Promise.all([
        axios.get(Applink.individuals, { headers }),
        axios.get(Applink.users, { headers }),
        axios.get(Applink.teams, { headers }),
      ]);
      if (indRes.data.status === 'success') {
        const allowedRoles = ['مدرب', 'مساعد مدرب', 'مدرب حراس', 'موظف', 'إداري', 'طبيب'];
        const filtered = indRes.data.data.filter((ind: any) =>
            ind.role?.name && allowedRoles.includes(String(ind.role.name).trim())
        );
        const validIndividuals = filtered.length > 0 ? filtered : indRes.data.data;
        setIndividuals(validIndividuals);
      } else {
        setIndividuals(indRes.data || []);
      }
      if (teamsRes.data.status === 'success' || Array.isArray(teamsRes.data)) {
        const allTeams = Array.isArray(teamsRes.data) ? teamsRes.data : teamsRes.data.data;
        setTeams(allTeams);
      }

      if (usersRes.data.status === 'success') {
        setUsers(usersRes.data.data);
      } else {
        setUsers(usersRes.data || []);
      }
    } catch (error) {
      console.error('Error fetching dependencies', error);
    }
  };

  const errors = {
    competition: !formData.competition.trim() ? 'اكتب اسم المنافسة' : null,
    opponent: !formData.opponent.trim() ? 'اكتب اسم الفريق الخصم' : null,
    location: !formData.location.trim() ? 'اكتب مكان المباراة' : null,
    match_date: !formData.match_date ? 'حدد تاريخ المباراة' : null,
  };
  const error = (field: keyof typeof errors) => (showErrors ? errors[field] : null);
  const missingClass = (field: keyof typeof errors) => (error(field) ? 'is-missing' : '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowErrors(true);
    if (Object.values(errors).some(Boolean)) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const url = matchData ? Applink.updateMatch : Applink.createMatch;
      // The opponent is the name typed (no club chosen from a list any more)
      const typed = { ...formData, opponent: formData.opponent.trim(), opponent_club_id: '' };
      const payload = matchData ? { ...typed, id: matchData.id } : typed;

      const res = await axios.post(url, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === 'success') {
        onSave();
        onClose();
      }
    } catch (error: any) {
      console.error('Error saving match:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="task-dialog-overlay" onClick={onClose} style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div className="task-dialog role-dialog" style={{ fontFamily: 'var(--sans)', maxWidth: '650px', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }} onClick={(e) => e.stopPropagation()}>
        <div className="task-dialog-header">
          <h2>{matchData ? 'تعديل المباراة' : 'إضافة مباراة جديدة'}</h2>
          <button type="button" className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="task-form" noValidate>
          <div className="responsive-grid-2">
            <CustomInput
              label="المنافسة"
              type="text"
              value={formData.competition}
              onChange={e => setFormData({...formData, competition: e.target.value})}
              className={missingClass('competition')}
              error={error('competition')}
            />
            <CustomInput
              label="الفريق الخصم"
              type="text"
              value={formData.opponent}
              onChange={e => setFormData({ ...formData, opponent: e.target.value })}
              className={missingClass('opponent')}
              error={error('opponent')}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <CustomInput
              label="الملعب"
              type="text"
              value={formData.location}
              onChange={e => setFormData({...formData, location: e.target.value})}
              className={missingClass('location')}
              error={error('location')}
            />
          </div>

          <div className="responsive-grid-2">
            <CustomInput
              label="تاريخ المباراة"
              type="datetime-local"
              value={formData.match_date}
              onChange={e => setFormData({...formData, match_date: e.target.value})}
              className={missingClass('match_date')}
              error={error('match_date')}
            />
            <CustomInput
              label="موعد التجمع"
              type="datetime-local"
              value={formData.gathering_time}
              onChange={e => setFormData({...formData, gathering_time: e.target.value})}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <CustomInput
              label="مكان التجمع"
              type="text"
              value={formData.gathering_location}
              onChange={e => setFormData({...formData, gathering_location: e.target.value})}
            />
          </div>

          <div className="responsive-grid-2">
            <div style={{ marginBottom: '16px' }}>
            <CustomDropdown<string>
              label="الفئة"
              value={formData.team_id}
              onChange={(val) => setFormData({ ...formData, team_id: val })}
              options={teams.map(t => ({
                value: t.id.toString(),
                label: t.name
              }))}
              placeholder=""
            />
          </div>

          <CustomDropdown<string>
              label="المدرب"
              value={formData.coach_id}
              onChange={(val) => setFormData({ ...formData, coach_id: val })}
              options={individuals.map(ind => ({
                value: ind.id.toString(),
                label: `${ind.first_name} ${ind.last_name} ${ind.role ? `(${ind.role.name})` : ''}`
              }))}
              placeholder=""
            />
            <CustomDropdown<string>
              label="المسؤول الإداري"
              value={formData.admin_id}
              onChange={(val) => setFormData({ ...formData, admin_id: val })}
              options={users.map(u => ({
                value: u.id.toString(),
                label: u.name
              }))}
              placeholder=""
            />
          </div>




          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <button type="button" onClick={onClose} className="mc-btn mc-btn-secondary" style={{ padding: '10px 24px', minWidth: '100px' }}>
              إلغاء
            </button>
            <button type="submit" className="mc-btn mc-btn-primary" disabled={isSubmitting} style={{ padding: '10px 32px', minWidth: '120px' }}>
              {isSubmitting ? 'جاري الحفظ...' : matchData ? 'حفظ التعديلات' : 'تأكيد'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
