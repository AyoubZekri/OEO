import React, { useState } from 'react';
import { ArrowLeftRight, Printer, RefreshCw, Edit2 } from 'lucide-react';
import { EquipmentOperationDialog } from './EquipmentOperationDialog';
import { Pagination } from '../../widget/Pagination';
import { ItemsPerPageSelector } from '../../widget/ItemsPerPageSelector';
import { useAuth } from '../../../core/context/AuthContext';
import './Equipment.css';
import './EquipmentOperations.css';

const mockOperationsHistory = [
  { id: 1001, eqName: 'كاميرا سوني A7III', memberName: 'أحمد محمود', type: 'تسليم', qty: 1, date: '2026-08-25', status: 'مكتمل' },
  { id: 1002, eqName: 'عدسة 85mm', memberName: 'سارة خالد', type: 'تسليم', qty: 2, date: '2026-08-24', status: 'مكتمل' },
  { id: 1003, eqName: 'مايكروفون Rode', memberName: 'أحمد محمود', type: 'إسترجاع', qty: 1, date: '2026-08-22', status: 'مكتمل' },
  { id: 1004, eqName: 'إضاءة Godox', memberName: 'علي كمال', type: 'تسليم', qty: 1, date: '2026-08-20', status: 'مكتمل' },
];

export const EquipmentOperations: React.FC = () => {
  const { permissions, isFullAccess } = useAuth();
  const hasAccess = (check: boolean) => isFullAccess || check;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const paginatedHistory = mockOperationsHistory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="equipment-page-wrapper">
      <div className="equipment-header">
        <h1>حركة العتاد</h1>
        {(hasAccess(permissions.equipmentOperations.handover) || hasAccess(permissions.equipmentOperations.return)) && (
          <button className="add-eq-btn" onClick={() => setIsDialogOpen(true)}>
            <ArrowLeftRight size={20} />
            عملية جديدة
          </button>
        )}
      </div>

      <div className="table-pagination-wrapper" style={{ marginTop: '24px' }}>
        <ItemsPerPageSelector itemsPerPage={itemsPerPage} onItemsPerPageChange={setItemsPerPage} onPageChange={setCurrentPage} />
        <div className="users-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>رقم العملية</th>
                <th>العتاد</th>
                <th>العضو</th>
                <th>النوع</th>
                <th>الكمية</th>
                <th>التاريخ</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {paginatedHistory.map(op => (
                <tr key={op.id}>
                  <td data-label="رقم العملية">#{op.id}</td>
                  <td data-label="العتاد" style={{ fontWeight: 700, color: 'var(--text-h, #1f2937)' }}>
                    {op.eqName}
                  </td>
                  <td data-label="العضو">{op.memberName}</td>
                  <td data-label="النوع">
                    <span className={`op-type-badge ${op.type === 'تسليم' ? 'badge-handover' : 'badge-return'}`}>
                      {op.type}
                    </span>
                  </td>
                  <td data-label="الكمية">
                    <span className="qty-badge-table">{op.qty}</span>
                  </td>
                  <td data-label="التاريخ">{op.date}</td>
                  <td data-label="الإجراءات" className="actions-cell">
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {hasAccess(permissions.equipmentOperations.edit) && (
                        <button className="btn-icon edit" title="تعديل" style={{ color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
                          <Edit2 size={18} />
                        </button>
                      )}
                      {op.type === 'تسليم' && hasAccess(permissions.equipmentOperations.return) && (
                        <button className="btn-icon return-btn" title="إرجاع العتاد" style={{ color: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
                          <RefreshCw size={18} />
                        </button>
                      )}
                      {hasAccess(permissions.equipmentOperations.print) && (
                        <button className="btn-icon print-btn" title="طباعة محضر" style={{ color: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                          <Printer size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {mockOperationsHistory.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                    لا توجد حركات مسجلة حالياً
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination 
          totalItems={mockOperationsHistory.length} 
          itemsPerPage={itemsPerPage} 
          currentPage={currentPage} 
          onPageChange={setCurrentPage} 
          onItemsPerPageChange={setItemsPerPage} 
        />
      </div>

      <EquipmentOperationDialog 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
      />
    </div>
  );
};
