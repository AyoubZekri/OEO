import React from 'react';
import type { TravelsController } from '../useTravelsController';
import { TravelDetails } from './TravelDetails';
import { TravelForm } from './TravelForm';

/** Details and form over the page (both layouts) */
export const TravelOverlays: React.FC<{ c: TravelsController; mobile: boolean }> = ({ c, mobile }) => (
  <>
    {c.details && <TravelDetails key={c.details.id} c={c} travel={c.details} mobile={mobile} />}
    {c.form && <TravelForm c={c} travel={c.form.travel} mobile={mobile} />}
  </>
);
