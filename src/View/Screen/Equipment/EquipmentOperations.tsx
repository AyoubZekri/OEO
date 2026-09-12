import React, { useState } from 'react';
import { ArrowLeftRight, Printer, Edit2, Package, Eye, Trash2 } from 'lucide-react';
import { EquipmentOperationDialog } from './EquipmentOperationDialog';
import { OperationDetailsDialog } from './OperationDetailsDialog';
import { EquipmentPrintDialog } from './EquipmentPrintDialog';
import { Pagination } from '../../widget/Pagination';
import { ItemsPerPageSelector } from '../../widget/ItemsPerPageSelector';
import { useAuth } from '../../../core/context/AuthContext';
import { useEquipmentOperationController } from './EquipmentOperationController';
import './Equipment.css';
import './EquipmentOperations.css';

export const EquipmentOperations: React.FC = () => {
  const { permissions, isFullAccess } = useAuth();
  const hasAccess = (check: boolean) => isFullAccess || check;

  const controller = useEquipmentOperationController();
  const { operations, members, isLoading, returnEquipment, undoReturnEquipment, deleteOperation } = controller;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOperation, setEditingOperation] = useState<any>(null);
  const [selectedOperationId, setSelectedOperationId] = useState<string | number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [printingOperation, setPrintingOperation] = useState<any | null>(null);
  
  const selectedOperation = selectedOperationId ? operations.find(op => op.id === selectedOperationId) : null;
  const paginatedOperations = operations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleEdit = (op: any) => {
    setEditingOperation(op);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number | string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه العملية؟ سيتم استرجاع جميع العتاد المرتبط بها.')) {
      await deleteOperation(id);
    }
  };

  return (
    <div className="equipment-page-wrapper">
      <div className="equipment-header">
        <h1>حركة العتاد</h1>
        {(hasAccess(permissions.equipmentOperations.handover) || hasAccess(permissions.equipmentOperations.return)) && (
          <button className="add-eq-btn" onClick={() => { setEditingOperation(null); setIsDialogOpen(true); }}>
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
                <th>اسم العضو</th>
                <th>عدد العتاد</th>
                <th>التاريخ</th>
                <th>الموسم الرياضي</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '48px 0' }}>
                    <div className="loading-container">
                      <div className="premium-loader">
                        <div className="loader-ring"></div>
                        <div className="loader-ring"></div>
                        <div className="loader-ring"></div>
                        <Package size={24} className="loader-icon" />
                      </div>
                      <p>جاري تحميل العمليات...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedOperations.map(op => {
                const memberName = op.individual 
                  ? `${op.individual.first_name} ${op.individual.last_name}` 
                  : (op.member ? `${op.member.first_name} ${op.member.last_name}` : 'غير معروف');
                const itemCount = op.movements ? op.movements.length : 0;
                
                return (
                  <tr key={op.id}>
                    <td data-label="رقم العملية">#{op.id}</td>
                    <td data-label="اسم العضو" style={{ fontWeight: 700, color: 'var(--text-h, #1f2937)' }}>
                      {memberName}
                    </td>
                    <td data-label="عدد العتاد">
                      <span className="qty-badge-table">{itemCount}</span>
                    </td>
                    <td data-label="التاريخ">{new Date(op.operation_date).toLocaleDateString('en-GB')}</td>
                    <td data-label="الموسم الرياضي">{op.sports_season || '-'}</td>
                    <td data-label="الإجراءات" className="actions-cell">
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => setSelectedOperationId(op.id)} className="btn-icon" title="إظهار كامل العتاد مع التفاصيل" style={{ color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                          <Eye size={18} />
                        </button>
                        {hasAccess(permissions.equipmentOperations.edit) && (
                          <button onClick={() => handleEdit(op)} className="btn-icon edit" title="تعديل" style={{ color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
                            <Edit2 size={18} />
                          </button>
                        )}
                        {hasAccess(permissions.equipmentOperations.delete) && (
                          <button onClick={() => handleDelete(op.id)} className="btn-icon" title="حذف" style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                            <Trash2 size={18} />
                          </button>
                        )}
                        {hasAccess(permissions.equipmentOperations.print) && (
                          <button onClick={() => setPrintingOperation(op)} className="btn-icon print-btn" title="طباعة محضر" style={{ color: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                            <Printer size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!isLoading && paginatedOperations.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                    لا توجد عمليات مسجلة حالياً
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && operations.length > 0 && (
          <Pagination 
            totalItems={operations.length} 
            itemsPerPage={itemsPerPage} 
            currentPage={currentPage} 
            onPageChange={setCurrentPage} 
            onItemsPerPageChange={setItemsPerPage} 
          />
        )}
      </div>

      <EquipmentOperationDialog 
        isOpen={isDialogOpen}
        onClose={() => { setIsDialogOpen(false); setEditingOperation(null); }}
        controller={controller}
        editingOperation={editingOperation}
      />

      <OperationDetailsDialog
        isOpen={!!selectedOperation}
        onClose={() => setSelectedOperationId(null)}
        operation={selectedOperation}
        onReturnEquipment={returnEquipment}
        onUndoReturnEquipment={undoReturnEquipment}
      />

      <EquipmentPrintDialog
        isOpen={!!printingOperation}
        onClose={() => setPrintingOperation(null)}
        operation={printingOperation}
        members={members}
      />
    </div>
  );
};
