import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Applink } from '../../../LinkApi';
import { X, CheckCircle, Plus, Trash2, Clock, Users } from 'lucide-react';
import { CustomInput } from '../../widget/CustomInput';
import { CustomDropdown } from '../../widget/CustomDropdown';
import type { Match } from './match_model';

interface SetMatchResultDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  matchData: Match | null;
}

export const SetMatchResultDialog: React.FC<SetMatchResultDialogProps> = ({ isOpen, onClose, onSave, matchData }) => {
  const [formData, setFormData] = useState({
    team_score: '',
    opponent_score: '',
    match_status: '',
    match_date: '',
    match_duration: '90'
  });
  
  const [calledUpPlayers, setCalledUpPlayers] = useState<any[]>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);
  
  const [substitutions, setSubstitutions] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && matchData) {
      setFormData({
        team_score: matchData.team_score !== undefined && matchData.team_score !== null ? matchData.team_score.toString() : '',
        opponent_score: matchData.opponent_score !== undefined && matchData.opponent_score !== null ? matchData.opponent_score.toString() : '',
        match_status: matchData.match_status === 'مؤجلة' ? 'مؤجلة' : '',
        match_date: matchData.match_status === 'مؤجلة' && matchData.match_date ? matchData.match_date.substring(0, 16) : '',
        match_duration: matchData.match_duration ? matchData.match_duration.toString() : '90'
      });
      setSubstitutions([]);
      setGoals([]);
      fetchCalledUpPlayers();
      fetchMatchEvents();
    }
  }, [isOpen, matchData]);

  const fetchMatchEvents = async () => {
    if (!matchData) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(Applink.matchEvents(matchData.id), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === 'success') {
        const fetchedGoals = res.data.data.goals || [];
        const fetchedCallups = res.data.data.callups || [];

        const mappedGoals = fetchedGoals.map((g: any) => ({
          id: g.id,
          scorer_id: g.scorer_id?.toString() || '',
          assist_id: g.assist_id?.toString() || '',
          minute: g.minute?.toString() || ''
        }));
        
        if (mappedGoals.length > 0) {
          setGoals(mappedGoals);
        }

        const mappedSubs: any[] = [];
        fetchedCallups.forEach((c: any) => {
          if (c.subbed_out_minute && c.replaced_by_id) {
            mappedSubs.push({
              id: c.id,
              player_out_id: c.player_id?.toString() || c.individual_id?.toString() || '',
              player_in_id: c.replaced_by_id?.toString() || '',
              minute: c.subbed_out_minute?.toString() || ''
            });
          }
        });

        if (mappedSubs.length > 0) {
          setSubstitutions(mappedSubs);
        }
      }
    } catch (error) {
      console.error("Error fetching match events:", error);
    }
  };

  // Sync goals array with team_score
  useEffect(() => {
    if (!isOpen) return;
    const score = parseInt(formData.team_score) || 0;
    if (goals.length < score) {
      const newGoals = [...goals];
      for (let i = goals.length; i < score; i++) {
        newGoals.push({ id: Date.now() + i, scorer_id: '', assist_id: '', minute: '' });
      }
      setGoals(newGoals);
    } else if (goals.length > score) {
      setGoals(goals.slice(0, score));
    }
  }, [formData.team_score]);

  const fetchCalledUpPlayers = async () => {
    if (!matchData) return;
    setIsLoadingPlayers(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [playersRes, callupsRes] = await Promise.all([
        axios.get(Applink.individuals, { headers }).catch(() => null),
        axios.get(Applink.matchCallups(matchData.id), { headers }).catch(() => null)
      ]);

      const allInds = (playersRes && (playersRes.data?.status === 'success' || Array.isArray(playersRes.data))) 
          ? (Array.isArray(playersRes.data) ? playersRes.data : playersRes.data.data) 
          : [];

      if (callupsRes && callupsRes.data?.status === 'success') {
        const callups = callupsRes.data.data;
        const playersList = callups.map((callup: any) => {
          const callupPlayerId = callup.player_id || callup.individual_id || callup.id;
          const playerDetails = callup.player_id && typeof callup.player_id === 'object' ? callup.player_id : allInds.find((ind: any) => String(ind.id) === String(callupPlayerId));
          return {
            ...callup,
            playerDetails: playerDetails || { first_name: 'لاعب', last_name: 'غير معروف', id: callupPlayerId }
          };
        });
        setCalledUpPlayers(playersList);
      } else {
        // Fallback to all players if no callups found
        setCalledUpPlayers(allInds.map((ind: any) => ({ playerDetails: ind })));
      }
    } catch (error) {
      console.error('Error fetching players:', error);
    } finally {
      setIsLoadingPlayers(false);
    }
  };

  const handleAddSubstitution = () => {
    setSubstitutions([...substitutions, { id: Date.now(), player_out_id: '', player_in_id: '', minute: '' }]);
  };

  const handleRemoveSubstitution = (id: number) => {
    setSubstitutions(substitutions.filter(sub => sub.id !== id));
  };

  const updateSubstitution = (id: number, field: string, value: string) => {
    setSubstitutions(substitutions.map(sub => sub.id === id ? { ...sub, [field]: value } : sub));
  };

  const updateGoal = (id: number, field: string, value: string) => {
    setGoals(goals.map(goal => goal.id === id ? { ...goal, [field]: value } : goal));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchData) return;
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const payload = { 
        ...matchData,
        coach_id: matchData.coach_id?.id ? matchData.coach_id.id : matchData.coach_id,
        admin_id: matchData.admin_id?.id ? matchData.admin_id.id : matchData.admin_id,
        team_id: matchData.team_id || matchData.team?.id,
        team_score: formData.match_status === 'مؤجلة' ? null : (formData.team_score === '' ? null : formData.team_score),
        opponent_score: formData.match_status === 'مؤجلة' ? null : (formData.opponent_score === '' ? null : formData.opponent_score),
        match_status: formData.match_status === 'مؤجلة' ? 'مؤجلة' : (formData.team_score !== '' ? 'ملعوبة' : ''),
        match_date: formData.match_status === 'مؤجلة' && formData.match_date ? formData.match_date : matchData.match_date,
        match_duration: formData.match_duration,
        substitutions: substitutions,
        goals: goals
      };
      
      const res = await axios.post(Applink.updateMatch, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.status === 'success') {
        onSave();
        onClose();
      }
    } catch (error: any) {
      console.error('Error saving match result:', error);
      const serverMsg = error.response?.data?.message || error.response?.data?.error || error.message || '';
      alert(`حدث خطأ أثناء الحفظ\n${serverMsg}\nملاحظة: تأكد من تحديث الباك إند لاستقبال match_duration, substitutions, goals.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !matchData) return null;

  const playerOptions = [
    { value: '', label: '-- اختر اللاعب --' },
    ...calledUpPlayers.map(p => ({
      value: p.playerDetails?.id?.toString() || '',
      label: `${p.playerDetails?.first_name} ${p.playerDetails?.last_name}`
    }))
  ];

  const getOnPitchPlayers = () => {
    const hasStarters = calledUpPlayers.some(p => p.is_starter == 1 || p.is_starter === true);
    if (!hasStarters) return calledUpPlayers;

    const subbedInIds = substitutions.map(s => s.player_in_id).filter(id => id);

    return calledUpPlayers.filter(p => {
      const isStarter = p.is_starter == 1 || p.is_starter === true;
      const id = p.playerDetails?.id?.toString();
      const isSubbedIn = subbedInIds.includes(id);
      return isStarter || isSubbedIn;
    });
  };

  const getPlayerOutOptions = () => {
    const available = getOnPitchPlayers();
    return [
      { value: '', label: '-- اختر اللاعب --' },
      ...available.map(p => ({
        value: p.playerDetails?.id?.toString() || '',
        label: `${p.playerDetails?.first_name} ${p.playerDetails?.last_name}`
      }))
    ];
  };

  const getPlayerInOptions = () => {
    const hasStarters = calledUpPlayers.some(p => p.is_starter == 1 || p.is_starter === true);
    if (!hasStarters) return playerOptions;

    const available = calledUpPlayers.filter(p => {
      const isStarter = p.is_starter == 1 || p.is_starter === true;
      return !isStarter;
    });

    return [
      { value: '', label: '-- اختر اللاعب --' },
      ...available.map(p => ({
        value: p.playerDetails?.id?.toString() || '',
        label: `${p.playerDetails?.first_name} ${p.playerDetails?.last_name}`
      }))
    ];
  };

  const getScorerOptions = () => {
    const available = getOnPitchPlayers();
    return [
      { value: '', label: '-- اختر اللاعب --' },
      ...available.map(p => ({
        value: p.playerDetails?.id?.toString() || '',
        label: `${p.playerDetails?.first_name} ${p.playerDetails?.last_name}`
      }))
    ];
  };

  const getAssistOptions = () => {
    const available = getOnPitchPlayers();
    return [
      { value: '', label: '-- بدون تمريرة حاسمة --' },
      ...available.map(p => ({
        value: p.playerDetails?.id?.toString() || '',
        label: `${p.playerDetails?.first_name} ${p.playerDetails?.last_name}`
      }))
    ];
  };

  return (
    <div className="task-dialog-overlay" onClick={onClose} style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1000 }}>
      <div className="task-dialog role-dialog" style={{ fontFamily: 'var(--sans)', maxWidth: '850px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }} onClick={(e) => e.stopPropagation()}>
        <div className="task-dialog-header" style={{ flexShrink: 0 }}>
          <h2>تقرير المباراة (النتيجة والأحداث)</h2>
          <button type="button" className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        
        <div style={{ overflowY: 'auto', flexGrow: 1, padding: '24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.4rem' }}>
              {matchData.team?.name || 'فريقنا'} ضد {matchData.opponent || 'الخصم'}
            </h3>
          </div>

          <form id="match-result-form" onSubmit={handleSubmit} className="task-form">
            
            {/* القسم الأول: إعدادات المباراة */}
            <div style={{ background: 'var(--bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-h)' }}>
                <Clock size={18} /> إعدادات المباراة الأساسية
              </h4>
              <div className="responsive-grid-2">
                <CustomDropdown<string>
                  label="حالة المباراة"
                  value={formData.match_status}
                  onChange={(val) => setFormData({ ...formData, match_status: val })}
                  options={[
                    { value: '', label: 'ملعوبة / انتهت' },
                    { value: 'مؤجلة', label: 'مؤجلة' }
                  ]}
                  placeholder="اختر الحالة"
                />

                {formData.match_status === 'مؤجلة' ? (
                  <CustomInput
                    label="تاريخ المباراة الجديد (اختياري)"
                    type="datetime-local"
                    value={formData.match_date}
                    onChange={e => setFormData({...formData, match_date: e.target.value})}
                  />
                ) : (
                  <CustomDropdown<string>
                    label="دقائق اللعب"
                    value={formData.match_duration}
                    onChange={(val) => setFormData({ ...formData, match_duration: val })}
                    options={[
                      { value: '90', label: '90 دقيقة (وقت أصلي)' },
                      { value: '120', label: '120 دقيقة (أشواط إضافية)' }
                    ]}
                  />
                )}
              </div>
            </div>

            {formData.match_status !== 'مؤجلة' && (
              <>
                {/* القسم الثاني: التبديلات */}
                <div style={{ background: 'var(--bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-h)' }}>
                      <Users size={18} /> التبديلات
                    </h4>
                    <button type="button" onClick={handleAddSubstitution} className="mc-btn mc-btn-secondary" style={{ padding: '6px 12px', fontSize: '0.9rem' }}>
                      <Plus size={16} /> إضافة تبديل
                    </button>
                  </div>

                  {isLoadingPlayers ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>جاري تحميل اللاعبين...</div>
                  ) : substitutions.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px', border: '1px dashed var(--border)', borderRadius: '8px' }}>
                      لم يتم تسجيل أي تبديلات
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {substitutions.map((sub, index) => (
                        <div key={sub.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 40px', gap: '12px', alignItems: 'end', background: 'var(--card-bg)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                          <CustomDropdown<string>
                            label="اللاعب الخارج (Out)"
                            value={sub.player_out_id}
                            onChange={(val) => updateSubstitution(sub.id, 'player_out_id', val)}
                            options={getPlayerOutOptions()}
                          />
                          <CustomDropdown<string>
                            label="اللاعب الداخل (In)"
                            value={sub.player_in_id}
                            onChange={(val) => updateSubstitution(sub.id, 'player_in_id', val)}
                            options={getPlayerInOptions()}
                          />
                          <CustomInput
                            label="الدقيقة"
                            type="number"
                            value={sub.minute}
                            onChange={e => updateSubstitution(sub.id, 'minute', e.target.value)}
                            placeholder="مثال: 65"
                          />
                          <button type="button" onClick={() => handleRemoveSubstitution(sub.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger, #ef4444)', border: 'none', height: '42px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* القسم الثالث: النتيجة والأهداف */}
                <div style={{ background: 'var(--bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <h4 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-h)' }}>
                    <CheckCircle size={18} /> نتيجة المباراة والأهداف
                  </h4>
                  
                  <div className="responsive-grid-2" style={{ gap: '16px', marginBottom: '24px' }}>
                    <CustomInput
                      label="أهداف فريقنا"
                      type="number"
                      value={formData.team_score}
                      onChange={e => setFormData({...formData, team_score: e.target.value})}
                      placeholder="0"
                    />
                    <CustomInput
                      label="أهداف الخصم"
                      type="number"
                      value={formData.opponent_score}
                      onChange={e => setFormData({...formData, opponent_score: e.target.value})}
                      placeholder="0"
                    />
                  </div>

                  {goals.length > 0 && (
                    <div style={{ marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                      <h5 style={{ margin: '0 0 16px 0', color: 'var(--text-h)' }}>تفاصيل أهداف فريقنا:</h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {goals.map((goal, index) => (
                          <div key={goal.id} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: '12px', alignItems: 'end', background: 'var(--card-bg)', padding: '16px', borderRadius: '8px', border: '1px solid var(--primary)' }}>
                            <div style={{ position: 'relative' }}>
                              <div style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'var(--primary)', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold', zIndex: 1 }}>{index + 1}</div>
                              <CustomInput
                                label="الدقيقة"
                                type="number"
                                value={goal.minute}
                                onChange={e => updateGoal(goal.id, 'minute', e.target.value)}
                                placeholder="دقيقة"
                                required
                              />
                            </div>
                            <CustomDropdown<string>
                              label="مُسجل الهدف"
                              value={goal.scorer_id}
                              onChange={(val) => updateGoal(goal.id, 'scorer_id', val)}
                              options={getScorerOptions()}
                              required
                            />
                            <CustomDropdown<string>
                              label="صانع الهدف (اختياري)"
                              value={goal.assist_id}
                              onChange={(val) => updateGoal(goal.id, 'assist_id', val)}
                              options={getAssistOptions()}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </form>
        </div>

        <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'var(--card-bg)', borderRadius: '0 0 16px 16px' }}>
          <button type="button" onClick={onClose} className="mc-btn mc-btn-secondary" style={{ padding: '12px 24px', minWidth: '100px', fontSize: '1rem' }}>
            إلغاء
          </button>
          <button type="submit" form="match-result-form" className="mc-btn mc-btn-primary" disabled={isSubmitting} style={{ padding: '12px 32px', minWidth: '140px', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {isSubmitting ? 'جاري الحفظ...' : <><CheckCircle size={18} /> حفظ التقرير والنتيجة</>}
          </button>
        </div>

      </div>
    </div>
  );
};
