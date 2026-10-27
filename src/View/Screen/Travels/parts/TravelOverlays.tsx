import React from 'react';
import { Trash2 } from 'lucide-react';
import { SidePanel } from '../../../shared/SidePanel';
import type { TravelsController } from '../useTravelsController';
import { TravelDetails } from './TravelDetails';
import { TravelForm } from './TravelForm';

/** Details, form and the delete confirmation over the page (both layouts) */
export const TravelOverlays: React.FC<{ c: TravelsController; mobile: boolean }> = ({ c, mobile }) => (
  <>
    {c.details && <TravelDetails key={c.details.id} c={c} travel={c.details} mobile={mobile} />}
    {c.form && <TravelForm c={c} travel={c.form.travel} mobile={mobile} />}
    {c.toDelete && (
      <SidePanel
        mobile={mobile}
        sheet
        size="sm"
        layer={2}
        title="حذف التنقل"
        onClose={c.cancelDelete}
        footer={(
          <>
            <button type="button" className="tk-btn ghost" onClick={c.cancelDelete}>إلغاء</button>
            <button type="button" className="tk-btn danger" onClick={() => { const t = c.toDelete!; c.cancelDelete(); c.remove(t); }}><Trash2 size={17} />حذف</button>
          </>
        )}
      >
        <p className="tk-text">يُحذف التنقل إلى «{c.toDelete.destination}» نهائياً مع برنامجه.</p>
      </SidePanel>
    )}
  </>
);
