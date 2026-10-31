import React, { useState, useEffect } from 'react';
import { X, User, Calendar, Clock, FileText, AlertCircle } from 'lucide-react';
import { showSnackbar } from '../../../core/functions/Snacpar';
import axios from 'axios';
import { Applink } from '../../../LinkApi';
import { CustomDropdown } from '../../widget/CustomDropdown';
import { CustomMultiSelect } from '../../widget/CustomMultiSelect';
import { ABSENCE_TYPES, EVENT_CATEGORIES, memberName, memberRole } from './absenceUtils';

/** "Name · role": players and staff are listed together */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- members come untyped from the API
const memberLabel = (m: any) => `${memberName(m)} · ${memberRole(m)}`;

interface AddAbsenceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  defaultPlayerId?: number | null;
  isMultiMode?: boolean;
  meetings?: { id: string; topic: string; date: string }[];
}

export const AddAbsenceDialog: React.FC<AddAbsenceDialogProps> = ({ isOpen, onClose, onSubmit, defaultPlayerId, isMultiMode = false, meetings = [] }) => {
  const [players, setPlayers] = useState<any[]>([]);
  const [recordMode, setRecordMode] = useState<'record' | 'late' | 'request' | 'leave'>('record');
  const [formData, setFormData] = useState<{
    player_ids: string[];
    absence_type: string;
    event_category: string;
    event_date: string;
    duration: string;
    reason: string;
    record_source: string;
    meeting_id: string;
  }>({
    player_ids: [],
    absence_type: 'غياب',
    event_category: 'تدريب',
    event_date: new Date().toISOString().split('T')[0],
    duration: '',
    reason: '',
    record_source: 'يدوي',
    meeting_id: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customEventCategory, setCustomEventCategory] = useState('');
  const [memberReasons, setMemberReasons] = useState<{ [key: string]: string }>({});
  // The fields to type left empty: their message under them (the members, a choice: a snackbar)
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowErrors(false);
      fetchPlayers();
      if (defaultPlayerId) {
        setFormData(prev => ({ ...prev, player_ids: [defaultPlayerId.toString()] }));
      } else {
        setFormData(prev => ({ ...prev, player_ids: [] }));
      }
    }
  }, [isOpen, defaultPlayerId]);

  const fetchPlayers = async () => {
    try {
      const res = await axios.get(Applink.individuals, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      // Every member: players, staff and administration
      const list = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.data) ? res.data.data : [];
      setPlayers(list);
    } catch (err) {
      console.error('Error fetching players', err);
    }
  };

  const handleModeChange = (mode: 'record' | 'late' | 'request' | 'leave') => {
    setRecordMode(mode);
    if (mode === 'request') {
      setFormData(prev => ({ ...prev, absence_type: 'طلب عطلة' }));
    } else if (mode === 'late') {
      setFormData(prev => ({ ...prev, absence_type: 'تأخر' }));
    } else if (mode === 'leave') {
      setFormData(prev => ({ ...prev, absence_type: 'مغادرة' }));
    } else {
      setFormData(prev => ({ ...prev, absence_type: 'غياب' }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowErrors(true);
    if (formData.player_ids.length === 0) return showSnackbar('خطأ', isMultiMode ? 'اختر الأعضاء' : 'اختر العضو', '#ef4444');
    if (!formData.event_date || (formData.event_category === 'أخرى' && !customEventCategory.trim())) return;

    setIsSubmitting(true);
    try {
      const finalEventCategory = formData.event_category === 'أخرى' && customEventCategory.trim() !== '' ? customEventCategory : formData.event_category;
      await onSubmit({ ...formData, event_category: finalEventCategory, mode: recordMode, member_reasons: memberReasons });
      // Reset form
      setFormData({
        player_ids: [],
        absence_type: 'غياب',
        event_category: 'تدريب',
        event_date: new Date().toISOString().split('T')[0],
        duration: '',
        reason: '',
        record_source: 'يدوي',
        meeting_id: ''
      });
      setRecordMode('record');
      setCustomEventCategory('');
      setMemberReasons({});
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const modes = ABSENCE_TYPES.filter(t => !(isMultiMode && t.mode === 'request'));
  const current = ABSENCE_TYPES.find(t => t.mode === recordMode) || ABSENCE_TYPES[0];
  const title = recordMode === 'request' ? 'تقديم طلب عطلة'
    : recordMode === 'late' ? 'تسجيل حالة تأخر'
      : recordMode === 'leave' ? 'تسجيل حالة مغادرة'
        : isMultiMode ? 'تسجيل غياب جماعي' : 'تسجيل حالة غياب';

  return (
    <div className="ab-overlay" onClick={onClose}>
      <form className={`ab-dialog tone-${current.tone}`} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} role="dialog" aria-modal="true" aria-label={title}>
        <header className="ab-dialog-head">
          <span className="ab-dialog-icon"><current.icon size={22} /></span>
          <div className="ab-dialog-title">
            <h2>{title}</h2>
          </div>
          <button type="button" className="ab-close" onClick={onClose} aria-label="إغلاق"><X size={20} /></button>
        </header>

        <div className="ab-dialog-body">
          {/* Kind of record */}
          <div className={`ab-modes n${modes.length}`}>
            {modes.map(m => (
              <button key={m.mode} type="button" className={`tone-${m.tone} ${recordMode === m.mode ? 'on' : ''}`} onClick={() => handleModeChange(m.mode)}>
                <span><m.icon size={20} /></span>
                {m.label}
              </button>
            ))}
          </div>

          {/* Who */}
          <div className="ab-field">
            <span><User size={15} /> {isMultiMode ? 'الأعضاء' : 'العضو'}</span>
            {isMultiMode ? (
              <CustomMultiSelect
                values={formData.player_ids}
                onChange={(vals) => setFormData({ ...formData, player_ids: vals })}
                options={players.map(p => ({ value: p.id.toString(), label: memberLabel(p) }))}
                placeholder=""
              />
            ) : (
              <CustomDropdown<string>
                value={formData.player_ids[0] || ''}
                onChange={(val) => setFormData({ ...formData, player_ids: [val] })}
                options={players.map(p => ({ value: p.id.toString(), label: memberLabel(p) }))}
                placeholder=""
              />
            )}
          </div>

          {/* Event */}
          <div className="ab-field">
            <span><FileText size={15} /> الفعالية</span>
            <div className="ab-cats">
              {EVENT_CATEGORIES.map(cat => (
                <button key={cat.value} type="button" className={formData.event_category === cat.value ? 'on' : ''} onClick={() => setFormData({ ...formData, event_category: cat.value })}>
                  <cat.icon size={16} /> {cat.value}
                </button>
              ))}
            </div>
          </div>
          {formData.event_category === 'أخرى' && (
            <label className="ab-field">
              <span>تحديد الفعالية</span>
              <input type="text" className={showErrors && !customEventCategory.trim() ? 'is-missing' : ''} value={customEventCategory} onChange={(e) => setCustomEventCategory(e.target.value)} />
              {showErrors && !customEventCategory.trim() && <p className="ab-field-error"><AlertCircle size={13} /> اكتب نوع الفعالية</p>}
            </label>
          )}
          {formData.event_category === 'اجتماع' && meetings.length > 0 && (
            <div className="ab-field">
              <span>الاجتماع</span>
              <CustomDropdown<string>
                value={formData.meeting_id}
                onChange={(val) => setFormData({ ...formData, meeting_id: val })}
                options={[
                  { value: '', label: 'بدون تحديد' },
                  ...meetings.map(m => ({ value: m.id, label: `${m.topic} (${m.date})` }))
                ]}
                placeholder="بدون تحديد"
              />
            </div>
          )}

          {/* When */}
          <div className={`ab-row ${(recordMode === 'request' || recordMode === 'late') ? 'two' : ''}`}>
            <label className="ab-field">
              <span><Calendar size={15} /> التاريخ</span>
              <input type="date" dir="ltr" className={showErrors && !formData.event_date ? 'is-missing' : ''} value={formData.event_date} onChange={(e) => setFormData({ ...formData, event_date: e.target.value })} />
              {showErrors && !formData.event_date && <p className="ab-field-error"><AlertCircle size={13} /> حدد التاريخ</p>}
            </label>
            {(recordMode === 'request' || recordMode === 'late') && (
              <label className="ab-field">
                <span><Clock size={15} /> {recordMode === 'late' ? 'مدة التأخر' : 'المدة'}</span>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                />
              </label>
            )}
          </div>
        </div>

        <footer className="ab-dialog-foot">
          <button type="button" className="ab-btn" onClick={onClose} disabled={isSubmitting}>إلغاء</button>
          <button type="submit" className="ab-btn primary" disabled={isSubmitting}>
            {isSubmitting ? 'جاري الحفظ...' : 'تأكيد'}
          </button>
        </footer>
      </form>
    </div>
  );
};
