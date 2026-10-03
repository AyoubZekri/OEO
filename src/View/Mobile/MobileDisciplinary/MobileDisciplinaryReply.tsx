import React, { useState } from 'react';
import { MessageSquare, Gavel, Calendar, FileText, Pencil, Save, ShieldCheck, Scale } from 'lucide-react';
import { MobileScreen } from '../widgets/MobileScreen';
import { MobileSelect, type MobileSelectOption } from '../widgets/MobileSelect';
import type { DisciplinaryModel } from '../../Screen/Disciplinary/disciplinary_data';
import '../MobileEvaluations/MobileEvaluations.css';
import './MobileDisciplinaryActions.css';

// Same choices as IncidentDecisionDialog (desktop)
const DECISION_OPTIONS: MobileSelectOption[] = [
  { value: 'حفظ', label: 'حفظ' },
  { value: 'تنبيه', label: 'تنبيه' },
  { value: 'تنبيه كتابي', label: 'تنبيه كتابي' },
  { value: 'إنذار', label: 'إنذار' },
  { value: 'عقوبة', label: 'عقوبة' },
  { value: 'فصل', label: 'فصل' },
];

// Wording per action type, as in the three desktop response dialogs
const playerLabel = (type: string) => (type === 'طلب توضيح' ? 'رد العضو وتوضيحاته' : 'أقوال العضو وتبريراته');
const adminLabel = (type: string) =>
  type === 'واقعة' ? 'قرارات وملاحظات الإدارة' : type === 'طلب توضيح' ? 'ملاحظات الإدارة' : 'ملاحظات لجنة الاستماع والقرارات';

const formatDate = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  return isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
};

const Header: React.FC<{ item: DisciplinaryModel }> = ({ item }) => (
  <section className="mda-head">
    <span className="mda-head-icon"><Scale size={22} /></span>
    <div>
      <strong>{item.memberName}</strong>
      <span>{item.actionType} · {formatDate(item.incidentDate)}</span>
    </div>
  </section>
);

/** Read-only reply and decision of one action (phone version of ViewReplyDialog) */
export const MobileDisciplinaryReplyView: React.FC<{
  item: DisciplinaryModel;
  /** Absent: read only */
  onEdit?: () => void;
  onClose: () => void;
  /** Clarification requests: the member's reply and the decision apart. Absent: both */
  section?: 'reply' | 'decision';
}> = ({ item, onEdit, onClose, section }) => {
  const hasAnything = item.player_statements || item.admin_notes;
  const showReply = section !== 'decision';
  const showDecision = section !== 'reply';
  // The reply of a clarification request is written by the member, not edited here
  const edit = section === 'reply' && item.actionType === 'طلب توضيح' ? undefined : onEdit;
  const editLabel = section === 'decision'
    ? (item.admin_notes ? 'تعديل القرار' : 'إضافة القرار')
    : hasAnything ? 'تعديل الرد والقرارات' : 'إضافة رد وقرار';
  return (
    <MobileScreen
      title={section === 'reply' ? 'رد العضو' : section === 'decision' ? 'القرار' : 'الرد والقرارات'}
      onBack={onClose}
      layer={2}
      footer={edit ? (
        <button type="button" className="me-btn primary" onClick={edit}>
          <Pencil size={18} /> {editLabel}
        </button>
      ) : undefined}
    >
      <Header item={item} />

      {showReply && (
      <section className="me-card">
        <h3 className="me-section-title"><span><MessageSquare size={16} /></span>{playerLabel(item.actionType)}</h3>
        <p className={`me-text ${item.player_statements ? '' : 'empty'}`}>{item.player_statements || 'لم يُسجل أي رد بعد'}</p>
      </section>
      )}

      {showDecision && (
      <section className="me-card">
        <h3 className="me-section-title"><span><ShieldCheck size={16} /></span>{section === 'decision' ? 'قرار الإدارة' : adminLabel(item.actionType)}</h3>
        <p className={`me-text ${item.admin_notes ? '' : 'empty'}`}>{item.admin_notes || (section === 'decision' ? 'لم يصدر القرار بعد' : 'لم تُسجل أي ملاحظات بعد')}</p>

        {item.actionType === 'واقعة' && (
          <div className="mda-decision">
            <div className="mda-decision-tile">
              <small><Gavel size={13} /> نوع القرار</small>
              <strong>{item.decision_outcome || 'لم يحدد'}</strong>
            </div>
            <div className="mda-decision-tile">
              <small><Calendar size={13} /> تاريخ السريان</small>
              <strong>{formatDate(item.effective_date) || 'لم يحدد'}</strong>
            </div>
            {item.decision_reasons && (
              <div className="mda-decision-tile wide">
                <small><FileText size={13} /> أسباب القرار</small>
                <p>{item.decision_reasons}</p>
              </div>
            )}
          </div>
        )}
      </section>
      )}
    </MobileScreen>
  );
};

/** Reply / decision form (phone version of the clarification, hearing and incident response dialogs) */
export const MobileDisciplinaryReplyForm: React.FC<{
  item: DisciplinaryModel;
  isSubmitting: boolean;
  onSave: (item: DisciplinaryModel) => void;
  onClose: () => void;
  /** member: only the member's reply (personal space); admin: for a clarification request the reply is read only */
  mode?: 'member' | 'admin';
}> = ({ item, isSubmitting, onSave, onClose, mode = 'admin' }) => {
  const isMember = mode === 'member';
  const replyReadOnly = !isMember && item.actionType === 'طلب توضيح';
  const [form, setForm] = useState<DisciplinaryModel>({
    ...item,
    player_statements: item.player_statements || '',
    admin_notes: item.admin_notes || '',
    decision_outcome: item.decision_outcome || '',
    decision_reasons: item.decision_reasons || '',
    effective_date: item.effective_date ? item.effective_date.split('T')[0] : '',
  });
  const set = (field: keyof DisciplinaryModel, value: string) => setForm(prev => ({ ...prev, [field]: value }));
  const isIncident = item.actionType === 'واقعة';

  return (
    <MobileScreen
      title={isMember ? 'الرد على طلب التوضيح' : replyReadOnly ? 'قرار الإدارة' : item.player_statements || item.admin_notes ? 'تعديل الرد' : 'إضافة رد'}
      onBack={onClose}
      layer={2}
      footer={(
        <button type="button" className="me-btn primary" onClick={() => onSave(form)} disabled={isSubmitting}>
          <Save size={18} /> {isSubmitting ? 'جاري الحفظ...' : isMember ? 'إرسال الرد' : 'حفظ'}
        </button>
      )}
    >
      <Header item={item} />

      {!replyReadOnly && (
      <section className="me-card">
        <h3 className="me-section-title"><span><MessageSquare size={16} /></span>{isMember ? 'ردي وتوضيحاتي' : playerLabel(item.actionType)}</h3>
        {replyReadOnly ? (
          <p className={`me-text ${form.player_statements ? '' : 'empty'}`}>{form.player_statements || 'لم يرد العضو بعد على الطلب'}</p>
        ) : (
          <textarea
            className="me-textarea"
            rows={5}
            value={form.player_statements}
            onChange={e => set('player_statements', e.target.value)}
            placeholder={isMember ? 'اكتب ردك وتوضيحاتك هنا...' : 'أدخل رد وتبريرات العضو هنا...'}
          />
        )}
      </section>
      )}

      {!isMember && (
      <section className="me-card">
        <h3 className="me-section-title"><span><ShieldCheck size={16} /></span>{adminLabel(item.actionType)}</h3>
        <textarea
          className="me-textarea"
          rows={4}
          value={form.admin_notes}
          onChange={e => set('admin_notes', e.target.value)}
          placeholder="أدخل الملاحظات والقرارات..."
        />

        {isIncident && (
          <>
            <MobileSelect
              label="نوع القرار التأديبي"
              icon={Gavel}
              value={form.decision_outcome || ''}
              options={DECISION_OPTIONS}
              onChange={v => set('decision_outcome', v)}
              placeholder="اختر نوع القرار"
            />
            <label className="me-field">
              <span className="me-label"><Calendar size={14} /> تاريخ السريان</span>
              <input className="me-input" type="date" dir="ltr" value={form.effective_date} onChange={e => set('effective_date', e.target.value)} />
            </label>
            <label className="me-field">
              <span className="me-label"><FileText size={14} /> أسباب القرار</span>
              <textarea className="me-textarea" rows={3} value={form.decision_reasons} onChange={e => set('decision_reasons', e.target.value)} placeholder="ما هي أسباب هذا القرار؟" />
            </label>
          </>
        )}
      </section>
      )}
    </MobileScreen>
  );
};
