import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList, MessagesSquare, Send, Loader2, AlertCircle, CheckCircle2, UserRound, FileText, ArrowLeftRight, Clock, ExternalLink, Mic, Check, CheckCheck, RotateCcw,
} from 'lucide-react';
import { SidePanel } from '../../../shared/SidePanel';
import { VoicePlayer } from './VoicePlayer';
import { initials, parseDate } from '../../../shared/dates';
import { useTaskChat } from '../useTasks';
import {
  dateText, dueText, EVENT_LINK, eventLink, isOpen, NATURE_META, SET_STATUSES, shownStatus, sourceMeta, STATUS_META, STATUSES, type Task, type TaskStatus,
} from '../taskUtils';

/**
 * A task, to read only (its actions are in the ⋮ menu of its row): a head in its kind's colour (urgent red, appointment
 * orange, voice note blue, normal white) with its kind, title, status and nature; the deadline and what is left (only
 * when it has one); who does it and who gave it; then its recording and details — one block.
 * withEvent (management): an appointment's task opens its event («عرض المباراة»…).
 * onChat: its conversation in a box of its own (the last message; new ones glow and say how many), opened from it.
 */
export const TaskDetails: React.FC<{ task: Task; mobile: boolean; onClose: () => void; withEvent?: boolean; /** No longer shown inside (the chat has its own button on the row) */ onChat?: () => void }> = ({
  task: t, mobile, onClose, withEvent,
}) => {
  const navigate = useNavigate();
  // Its status: none for a new one (on time)
  const s = shownStatus(t);
  const src = sourceMeta(t);
  const nature = NATURE_META[t.nature];
  const late = t.overdue && isOpen(t);
  const live = t.kind === 'urgent' && isOpen(t);

  const people = [
    { label: 'المكلّف', name: t.assignee?.name || '—' },
    { label: 'أسندها', name: t.created_by || 'النظام' },
  ];

  return (
    <SidePanel
      mobile={mobile}
      icon={ClipboardList}
      title="تفاصيل المهمة"
      onClose={onClose}
      footer={mobile ? undefined : <div className="tk-actions"><button type="button" className="btn-cancel tk-dlg-btn tk-actions-side" onClick={onClose}>إغلاق</button></div>}
    >
      <div className="tsk-d">
        <section className={`tsk-d-hero kind-${t.kind} ${live ? 'live' : ''}`}>
          <div className="tsk-d-hero-top">
            <span className="tsk-d-pill">{live && <span className="tsk-live" aria-hidden="true" />}<src.icon size={13} />{src.label}</span>
            {s && <span className={`tsk-d-pill status tone-${s.tone}`}><s.icon size={13} />{s.label}</span>}
          </div>
          <h2>{t.title}</h2>
          <div className="tsk-d-hero-foot">
            <span><nature.icon size={14} />{nature.label}</span>
            {t.event_label && <span><src.icon size={14} />{t.event_label}</span>}
          </div>
          {withEvent && t.event && (
            <button type="button" className="tsk-d-event" onClick={() => navigate(eventLink(t.event!))}>
              <ExternalLink size={14} />{EVENT_LINK[t.event.type].open}
            </button>
          )}
          <span className="tsk-d-hero-mark" aria-hidden="true"><src.icon size={88} strokeWidth={1.4} /></span>
        </section>

        {/* One block: the deadline with its date beside the assignee, who gave it, then the recording and the details */}
        <section className="tsk-d-block">
          <div className="tsk-d-pair">
            <div className={`tsk-d-cell ${late ? 'late' : ''}`}>
              <span className="tsk-d-cell-icon">{late ? <AlertCircle size={18} /> : <Clock size={18} />}</span>
              <span>
                <small>آخر أجل</small>
                <strong>{t.due_at ? dueText(t) : 'بلا أجل'}</strong>
                {t.due_at && <em dir="ltr">{dateText(t.due_at)}</em>}
              </span>
            </div>
            <div className="tsk-d-cell">
              <span className="tsk-d-avatar">{people[0].name === '—' ? <UserRound size={18} /> : initials(people[0].name)}</span>
              <span>
                <small>{people[0].label}</small>
                <strong>{people[0].name}</strong>
              </span>
            </div>
          </div>
          <div className="tsk-d-row">
            <small>{people[1].label}</small>
            <strong>{people[1].name}</strong>
          </div>
          {t.audio_url && (
            <div className="tsk-d-part">
              <h4><Mic size={15} />التسجيل</h4>
              <VoicePlayer src={t.audio_url} />
            </div>
          )}
          {t.details && (
            <div className="tsk-d-part">
              <h4><FileText size={15} />التفاصيل</h4>
              <p className="tsk-d-text">{t.details}</p>
            </div>
          )}
        </section>

      </div>
    </SidePanel>
  );
};

/** The management changes a task's status (⋮ menu): done or cancelled, no reason asked («late» comes on its own) */
export const TaskStatusDialog: React.FC<{ task: Task; mobile: boolean; onSave: (s: TaskStatus, note: string) => Promise<void>; onClose: () => void }> = ({ task, mobile, onSave, onClose }) => {
  const [picked, setPicked] = useState<TaskStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const confirm = async () => {
    if (!picked) return setError('اختر الحالة');
    setBusy(true);
    setError('');
    try {
      await onSave(picked, '');
      onClose();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <SidePanel
      mobile={mobile}
      sheet
      size="sm"
      layer={2}
      icon={ArrowLeftRight}
      title="تغيير الحالة"
      onClose={onClose}
      footer={(
        <>
          <button type="button" className="tk-btn ghost" onClick={onClose} disabled={busy}>إلغاء</button>
          <button type="button" className="tk-btn primary" onClick={confirm} disabled={busy || !picked}>
            {busy ? <Loader2 size={16} className="tk-spin" /> : <CheckCircle2 size={16} />}حفظ
          </button>
        </>
      )}
    >
      <div className="tsk-status-list">
        {/* Only done or cancelled (and its current one, when it is another but «new») */}
        {STATUSES.filter(st => SET_STATUSES.includes(st) || (st === task.status && st !== 'new')).map(st => {
          const meta = STATUS_META[st];
          const current = task.status === st;
          return (
            <button
              key={st}
              type="button"
              className={`tone-${meta.tone} ${picked === st ? 'on' : ''}`}
              disabled={current || busy}
              onClick={() => { setPicked(st); setError(''); }}
            >
              <span className="tsk-status-icon"><meta.icon size={17} /></span>
              <strong>{meta.label}</strong>
              {current && <em>الحالية</em>}
            </button>
          );
        })}
      </div>
      {error && <p className="tk-error"><AlertCircle size={15} />{error}</p>}
    </SidePanel>
  );
};

const pad = (n: number) => String(n).padStart(2, '0');
const dayKey = (d: Date | null) => (d ? `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` : '');
/** «اليوم», «أمس», or «الخميس 22 أكتوبر» */
const dayLabel = (d: Date) => {
  const today = new Date();
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  if (dayKey(d) === dayKey(today)) return 'اليوم';
  if (dayKey(d) === dayKey(yesterday)) return 'أمس';
  return new Intl.DateTimeFormat('ar-DZ', { weekday: 'long', day: 'numeric', month: 'long' }).format(d);
};
const timeText = (d: Date | null) => (d ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : '');

/**
 * A task's conversation, its messages only (no status changes): by day — mine in orange, the others' in white cards
 * (one name and avatar for a run of messages) — and the message box.
 */
export const TaskChatDialog: React.FC<{ task: Task; mobile: boolean; onTask: (t: Task) => void; onClose: () => void }> = ({ task, mobile, onTask, onClose }) => {
  const { messages, loading, send, retry, seenTs } = useTaskChat(task.id, onTask);
  // Only the messages: the status changes are not shown here
  const talk = messages.filter(m => !m.status);
  const [text, setText] = useState('');
  const end = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest' });
  }, [talk.length]);

  // The box grows with the text, up to a few lines
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    el.style.height = 'auto';
    // scrollHeight leaves out the border: without it the box is short and shows a scrollbar
    const full = el.scrollHeight + el.offsetHeight - el.clientHeight;
    el.style.height = `${Math.min(full, 140)}px`;
    el.style.overflowY = full > 140 ? 'auto' : 'hidden';
  }, [text]);

  // Sent at once (it shows with a clock, then its ticks): the box is free for the next one
  const submit = () => {
    if (!text.trim()) return;
    send(text.trim());
    setText('');
    box.current?.focus();
  };

  return (
    <SidePanel
      mobile={mobile}
      layer={2}
      icon={MessagesSquare}
      title="المحادثة"
      onClose={onClose}
      footer={(
        <div className="tsk-chat-input">
          <textarea
            ref={box}
            rows={1}
            value={text}
            maxLength={3000}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
            placeholder="اكتب رسالة..."
          />
          <button type="button" className="tsk-chat-send" onClick={submit} disabled={!text.trim()} aria-label="إرسال">
            <Send size={18} />
          </button>
        </div>
      )}
    >
      <div className="tsk-chat">
        {loading && !talk.length ? (
          <p className="tsk-chat-empty"><Loader2 size={22} className="tk-spin" />جاري التحميل...</p>
        ) : talk.length === 0 ? (
          <div className="tsk-chat-empty">
            <span><MessagesSquare size={28} /></span>
            <strong>لا توجد رسائل بعد</strong>
            <small>اكتب أول رسالة لبدء المحادثة</small>
          </div>
        ) : talk.map((m, i) => {
          const at = parseDate(m.at);
          const prev = talk[i - 1];
          const prevAt = prev ? parseDate(prev.at) : null;
          const newDay = at && dayKey(at) !== dayKey(prevAt);
          // A run of messages from the same person: the name and avatar on the first one only
          const first = newDay || !prev || prev.by !== m.by || prev.mine !== m.mine;
          return (
            <React.Fragment key={m.id}>
              {newDay && <div className="tsk-chat-day"><span>{dayLabel(at)}</span></div>}
              <div className={`tsk-msg ${m.mine ? 'mine' : ''} ${first ? 'first' : ''}`}>
                {!m.mine && (first ? <span className="tsk-msg-avatar" aria-hidden="true">{initials(m.by)}</span> : <span className="tsk-msg-avatar ghost" aria-hidden="true" />)}
                <div className="tsk-bubble">
                  {!m.mine && first && <b>{m.by}{m.from_assignee && <em>المكلّف</em>}</b>}
                  {/* Room at the end of its last line: the time and ticks sit there, as in WhatsApp */}
                  <p>{m.body}<span className="tsk-msg-pad" aria-hidden="true" /></p>
                  <small>
                    {timeText(at)}
                    {/* Mine: a clock on its way, ✓ saved, ✓✓ read by the other side; not sent: tap to send again */}
                    {m.mine && (m.failed
                      ? <button type="button" className="tsk-msg-retry" onClick={() => retry(m)} aria-label="إعادة الإرسال"><AlertCircle size={13} /><RotateCcw size={12} /></button>
                      : m.pending ? <Clock size={12} className="tsk-tick" aria-label="جاري الإرسال" />
                        : seenTs !== null && (m.ts ?? 0) <= seenTs ? <CheckCheck size={14} className="tsk-tick read" aria-label="قُرئت" />
                          : <Check size={14} className="tsk-tick" aria-label="أُرسلت" />)}
                  </small>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        <div ref={end} />
      </div>
    </SidePanel>
  );
};
