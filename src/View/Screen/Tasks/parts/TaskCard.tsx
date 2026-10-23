import React from 'react';
import { KIND_META, sourceMeta, statusView, type Task } from '../taskUtils';

/** The status (late first) as a badge */
export const StatusBadge: React.FC<{ task: Task }> = ({ task }) => {
  const s = statusView(task);
  return <span className={`tk-badge tone-${s.tone}`}><s.icon size={13} />{s.label}</span>;
};

/** Normal / urgent / voice note, or the event / periodic appointment it comes from */
export const KindBadge: React.FC<{ task: Task }> = ({ task: t }) => {
  const src = sourceMeta(t);
  return <span className={`tk-badge soft tone-${t.kind === 'normal' ? 'slate' : KIND_META[t.kind].tone}`}><src.icon size={12} />{src.label}</span>;
};
