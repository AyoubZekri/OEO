import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer, Scale, AlertTriangle, Calendar, FileText, HelpCircle, MessageSquare, Check } from 'lucide-react';
import { MobileScreen } from '../widgets/MobileScreen';
import { PrintableIncidentReport } from '../../Screen/Disciplinary/Printable/PrintableIncidentReport';
import { PrintableHearingSummons } from '../../Screen/Disciplinary/Printable/PrintableHearingSummons';
import { PrintableHearingReport } from '../../Screen/Disciplinary/Printable/PrintableHearingReport';
import { PrintableClarificationRequest } from '../../Screen/Disciplinary/Printable/PrintableClarificationRequest';
import { PrintableClarificationReply } from '../../Screen/Disciplinary/Printable/PrintableClarificationReply';
import type { DisciplinaryModel } from '../../Screen/Disciplinary/disciplinary_data';
import '../../Screen/Equipment/EquipmentOperations.css'; // print-only-receipt rules
import '../MobileEvaluations/MobileEvaluations.css';
import './MobileDisciplinaryActions.css';

type PrintType = 'incident' | 'decision' | 'summons' | 'hearing' | 'clarification_request' | 'clarification_reply';

interface PrintChoice {
  type: PrintType;
  label: string;
  hint: string;
  icon: React.ComponentType<{ size?: number }>;
}

// Documents available per action type (same choices as IncidentPrintDialog)
const choicesFor = (actionType: string): PrintChoice[] => {
  if (actionType === 'استدعاء جلسة') {
    return [
      { type: 'summons', label: 'استدعاء جلسة', hint: 'ورقة استدعاء اللاعب للجلسة', icon: Calendar },
      { type: 'hearing', label: 'محضر جلسة', hint: 'أقوال اللاعب وقرارات اللجنة', icon: FileText },
    ];
  }
  if (actionType === 'طلب توضيح') {
    return [
      { type: 'clarification_request', label: 'طلب توضيح', hint: 'الطلب الموجه إلى اللاعب', icon: HelpCircle },
      { type: 'clarification_reply', label: 'رد على طلب التوضيح', hint: 'رد اللاعب وملاحظات الإدارة', icon: MessageSquare },
    ];
  }
  return [
    { type: 'incident', label: 'محضر واقعة', hint: 'تفاصيل الواقعة والحاضرين', icon: Scale },
    { type: 'decision', label: 'قرار تأديبي', hint: 'القرار المتخذ وأسبابه', icon: AlertTriangle },
  ];
};

/** Print page of one action (phone version of IncidentPrintDialog) */
export const MobileDisciplinaryPrint: React.FC<{
  item: DisciplinaryModel;
  onClose: () => void;
}> = ({ item, onClose }) => {
  const choices = choicesFor(item.actionType);
  const [printType, setPrintType] = useState<PrintType>(choices[0].type);

  return (
    <MobileScreen
      title="طباعة"
      onBack={onClose}
      layer={2}
      footer={(
        <button type="button" className="me-btn primary" onClick={() => window.print()}>
          <Printer size={18} /> طباعة
        </button>
      )}
    >
      <section className="mda-head">
        <span className="mda-head-icon"><Printer size={22} /></span>
        <div>
          <strong>{item.memberName}</strong>
          <span>{item.actionType}</span>
        </div>
      </section>

      <h3 className="mda-subtitle">اختر الوثيقة</h3>
      <div className="mda-choices">
        {choices.map(c => (
          <button
            key={c.type}
            type="button"
            className={`mda-choice ${printType === c.type ? 'active' : ''}`}
            onClick={() => setPrintType(c.type)}
          >
            <span className="mda-choice-icon"><c.icon size={22} /></span>
            <span className="mda-choice-text">
              <strong>{c.label}</strong>
              <small>{c.hint}</small>
            </span>
            <span className="mda-choice-check">{printType === c.type && <Check size={15} strokeWidth={3} />}</span>
          </button>
        ))}
      </div>

      {/* Printed sheet, outside the screen so window.print() shows only it */}
      {createPortal(
        <div className="print-only-receipt">
          {printType === 'summons' ? (
            <PrintableHearingSummons incident={item} />
          ) : printType === 'hearing' ? (
            <PrintableHearingReport incident={item} />
          ) : printType === 'clarification_request' ? (
            <PrintableClarificationRequest incident={item} />
          ) : printType === 'clarification_reply' ? (
            <PrintableClarificationReply incident={item} />
          ) : (
            <PrintableIncidentReport incident={item} printType={printType} />
          )}
        </div>,
        document.body,
      )}
    </MobileScreen>
  );
};
