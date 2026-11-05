import React, { useState } from 'react';
import { ActionsMenu } from '../../../widget/ActionsMenu';
import { Pagination } from '../../../widget/Pagination';
import { ItemsPerPageSelector } from '../../../widget/ItemsPerPageSelector';
import type { TaskTemplate } from '../taskUtils';
import { appointmentKind, appointmentMenu, type AppointmentActions } from './appointmentMeta';

/**
 * The appointments on a computer, in a table like the equipment movements': how many per page on top, the
 * appointment, its kind, who does it, its state, then its
 * ⋮ (its details, edit, stop / start, delete — those this role may do); the pages under it.
 * A click on a row opens its details.
 */
export const AppointmentTable: React.FC<{ templates: TaskTemplate[] } & AppointmentActions> = ({ templates, ...actions }) => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  // A filter that leaves fewer pages: back to the last one
  const last = Math.max(1, Math.ceil(templates.length / perPage));
  const current = Math.min(page, last);
  const shown = templates.slice((current - 1) * perPage, current * perPage);

  return (
    <div className="table-pagination-wrapper tsk-atable">
      <ItemsPerPageSelector itemsPerPage={perPage} onItemsPerPageChange={setPerPage} onPageChange={setPage} />
      <div className="users-table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>الموعد</th>
              <th>النوع</th>
              <th>المكلّف</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {shown.map(t => {
              const on = t.status === 'active';
              const kind = appointmentKind(t);
              const open = () => actions.onView?.(t);
              return (
                <tr
                  key={t.id}
                  className={`${on ? '' : 'off'} ${actions.onView ? 'tsk-arow' : ''}`}
                  tabIndex={actions.onView ? 0 : undefined}
                  onClick={open}
                  onKeyDown={e => { if (e.key === 'Enter') open(); }}
                >
                  <td data-label="الموعد" className="tsk-atitle">
                    {t.title}
                    {kind.when && <small>{kind.when}</small>}
                  </td>
                  <td data-label="النوع">{kind.label}</td>
                  <td data-label="المكلّف">{t.assignee?.name || '-'}</td>
                  <td data-label="الحالة"><span className={`tsk-astate ${on ? 'on' : ''}`}>{on ? 'مفعل' : 'متوقف'}</span></td>
                  <td data-label="الإجراءات" className="actions-cell" onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>
                    <ActionsMenu label="إجراءات الموعد" items={appointmentMenu(t, actions)} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination totalItems={templates.length} itemsPerPage={perPage} currentPage={current} onPageChange={setPage} onItemsPerPageChange={setPerPage} />
    </div>
  );
};
