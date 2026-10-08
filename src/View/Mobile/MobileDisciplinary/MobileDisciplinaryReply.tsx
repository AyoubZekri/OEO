import React, { useState } from 'react';
import { MessageSquare, Calendar, Pencil, Save, ShieldCheck, Scale } from 'lucide-react';
import { MobileScreen } from '../widgets/MobileScreen';
import type { DisciplinaryModel } from '../../Screen/Disciplinary/disciplinary_data';
import { DecisionView } from '../../Screen/Disciplinary/Dialogs/DecisionView';
import { DecisionFields } from '../../Screen/Disciplinary/Dialogs/DecisionFields';
import '../MobileEvaluations/MobileEvaluations.css';
import './MobileDisciplinaryActions.css';


// Wording per action type, as in the three desktop response dialogs
const playerLabel = (type: string) => (type === 'طلب توضيح' ? 'رد العضو وتوضيحاته' : 'أقوال العضو وتبريراته');

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
        <h3 className="me-section-title"><span><ShieldCheck size={16} /></span>قرار الإدارة</h3>
        <DecisionView value={item} emptyText={section === 'decision' ? 'لم يصدر القرار بعد' : 'لا توجد ملاحظات ولا قرار بعد'} />
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
    hearingEndTime: item.hearingEndTime || '',
  });
  const set = (field: keyof DisciplinaryModel, value: string) => setForm(prev => ({ ...prev, [field]: value }));


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

      {!isMember && item.actionType === 'استدعاء جلسة' && (
        <section className="me-card">
          <h3 className="me-section-title"><span><Calendar size={16} /></span>سير الجلسة</h3>
          <div className="me-field">
            <span className="me-label">مسؤول الجلسة</span>
            <div className="me-input hr-session-officer">{item.hearingOfficer || 'لم يُعيَّن عند إنشاء الجلسة'}</div>
          </div>
          <label className="me-field">
            <span className="me-label">توقيت اختتام الجلسة</span>
            <input className="me-input" type="time" dir="ltr" value={form.hearingEndTime || ''} onChange={e => set('hearingEndTime', e.target.value)} />
          </label>
          <p className="me-hint">{item.hearingEndTime ? 'اختُتمت الجلسة: محضرها متاح للطباعة' : 'بعد تحديد توقيت الاختتام والحفظ، يصبح محضر الجلسة متاحاً للطباعة'}</p>
        </section>
      )}

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
        <h3 className="me-section-title"><span><ShieldCheck size={16} /></span>قرار الإدارة</h3>
        <DecisionFields
          variant="mobile"
          value={form}
          onChange={patch => setForm(prev => ({ ...prev, ...patch }))}
        />
      </section>
      )}
    </MobileScreen>
  );
};
