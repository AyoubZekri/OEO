import React, { useState } from 'react';
import { ListChecks, Plus, Trash2, Building2, UserRound, Lock, Loader2 } from 'lucide-react';
import type { AgendaItem } from '../../Mobile/MobileMeetings/meetingUtils';
import './MeetingAgenda.css';

interface MeetingAgendaProps {
  /** The meeting's points, in their order (the administration's and the sent ones) */
  items: AgendaItem[];
  /** Points may be sent until the meeting starts */
  canAdd: boolean;
  /** May this point be removed by the viewer */
  canRemove: (item: AgendaItem) => boolean;
  onAdd: (text: string) => Promise<void>;
  onRemove: (item: AgendaItem) => Promise<void>;
}

const sentOn = (value?: string | null) => {
  const d = value ? new Date(value) : null;
  return d && !isNaN(d.getTime()) ? new Intl.DateTimeFormat('ar-DZ', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(d) : '';
};

/**
 * The meeting's points (its own list): under each one, who sent it (the administration, or the member);
 * the people concerned send a point until the meeting starts.
 */
export const MeetingAgenda: React.FC<MeetingAgendaProps> = ({ items, canAdd, canRemove, onAdd, onRemove }) => {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const add = async () => {
    if (!text.trim()) return setError('اكتب نقطة النقاش');
    setSaving(true);
    try {
      await onAdd(text.trim());
      setText('');
      setError('');
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- axios errors are untyped
      setError((e as any)?.response?.data?.message || 'تعذر إرسال النقطة');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mag">
      <h4 className="mag-title"><span><ListChecks size={17} /></span>نقاط الاجتماع <em>{items.length}</em></h4>

      {items.length === 0 ? (
        <p className="mag-empty">لا توجد نقاط بعد</p>
      ) : (
        <ol className="mag-list">
          {items.map((p, i) => (
            <li key={p.key} className={p.mine ? 'mine' : ''}>
              <span className="mag-num">{i + 1}</span>
              <div className="mag-body">
                <p>{p.text}</p>
                {p.author === null ? (
                  <small className="mag-by org"><Building2 size={12} /> من الإدارة</small>
                ) : (
                  <small className="mag-by"><UserRound size={12} /> {p.mine ? 'أرسلتها أنت' : `أرسلها ${p.author}`}{sentOn(p.created_at) ? ` · ${sentOn(p.created_at)}` : ''}</small>
                )}
              </div>
              {p.id && canRemove(p) && (
                <button type="button" className="mag-del" onClick={() => onRemove(p)} title="حذف النقطة" aria-label="حذف النقطة"><Trash2 size={15} /></button>
              )}
            </li>
          ))}
        </ol>
      )}

      {canAdd ? (
        <div className="mag-add">
          <input
            value={text}
            onChange={e => { setText(e.target.value); setError(''); }}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
            placeholder="أرسل نقطة للنقاش في الاجتماع..."
            maxLength={500}
          />
          <button type="button" onClick={add} disabled={saving}>
            {saving ? <Loader2 size={16} className="mag-spin" /> : <Plus size={16} />} إرسال
          </button>
        </div>
      ) : (
        <p className="mag-closed"><Lock size={13} /> بدأ الاجتماع: لم يعد إرسال النقاط ممكناً</p>
      )}
      {error && <p className="mag-error">{error}</p>}
    </section>
  );
};
