import React from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeftRight, Check, X } from 'lucide-react';
import './TransferableDialog.css';

/**
 * Asked while saving a payment to a member: can its amount be transferred?
 * Yes / No saves the payment with the answer; closing the window does not save it.
 */
export const TransferableDialog: React.FC<{
  amountText: string;
  memberName?: string;
  /** The answer already saved (editing a payment) */
  current?: boolean;
  onAnswer: (transferable: boolean) => void;
  onCancel: () => void;
}> = ({ amountText, memberName, current, onAnswer, onCancel }) => createPortal(
  <div className="trf-overlay" onClick={onCancel}>
    <div className="trf-dialog" role="alertdialog" aria-modal="true" aria-labelledby="trf-title" onClick={e => e.stopPropagation()}>
      <button type="button" className="trf-close" onClick={onCancel} aria-label="إلغاء"><X size={18} /></button>
      <span className="trf-icon"><ArrowLeftRight size={26} /></span>
      <h3 id="trf-title">هل المبلغ قابل للتحويل؟</h3>
      <p>
        <b>{amountText}</b>
        {memberName && <> لفائدة <b>{memberName}</b></>}
      </p>
      <div className="trf-actions">
        <button type="button" className={`trf-btn no ${current === false ? 'was' : ''}`} onClick={() => onAnswer(false)}>
          <X size={17} /> لا
        </button>
        <button type="button" className={`trf-btn yes ${current ? 'was' : ''}`} onClick={() => onAnswer(true)} autoFocus>
          <Check size={17} /> نعم
        </button>
      </div>
    </div>
  </div>,
  document.body,
);
