import React from 'react';
import { MessageCircle } from 'lucide-react';
import { KIND_META, shownStatus, sourceMeta, type Task } from '../taskUtils';

/** A task's conversation, right on its card / row: opens it; its new messages counted on it (pulsing) */
export const TaskChatButton: React.FC<{ task: Task; onChat: (t: Task) => void }> = ({ task: t, onChat }) => (
  <button
    type="button"
    className={`tsk-chat-btn ${t.unread > 0 ? 'has-new' : ''}`}
    onClick={e => { e.stopPropagation(); onChat(t); }}
    onPointerDown={e => e.stopPropagation()}
    aria-label={t.unread > 0 ? `المحادثة: ${t.unread} رسائل جديدة` : 'المحادثة'}
    title={t.unread > 0 ? `${t.unread} رسائل جديدة` : 'المحادثة'}
  >
    <MessageCircle size={18} />
    {t.unread > 0 && <b>{t.unread > 9 ? '9+' : t.unread}</b>}
  </button>
);

/** The status (late first) as a badge; a new one (on time) shows none */
export const StatusBadge: React.FC<{ task: Task }> = ({ task }) => {
  const s = shownStatus(task);
  return s ? <span className={`tk-badge tone-${s.tone}`}><s.icon size={13} />{s.label}</span> : <span className="tk-muted">—</span>;
};

/** Normal / urgent / voice note, or the event / periodic appointment it comes from */
export const KindBadge: React.FC<{ task: Task }> = ({ task: t }) => {
  const src = sourceMeta(t);
  return <span className={`tk-badge soft tone-${t.kind === 'normal' ? 'slate' : KIND_META[t.kind].tone}`}><src.icon size={12} />{src.label}</span>;
};
