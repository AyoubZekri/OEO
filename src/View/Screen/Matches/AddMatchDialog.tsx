import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Applink } from '../../../LinkApi';
import { X, Calendar, User, MapPin, Tag } from 'lucide-react';
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
      team_score: '',
      opponent_score: '',
      match_status: ''
  });
  
  const [individuals, setIndividuals] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
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
          team_id: matchData.team_id?.id ? matchData.team_id.id.toString() : (matchData.team_id ? matchData.team_id.toString() : (matchData.team?.id ? matchData.team.id.toString() : ''))
        });
      } else {
        setFormData({
          competition: '', opponent: '', match_title: '', match_date: '',
          location: '', gathering_time: '', gathering_location: '',
          coach_id: '', team_id: '', admin_id: '',
      team_score: '',
      opponent_score: '',
      match_status: ''
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
        axios.get(Applink.teams, { headers })
      ]);
      if (indRes.data.status === 'success') {
        const allowedRoles = ['مدرب', 'مساعد مدرب', 'مدرب حراس', 'موظف', 'إداري', 'طبيب'];
        const filtered = indRes.data.data.filter((ind: any) => 
            ind.role?.name && allowedRoles.includes(ind.role.name.strip())
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const url = matchData ? Applink.updateMatch : Applink.createMatch;
      const payload = matchData ? { ...formData, id: matchData.id } : formData;
      
      const res = await axios.post(url, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === 'success') {
        onSave();
        onClose();
      }
    } catch (error: any) {
      console.error('Error saving match:', error);
      const serverMsg = error.response?.data?.message || error.response?.data?.error || error.message || '';
      alert(`حدث خطأ أثناء الحفظ\n${serverMsg}`);
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
        <form onSubmit={handleSubmit} className="task-form">
          <div className="responsive-grid-2">
            <CustomInput
              label="المنافسة"
              type="text"
              value={formData.competition}
              onChange={e => setFormData({...formData, competition: e.target.value})}
              required
            />
            <CustomInput
              label="رمز الفريق المنافس (مثال: oeo)"
              type="text"
              value={formData.match_title}
              onChange={e => setFormData({...formData, match_title: e.target.value})}
              required
            />
          </div>

          <div className="responsive-grid-2">
            <CustomInput
              label="الفريق الخصم"
              type="text"
              value={formData.opponent}
              onChange={e => setFormData({...formData, opponent: e.target.value})}
              required
            />
            <CustomInput
              label="المكان / الملعب"
              type="text"
              value={formData.location}
              onChange={e => setFormData({...formData, location: e.target.value})}
              required
            />
          </div>

          <div className="responsive-grid-2">
            <CustomInput
              label="تاريخ وتوقيت المباراة"
              type="datetime-local"
              value={formData.match_date}
              onChange={e => setFormData({...formData, match_date: e.target.value})}
              required
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
              label={<><Tag size={16} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> الفئة / الفريق</>}
              value={formData.team_id}
              onChange={(val) => setFormData({ ...formData, team_id: val })}
              options={teams.map(t => ({
                value: t.id.toString(),
                label: t.name
              }))}
              placeholder="اختر الفئة"
            />
          </div>

          <CustomDropdown<string>
              label={<><User size={16} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> المدرب / الإداري</>}
              value={formData.coach_id}
              onChange={(val) => setFormData({ ...formData, coach_id: val })}
              options={individuals.map(ind => ({
                value: ind.id.toString(),
                label: `${ind.first_name} ${ind.last_name} ${ind.role ? `(${ind.role.name})` : ''}`
              }))}
              placeholder="اختر المدرب/الموظف"
            />
            <CustomDropdown<string>
              label={<><User size={16} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> المسؤول الإداري</>}
              value={formData.admin_id}
              onChange={(val) => setFormData({ ...formData, admin_id: val })}
              options={users.map(u => ({
                value: u.id.toString(),
                label: u.name
              }))}
              placeholder="اختر المسؤول"
            />
          </div>


          <div className="responsive-grid-2">
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-h)' }}>حالة المباراة</label>
              <select 
                value={formData.match_status || ''}
                onChange={e => setFormData({...formData, match_status: e.target.value})}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', outline: 'none', height: '42px', fontFamily: 'inherit' }}
              >
                <option value="">مبرمجة / لم تُلعب بعد</option>
                <option value="ملعوبة">ملعوبة</option>
                <option value="مؤجلة">مؤجلة</option>
                <option value="ملغاة">ملغاة</option>
              </select>
            </div>
          </div>
          
          {(formData.match_status === 'ملعوبة' || formData.match_status === '') && (
            <div className="responsive-grid-2" style={{ background: 'var(--bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '16px' }}>
              <CustomInput
                label="أهداف فريقنا"
                type="number"
                value={formData.team_score || ''}
                onChange={e => setFormData({...formData, team_score: e.target.value})}
              />
              <CustomInput
                label="أهداف الخصم"
                type="number"
                value={formData.opponent_score || ''}
                onChange={e => setFormData({...formData, opponent_score: e.target.value})}
              />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <button type="button" onClick={onClose} className="mc-btn mc-btn-secondary" style={{ padding: '10px 24px', minWidth: '100px' }}>
              إلغاء
            </button>
            <button type="submit" className="mc-btn mc-btn-primary" disabled={isSubmitting} style={{ padding: '10px 32px', minWidth: '120px' }}>
              {isSubmitting ? 'حفظ...' : 'حفظ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
