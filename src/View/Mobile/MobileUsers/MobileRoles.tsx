import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Eye, Pencil, Trash2, ShieldCheck, ShieldAlert, FolderInput, FolderOpen, FolderPlus, ChevronDown, Check, X, Layers } from 'lucide-react';
import { MoveToSection, SectionDialog, type SectionFilter } from '../../Screen/UserManagement/Roles/RoleSections';
import type { RoleSection } from '../../Screen/UserManagement/Roles/RolesController';
import '../widgets/MobileSelect.css';
import { TaskSelectionBar } from '../../Screen/Tasks/parts/TaskSelection';
import { useTaskSelection } from '../../Screen/Tasks/parts/useTaskSelection';
import '../../Screen/Tasks/Tasks.css';
import { MobileAppBar } from '../widgets/MobileAppBar';
import { MobileLoader } from '../widgets/MobileLoader';
import { MobileRowMenu, type MobileRowMenuItem } from '../widgets/MobileRowMenu';
import { useUrlDetails } from '../widgets/useUrlDetails';
import type { useRolesController } from '../../Screen/UserManagement/Roles/RolesController';
import type { RoleModel } from '../../Screen/UserManagement/Roles/role_model';
import { type RolePermissions, MODULES, enabledModules } from './roleUtils';
import { MobileRoleDetails } from './MobileRoleDetails';
import { MobileRoleForm } from './MobileRoleForm';
import './MobileUsers.css';
import { StateIcon } from '../../widget/StateIcon';

// Phone version of the roles page: every role as a card with its enabled sections; details and form on their own pages
export const MobileRoles: React.FC<{ c: ReturnType<typeof useRolesController>; can: RolePermissions; filter: SectionFilter; onFilter: (f: SectionFilter) => void }> = ({ c, can, filter, onFilter }) => {
  const { t } = useTranslation();
  const [detailsId, setDetailsId] = useUrlDetails('role');
  const details = detailsId ? c.roles.find(r => String(r.id) === detailsId) : undefined;
  // «نقل إلى قسم» (a phone can't drag): the role being moved
  const [moving, setMoving] = useState<RoleModel | null>(null);
  // A section being added ('new') or renamed
  const [editingSection, setEditingSection] = useState<RoleSection | 'new' | null>(null);
  const current = c.sections.find(s => s.id === filter);
  const inSection = (id: string) => c.roles.filter(r => r.sectionId === id).length;
  const noneCount = c.roles.filter(r => !r.sectionId).length;
  const filterLabel = filter === 'all' ? 'الكل' : filter === 'none' ? 'بلا قسم' : current?.name || 'الكل';
  // The section filter: a dropdown opening a bottom sheet (all, each section, those in none). Inside it, holding a
  // section selects it (then a tap adds others): the bar at the bottom renames it or deletes them — as the tasks
  const [sheetOpen, setSheetOpen] = useState(false);
  const sectionSelect = useTaskSelection(can.edit || can.delete);
  const closeSheet = () => { sectionSelect.clear(); setSheetOpen(false); };
  const pickFilter = (f: SectionFilter) => { onFilter(f); closeSheet(); };
  const shown = c.roles.filter(r => filter === 'all' || (filter === 'none' ? !r.sectionId : r.sectionId === filter));

  const menuItems = (r: RoleModel): MobileRowMenuItem[] => [
    { key: 'view', label: 'عرض الصلاحيات', icon: Eye, color: '#f97316', onClick: () => setDetailsId(r.id) },
    ...(can.edit ? [{ key: 'edit', label: t('roles_permissions.edit_permissions'), icon: Pencil, color: '#f97316', onClick: () => c.openEditDialog(r) }] : []),
    ...(can.edit && c.sections.length > 0 ? [{ key: 'move', label: 'نقل إلى قسم', icon: FolderInput, color: '#f97316', onClick: () => setMoving(r) }] : []),
    ...(can.delete ? [{ key: 'delete', label: 'حذف', icon: Trash2, danger: true, onClick: () => c.handleDeleteRole(r.id) }] : []),
  ];

  return (
    <div className="mus-page">
      <MobileAppBar title="الأدوار والصلاحيات" />

      {c.sections.length > 0 && (
        <div className="rsec-mrow">
          <button type="button" className={`rsec-mtrigger ${filter !== 'all' ? 'active' : ''}`} onClick={() => setSheetOpen(true)}>
            <FolderOpen size={16} />
            <span><small>القسم</small><strong>{filterLabel}</strong></span>
            <ChevronDown size={16} />
          </button>
        </div>
      )}

      {sheetOpen && (
        <div className="ms-backdrop" onClick={() => (sectionSelect.active ? sectionSelect.clear() : closeSheet())}>
          <div className="ms-sheet" role="listbox" aria-label="القسم" onClick={e => e.stopPropagation()}>
            <span className="ms-grabber" aria-hidden="true" />
            <div className="ms-sheet-head">
              <h3>القسم</h3>
              <button type="button" className="ms-close" onClick={closeSheet} aria-label="إغلاق"><X size={18} /></button>
            </div>
            <div className="ms-options">
              <div className="ms-group">
                <button type="button" role="option" aria-selected={filter === 'all'} className={`ms-option ${filter === 'all' ? 'selected' : ''}`} onClick={() => !sectionSelect.active && pickFilter('all')}>
                  <Layers size={16} className="rsec-opt-icon" />
                  <span className="ms-option-label">الكل</span><b className="rsec-opt-count">{c.roles.length}</b>
                  {filter === 'all' && <Check size={18} className="ms-check" />}
                </button>
                {c.sections.map(sec => {
                  const picked = sectionSelect.picked({ id: Number(sec.id) });
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      role="option"
                      aria-selected={filter === sec.id}
                      className={`ms-option ${filter === sec.id ? 'selected' : ''} ${picked ? 'rsec-opt-picked' : ''} ${sectionSelect.enabled ? 'tsk-selectable' : ''}`}
                      {...sectionSelect.rowProps({ id: Number(sec.id) }, () => pickFilter(sec.id))}
                    >
                      {picked ? <Check size={16} strokeWidth={3} className="rsec-opt-icon" /> : <FolderOpen size={16} className="rsec-opt-icon" />}
                      <span className="ms-option-label">{sec.name}</span><b className="rsec-opt-count">{inSection(sec.id)}</b>
                      {filter === sec.id && !picked && <Check size={18} className="ms-check" />}
                    </button>
                  );
                })}
                {noneCount > 0 && (
                  <button type="button" role="option" aria-selected={filter === 'none'} className={`ms-option ${filter === 'none' ? 'selected' : ''}`} onClick={() => !sectionSelect.active && pickFilter('none')}>
                    <span className="rsec-opt-icon" />
                    <span className="ms-option-label">بلا قسم</span><b className="rsec-opt-count">{noneCount}</b>
                    {filter === 'none' && <Check size={18} className="ms-check" />}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {c.isLoading && !c.roles.length ? (
        <MobileLoader text="جاري تحميل الأدوار..." />
      ) : shown.length === 0 ? (
        <StateIcon />
      ) : (
        <div className="mus-list">
          {shown.map(r => {
            const isFull = r.accessLevel === 'full';
            const on = enabledModules(r);
            const open = () => setDetailsId(r.id);
            return (
              <article
                key={r.id}
                className={`mus-card ${isFull ? 'full' : 'partial'}`}
                role="button"
                tabIndex={0}
                onClick={open}
                onKeyDown={e => { if (e.key === 'Enter') open(); }}
              >
                <div className="mus-card-top">
                  <span className="mus-role-icon">{isFull ? <ShieldCheck size={22} /> : <ShieldAlert size={22} />}</span>
                  <span className="mus-card-text">
                    <strong>{r.name}</strong>
                    <em className="mus-level">{isFull ? t('roles_permissions.full_access') : t('roles_permissions.partial_access')}</em>
                  </span>
                  <MobileRowMenu items={menuItems(r)} label="إجراءات الدور" />
                </div>
                <div className="mus-card-foot">
                  <div className="mus-mods">
                    {MODULES.map(m => (
                      <span key={m.key} className={on.includes(m) ? 'on' : ''} title={t(`roles_permissions.modules.${m.key}`)}>
                        <m.icon size={13} />
                      </span>
                    ))}
                  </div>
                  <small><b>{on.length}</b> من {MODULES.length} قسماً</small>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* «قسم جديد» above «إضافة دور» */}
      {can.add && (
        <button type="button" className="mus-fab second" onClick={() => setEditingSection('new')} aria-label="قسم جديد" title="قسم جديد">
          <FolderPlus size={21} strokeWidth={2.2} />
        </button>
      )}
      {can.add && (
        <button type="button" className="mus-fab" onClick={c.openAddDialog} aria-label={t('roles_permissions.add_role')} title={t('roles_permissions.add_role')}>
          <Plus size={22} strokeWidth={2.5} />
        </button>
      )}

      <TaskSelectionBar
        s={sectionSelect}
        tasks={c.sections.map(x => ({ id: Number(x.id) }))}
        mobile
        of="sections"
        onEdit={can.edit ? id => { const s = c.sections.find(x => x.id === String(id)); if (s) { setSheetOpen(false); setEditingSection(s); } } : undefined}
        onDelete={can.delete ? async ids => {
          await c.deleteSections(ids.map(String));
          if (ids.map(String).includes(filter)) onFilter('all');
        } : undefined}
      />
      {editingSection && (
        <SectionDialog
          section={editingSection === 'new' ? null : editingSection}
          onSave={name => c.saveSection(name, editingSection === 'new' ? undefined : editingSection.id)}
          onClose={() => setEditingSection(null)}
        />
      )}
      {moving && <MoveToSection role={moving} sections={c.sections} onMove={id => c.moveRole(moving.id, id)} onClose={() => setMoving(null)} />}

      {details && (
        <MobileRoleDetails role={details} canEdit={can.edit} onEdit={() => c.openEditDialog(details)} onClose={() => setDetailsId(null)} />
      )}

      {c.isDialogOpen && (
        <MobileRoleForm key={c.roleToEdit?.id || 'new'} role={c.roleToEdit} saving={c.isLoading} onSave={c.handleSaveRole} onClose={c.closeDialog} />
      )}
    </div>
  );
};
