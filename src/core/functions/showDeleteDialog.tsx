import React from 'react';
import { AppColor } from '../constant/Colorapp';

interface DeleteDialogProps {
  isOpen: boolean;
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDark?: boolean;
}

export const DeleteDialog: React.FC<DeleteDialogProps> = ({
  isOpen,
  itemName,
  onConfirm,
  onCancel,
  isDark = false,
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    }}>
      <div style={{
        backgroundColor: isDark ? AppColor.cardDark : AppColor.cardLight,
        borderRadius: '18px',
        padding: '20px',
        maxWidth: '400px',
        width: '90%',
        direction: 'rtl',
        fontFamily: 'Cairo, sans-serif',
      }}>
        <h2 style={{
          color: isDark ? AppColor.textDark : AppColor.red,
          fontSize: '16px',
          fontWeight: 'bold',
          margin: '0 0 20px 0',
          textAlign: 'center'
        }}>
          تأكيد الحذف
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: '54px', color: AppColor.red, marginBottom: '14px' }}>
            🗑️
          </div>
          <p style={{
            color: isDark ? AppColor.textDark : AppColor.textLight,
            fontSize: '15px',
            fontWeight: 'bold',
            textAlign: 'center',
            margin: '0 0 20px 0'
          }}>
            هل تريد حذف {itemName}؟
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
          <button 
            onClick={onConfirm}
            style={{
              backgroundColor: AppColor.red,
              color: AppColor.white,
              border: 'none',
              borderRadius: '10px',
              padding: '8px 20px',
              fontWeight: 'bold',
              fontFamily: 'Cairo, sans-serif',
              cursor: 'pointer'
            }}
          >
            نعم، حذف
          </button>
          <button 
            onClick={onCancel}
            style={{
              backgroundColor: 'transparent',
              color: AppColor.grey,
              border: `1px solid ${AppColor.grey}`,
              borderRadius: '10px',
              padding: '8px 20px',
              fontWeight: 'bold',
              fontFamily: 'Cairo, sans-serif',
              cursor: 'pointer'
            }}
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};
