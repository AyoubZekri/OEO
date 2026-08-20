import React, { useState } from 'react';
import { AppColor } from '../constant/Colorapp';

interface DialogDateProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dates: { start: Date; end: Date }) => void;
  initialStart?: Date;
  initialEnd?: Date;
}

export const DialogDate: React.FC<DialogDateProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialStart,
  initialEnd,
}) => {
  const [start, setStart] = useState<string>(
    (initialStart || new Date()).toISOString().split('T')[0]
  );
  const [end, setEnd] = useState<string>(
    (initialEnd || new Date()).toISOString().split('T')[0]
  );

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.dialog}>
        <h2 style={styles.title}>إختر المدة</h2>
        
        <div style={styles.content}>
          <div style={styles.section}>
            <p style={styles.sectionTitle}>تاريخ البداية</p>
            <input 
              type="date" 
              value={start} 
              onChange={(e) => setStart(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.section}>
            <p style={styles.sectionTitle}>تاريخ النهاية</p>
            <input 
              type="date" 
              value={end} 
              onChange={(e) => setEnd(e.target.value)}
              style={styles.input}
            />
          </div>
        </div>

        <div style={styles.actions}>
          <button onClick={onClose} style={styles.cancelBtn}>إلغاء</button>
          <button 
            onClick={() => onConfirm({ start: new Date(start), end: new Date(end) })} 
            style={styles.confirmBtn}
          >
            تأكيد
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  dialog: {
    backgroundColor: AppColor.white,
    borderRadius: '15px',
    padding: '20px',
    minWidth: '300px',
    textAlign: 'center' as const,
    direction: 'rtl' as const,
  },
  title: {
    color: AppColor.backgroundcolor,
    margin: '0 0 20px 0',
  },
  content: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    alignItems: 'flex-start' as const,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: AppColor.backgroundcolor,
    margin: 0,
  },
  input: {
    padding: '10px',
    borderRadius: '5px',
    border: `1px solid ${AppColor.grey}`,
    fontSize: '16px',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '30px',
  },
  cancelBtn: {
    padding: '10px 20px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    color: AppColor.black,
  },
  confirmBtn: {
    padding: '10px 20px',
    backgroundColor: AppColor.backgroundcolor,
    color: AppColor.white,
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
  },
};
