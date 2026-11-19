import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, FolderOpen, FolderPlus, Pencil, Check, Layers } from 'lucide-react';
import { TaskSelectionBar } from '../../Tasks/parts/TaskSelection';
import { useTaskSelection } from '../../Tasks/parts/useTaskSelection';
import type { RoleSection } from './RolesController';
import type { RoleModel } from './role_model';
import '../../Tasks/Tasks.css';
import '../../../shared/DeleteConfirm.css';
import './RoleSections.css';

/** Which roles are shown: all, those in no section, or one section's */
export type SectionFilter = 'all' | 'none' | string;

/** Dragging a role (computer): its id travels with it */
export const ROLE_DRAG_TYPE = 'application/x-role-id';

/**
 * The roles page's sections, on top (computer and phone): «الكل», each section with how many roles it has, «بلا قسم»,
 * then «قسم جديد». A tap shows its roles. A role dragged onto a section moves into it. Holding a section selects it
 * (then a tap adds others): the bar at the bottom renames it (one selected) or deletes them — like the tasks.
 */
export const RoleSections: React.FC<{
  sections: RoleSection[];
  roles: RoleModel[];
  value: SectionFilter;
  onChange: (v: SectionFilter) => void;
  mobile: boolean;
  can: { add: boolean; edit: boolean; delete: boolean };
  onSave: (name: string, id?: string) => Promise<string | null>;
  onDelete: (ids: string[]) => Promise<void>;
  onMove: (roleId: string, sectionId: string) => void;
  /** «قسم جديد» is next to «إضافة دور» (the computer's page header), not in this row */
  hideAdd?: boolean;
}> = ({ sections, roles, value, onChange, mobile, can, onSave, onDelete, onMove, hideAdd }) => {
  const select = useTaskSelection(can.edit || can.delete);
  const [editing, setEditing] = useState<RoleSection | 'new' | null>(null);
  const [over, setOver] = useState<string | null>(null);

  const count = (id: string) => roles.filter(r => r.sectionId === id).length;
  const noneCount = roles.filter(r => !r.sectionId).length;

  /** A section chip, a drop target for the roles (key: the section's id, '' for «بلا قسم») */
  const dropProps = (key: string) => ({
    onDragOver: (e: React.DragEvent) => {
      if (!e.dataTransfer.types.includes(ROLE_DRAG_TYPE)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setOver(key);
    },
    onDragLeave: () => setOver(o => (o === key ? null : o)),
    onDrop: (e: React.DragEvent) => {
      const roleId = e.dataTransfer.getData(ROLE_DRAG_TYPE);
      setOver(null);
      if (roleId) { e.preventDefault(); onMove(roleId, key); }
    },
  });

  return (
    <>
      {/* No section yet: no row at all (not even «الكل») */}
      {(sections.length > 0 || (can.add && !hideAdd)) && <div className={`rsec ${mobile ? 'mobile' : ''}`} role="tablist" aria-label="أقسام الأدوار">
        {sections.length > 0 && (
        <button type="button" role="tab" aria-selected={value === 'all'} className={`rsec-chip ${value === 'all' ? 'on' : ''}`} onClick={() => onChange('all')}>
          <Layers size={15} /><span>الكل</span><b>{roles.length}</b>
        </button>
        )}
        {sections.map(s => {
          const picked = select.picked({ id: Number(s.id) });
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={value === s.id}
              className={`rsec-chip ${value === s.id ? 'on' : ''} ${over === s.id ? 'drop' : ''} ${picked ? 'picked' : ''} ${select.enabled ? 'tsk-selectable' : ''}`}
              {...select.rowProps({ id: Number(s.id) }, () => onChange(s.id))}
              {...dropProps(s.id)}
            >
              {picked ? <Check size={15} strokeWidth={3} /> : <FolderOpen size={15} />}
              <span>{s.name}</span><b>{count(s.id)}</b>
            </button>
          );
        })}
        {sections.length > 0 && (noneCount > 0 || over === '') && (
          <button type="button" role="tab" aria-selected={value === 'none'} className={`rsec-chip muted ${value === 'none' ? 'on' : ''} ${over === '' ? 'drop' : ''}`} onClick={() => onChange('none')} {...dropProps('')}>
            <span>بلا قسم</span><b>{noneCount}</b>
          </button>
        )}
        {can.add && !hideAdd && (
          <button type="button" className="rsec-add" onClick={() => setEditing('new')}>
            <Plus size={15} /><span>قسم جديد</span>
          </button>
        )}
      </div>}

      <TaskSelectionBar
        s={select}
        tasks={sections.map(s => ({ id: Number(s.id) }))}
        mobile={mobile}
        of="sections"
        onEdit={can.edit ? id => { const s = sections.find(x => x.id === String(id)); if (s) setEditing(s); } : undefined}
        onDelete={can.delete ? async ids => {
          await onDelete(ids.map(String));
          if (ids.map(String).includes(value)) onChange('all');
        } : undefined}
      />

      {editing && (
        <SectionDialog
          section={editing === 'new' ? null : editing}
          onSave={name => onSave(name, editing === 'new' ? undefined : editing.id)}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
};

/** A section's name: a new one («تأكيد») or renamed («حفظ التعديلات»); its message under the field */
export const SectionDialog: React.FC<{ section: RoleSection | null; onSave: (name: string) => Promise<string | null>; onClose: () => void }> = ({ section, onSave, onClose }) => {
  const [name, setName] = useState(section?.name || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('اكتب اسم القسم');
    setBusy(true);
    const err = await onSave(name.trim());
    setBusy(false);
    if (err) setError(err); else onClose();
  };

  return createPortal(
    <div className="del-dlg-overlay" onMouseDown={() => { if (!busy) onClose(); }}>
      <form className="del-dlg rsec-dlg" role="dialog" aria-modal="true" aria-label={section ? 'تعديل القسم' : 'قسم جديد'} onMouseDown={e => e.stopPropagation()} onSubmit={save} noValidate>
        <span className="del-dlg-icon" aria-hidden="true">{section ? <Pencil size={26} /> : <FolderPlus size={28} />}</span>
        <h3>{section ? 'تعديل القسم' : 'قسم جديد'}</h3>
        <input
          className={`rsec-input ${error ? 'is-missing' : ''}`}
          value={name}
          onChange={e => { setName(e.target.value); setError(''); }}
          placeholder="اسم القسم"
          maxLength={100}
          autoFocus
        />
        {error && <small className="rsec-error">{error}</small>}
        <div className="del-dlg-actions">
          <button type="button" className="del-dlg-btn cancel" onClick={onClose} disabled={busy}>إلغاء</button>
          <button type="submit" className="del-dlg-btn rsec-save" disabled={busy}>{section ? 'حفظ التعديلات' : 'تأكيد'}</button>
        </div>
      </form>
    </div>,
    document.body,
  );
};

/** Phones: «نقل إلى قسم» — the sections to choose from (and «بلا قسم») */
export const MoveToSection: React.FC<{ role: RoleModel; sections: RoleSection[]; onMove: (sectionId: string) => void; onClose: () => void }> = ({ role, sections, onMove, onClose }) =>
  createPortal(
    <div className="del-dlg-overlay" onMouseDown={onClose}>
      <div className="del-dlg rsec-dlg" role="dialog" aria-modal="true" aria-label="نقل إلى قسم" onMouseDown={e => e.stopPropagation()}>
        <span className="del-dlg-icon" aria-hidden="true"><FolderOpen size={26} /></span>
        <h3>نقل «{role.name}» إلى</h3>
        <div className="rsec-pick">
          {[...sections, { id: '', name: 'بلا قسم' }].map(s => (
            <button key={s.id || 'none'} type="button" className={role.sectionId === s.id ? 'on' : ''} onClick={() => { onMove(s.id); onClose(); }}>
              {s.id ? <FolderOpen size={16} /> : <Layers size={16} />}<span>{s.name}</span>{role.sectionId === s.id && <Check size={16} />}
            </button>
          ))}
        </div>
        <div className="del-dlg-actions one">
          <button type="button" className="del-dlg-btn cancel" onClick={onClose}>إلغاء</button>
        </div>
      </div>
    </div>,
    document.body,
  );
