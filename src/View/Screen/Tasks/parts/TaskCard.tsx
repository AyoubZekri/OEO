import React from 'react';
import { KIND_META, shownStatus, sourceMeta, type Task } from '../taskUtils';

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
