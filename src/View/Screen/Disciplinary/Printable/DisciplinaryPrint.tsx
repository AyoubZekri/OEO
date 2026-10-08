import React from 'react';
import type { DisciplinaryModel } from '../disciplinary_data';
import type { PrintType } from './printDocs';
import { PrintSheet } from '../../../widget/PrintSheet';
import { PrintableIncidentReport } from './PrintableIncidentReport';
import { PrintableHearingSummons } from './PrintableHearingSummons';
import { PrintableHearingReport } from './PrintableHearingReport';
import { PrintableClarificationRequest } from './PrintableClarificationRequest';
import { PrintableClarificationReply } from './PrintableClarificationReply';
import { PrintableDisciplinaryDecision } from './PrintableDisciplinaryDecision';

/** Puts the action's document on the page (hidden on screen) and opens the browser's print sheet at once */
export const DisciplinaryPrintSheet: React.FC<{ item: DisciplinaryModel; type: PrintType; onDone: () => void }> = ({ item, type, onDone }) => (
  <PrintSheet onDone={onDone}>
    {type === 'disciplinary_decision' ? (
      <PrintableDisciplinaryDecision incident={item} />
    ) : type === 'summons' ? (
      <PrintableHearingSummons incident={item} />
    ) : type === 'hearing' ? (
      <PrintableHearingReport incident={item} />
    ) : type === 'clarification_request' ? (
      <PrintableClarificationRequest incident={item} />
    ) : type === 'clarification_reply' ? (
      <PrintableClarificationReply incident={item} />
    ) : (
      <PrintableIncidentReport incident={item} printType={type} />
    )}
  </PrintSheet>
);
