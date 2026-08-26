import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMembersController } from './MembersController';
import { Eye, X, Receipt, Search, Plus, UserPlus, FileSignature, CheckCircle2, Landmark, Wallet, Edit2, Trash2, Camera } from 'lucide-react';
import { CustomDropdown } from '../../widget/CustomDropdown';
import { useAuth } from '../../../core/context/AuthContext';
import { Pagination } from '../../widget/Pagination';
import { ItemsPerPageSelector } from '../../widget/ItemsPerPageSelector';
import './Members.css';

const processImage = (file: File, maxSizeKB: number): Promise<File> => {
  return new Promise((resolve) => {
    if (file.size <= maxSizeKB * 1024) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        let quality = 0.9;
        const checkSize = () => {
          canvas.toBlob((blob) => {
            if (blob) {
              if (blob.size <= maxSizeKB * 1024 || quality <= 0.2) {
                const newFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(newFile);
              } else {
                quality -= 0.1;
                checkSize();
              }
            } else {
              resolve(file);
            }
          }, 'image/jpeg', quality);
        };
        checkSize();
      };
      img.onerror = () => {
        resolve(file);
      };
    };
  });
};

export const Members: React.FC = () => {
  const { t } = useTranslation();
  const { permissions, isFullAccess } = useAuth();
  const hasAccess = (check: boolean) => isFullAccess || check;
  const controller = useMembersController();
  const { 
    filteredMembers,
    searchQuery,
    setSearchQuery,
    filterTeamId,
    setFilterTeamId,
    teams,
    selectedMember, 
    isDialogOpen, 
    isAddMemberOpen,
    memberToEdit,
    formData,
    setFormData,
    photoFile,
    setPhotoFile,
    handleFormDataChange,
    handleSaveMember,
    openAddMemberDialog,
    openEditMemberDialog,
    closeAddMemberDialog,
    handleDeleteMember,
    openExpensesDialog, 
    closeDialog, 
    formatCurrency
  } = controller;

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const paginatedMembers = filteredMembers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Print function


  const getStatusBadge = (status: string) => {
    if (status === 'active') return <span className="badge badge-green">{t('members.active', 'نشط')}</span>;
    if (status === 'suspended') return <span className="badge badge-red">{t('members.suspended', 'موقوف')}</span>;
    return <span className="badge badge-red">{t('members.inactive', 'غير نشط')}</span>;
  };

  const filterTeamOptions = [
    { value: '', label: t('members.all_teams', 'جميع الفئات (الفرق)') },
    ...teams.map(team => ({ value: team.id.toString(), label: team.name }))
  ];

  const typeOptions = [
    { value: 'player', label: 'لاعب' },
    { value: 'coach', label: 'مدرب' },
    { value: 'employee', label: 'موظف / إداري / طبيب' }
  ];

  const formTeamOptions = [
    { value: '', label: '-- بدون فريق --' },
    ...teams.map(team => ({ value: team.id.toString(), label: team.name }))
  ];

  const statusOptions = [
    { value: 'active', label: 'نشط' },
    { value: 'inactive', label: 'غير نشط' },
    { value: 'suspended', label: 'موقوف' }
  ];

  return (
    <div className="members-container">
      <div className="members-header">
        <h1 className="page-title">{t('members.title', 'قائمة الأعضاء')}</h1>
        
        <div className="members-actions">
          <div className="search-box">
            <Search size={18} />
            <input 
              type="text" 
              placeholder={t('members.search_placeholder', 'ابحث بالاسم أو المنصب...')} 
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <CustomDropdown<string>
            value={filterTeamId}
            options={filterTeamOptions}
            onChange={(val) => setFilterTeamId(val)}
            placeholder={t('members.all_teams', 'جميع الفئات (الفرق)')}
          />
          {hasAccess(permissions.members.add) && (
            <button className="btn-primary" onClick={openAddMemberDialog}>
              <Plus size={18} />
              {t('members.add_member', 'إضافة عضو')}
            </button>
          )}
        </div>
      </div>

      {/* Members Table */}
      <div className="table-pagination-wrapper">
        <ItemsPerPageSelector itemsPerPage={itemsPerPage} onItemsPerPageChange={setItemsPerPage} onPageChange={setCurrentPage} />
        <div className="members-table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>{t('members.photo', 'الصورة')}</th>
                <th>{t('members.name', 'الاسم واللقب')}</th>
                <th>{t('members.type', 'المنصب')}</th>
                <th>{t('members.jersey', 'رقم القميص')}</th>
                <th>{t('members.team', 'الفريق')}</th>
                <th>{t('members.status', 'الحالة')}</th>
                <th>{t('members.internal_system', 'النظام الداخلي')}</th>
                <th>{t('members.actions', 'إجراءات')}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMembers.map(member => (
                <tr key={member.id} className="member-row">
                  <td data-label={t('members.photo', 'الصورة')} className="avatar-cell">
                    {member.photo && member.photo !== '' && !member.photo.includes('default') ? (
                      <img src={member.photo} alt={member.first_name} className="member-avatar" />
                    ) : (
                      <div className="member-avatar placeholder">
                        {member.first_name?.charAt(0) || ''}{member.last_name?.charAt(0) || ''}
                      </div>
                    )}
                  </td>
                  <td data-label={t('members.name', 'الاسم واللقب')} className="member-name-cell">
                    {member.first_name} {member.last_name}
                  </td>
                  <td data-label={t('members.type', 'المنصب')}>
                    {member.type === 'player' ? 'لاعب' : member.type === 'coach' ? 'مدرب' : 'موظف/إداري'}
                  </td>
                  <td data-label={t('members.jersey', 'رقم القميص')} className="jersey-cell">
                    {member.Shirt_number ? <span className="jersey-number">{member.Shirt_number}</span> : '-'}
                  </td>
                  <td data-label={t('members.team', 'الفريق')}>{member.team_name || '-'}</td>
                  <td data-label={t('members.status', 'الحالة')}>{getStatusBadge(member.status)}</td>
                  <td data-label={t('members.internal_system', 'النظام الداخلي')}>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      {member.is_internal_system_printed ? (
                        <div 
                          title="تمت طباعة النظام الداخلي"
                          style={{ 
                            width: '32px', height: '32px', borderRadius: '50%', 
                            backgroundColor: '#ecfdf5', color: '#10b981', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 0 12px rgba(16, 185, 129, 0.15)',
                            border: '1px solid #a7f3d0'
                          }}>
                          <CheckCircle2 size={16} />
                        </div>
                      ) : (
                        <div 
                          title="لم تتم الطباعة"
                          style={{ 
                            width: '32px', height: '32px', borderRadius: '50%', 
                            backgroundColor: '#f8fafc', color: '#cbd5e1', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '1px dashed #e2e8f0'
                          }}>
                          <X size={16} />
                        </div>
                      )}
                    </div>
                  </td>
                  <td data-label={t('members.actions', 'إجراءات')} className="actions-cell">
                    <div className="action-buttons-wrapper">
                      {hasAccess(permissions.members.viewFinancialRecord) && (
                        <button className="btn-action view-btn" onClick={() => openExpensesDialog(member)} title="كشف الحساب">
                          <Eye size={18} />
                        </button>
                      )}
                      {hasAccess(permissions.members.edit) && (
                        <button className="btn-action edit-btn" onClick={() => openEditMemberDialog(member)} title="تعديل">
                          <Edit2 size={18} />
                        </button>
                      )}
                      {hasAccess(permissions.members.delete) && (
                        <button className="btn-action delete-btn" onClick={() => handleDeleteMember(member.id)} title="حذف">
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#64748b', fontSize: '1.1rem' }}>
                    لا يوجد أعضاء مطابقين للبحث
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination 
          totalItems={filteredMembers.length} 
          itemsPerPage={itemsPerPage} 
          currentPage={currentPage} 
          onPageChange={setCurrentPage} 
          onItemsPerPageChange={setItemsPerPage} 
        />
      </div>

      {/* Add/Edit Member Modal */}
      {isAddMemberOpen && (
        <div className="dialog-overlay" onClick={closeAddMemberDialog}>
          <div className="dialog-content add-member-dialog" onClick={e => e.stopPropagation()}>
            <div className="dialog-header">
              <div className="dialog-title">
                <UserPlus size={24} />
                <h2>{memberToEdit ? 'تعديل عضو' : t('members.add_member_title', 'إضافة عضو جديد')}</h2>
              </div>
              <button className="close-btn" onClick={closeAddMemberDialog}>
                <X size={24} />
              </button>
            </div>
            
            <div className="dialog-body">
              <form id="memberForm" onSubmit={handleSaveMember} className="add-member-form">
                <div className="photo-upload-container">
                  <div className="photo-upload-card" onClick={() => document.getElementById('photo-upload-input')?.click()} title="اختيار صورة">
                    <input 
                      id="photo-upload-input"
                      type="file" 
                      accept="image/*,.heic,.heif" 
                      style={{ display: 'none' }}
                      onChange={async (e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          const file = e.target.files[0];
                          const processedFile = await processImage(file, 5000); // 5000 KB to be safely under 5120
                          setPhotoFile(processedFile);
                        } else {
                          setPhotoFile(null);
                        }
                      }} 
                    />
                    {photoFile ? (
                      <img src={URL.createObjectURL(photoFile)} alt="Preview" className="photo-preview-image" />
                    ) : memberToEdit && memberToEdit.photo && !memberToEdit.photo.includes('default') ? (
                      <img src={memberToEdit.photo} alt="Current" className="photo-preview-image" />
                    ) : (
                      <div className="photo-placeholder-ui">
                        <Camera size={32} className="photo-placeholder-icon" />
                        <span>الصورة</span>
                      </div>
                    )}
                  </div>
                  {(photoFile || (memberToEdit && memberToEdit.photo && !memberToEdit.photo.includes('default'))) && (
                    <button type="button" className="btn-remove-photo" onClick={(e) => { e.stopPropagation(); setPhotoFile(null); if (memberToEdit) memberToEdit.photo = ''; }}>
                      <X size={14} /> إزالة
                    </button>
                  )}
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('members.form_firstname', 'الاسم')} *</label>
                    <input type="text" name="first_name" required value={formData.first_name} onChange={handleFormDataChange} className="form-control" />
                  </div>
                  <div className="form-group">
                    <label>{t('members.form_lastname', 'اللقب')} *</label>
                    <input type="text" name="last_name" required value={formData.last_name} onChange={handleFormDataChange} className="form-control" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>{t('members.form_id_number', 'رقم الهوية الوطنية')}</label>
                    <input type="text" name="national_id" value={formData.national_id} onChange={handleFormDataChange} className="form-control" />
                  </div>
                  <div className="form-group">
                    <label>{t('members.form_phone', 'رقم الهاتف')}</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleFormDataChange} className="form-control" dir="ltr" />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('members.form_dob', 'تاريخ الميلاد')}</label>
                    <input type="date" name="birth_date" value={formData.birth_date} onChange={handleFormDataChange} className="form-control" />
                  </div>
                  <div className="form-group">
                    <label>{t('members.form_pob', 'مكان الميلاد')}</label>
                    <input type="text" name="place_of_birth" value={formData.place_of_birth} onChange={handleFormDataChange} className="form-control" />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group" style={{ zIndex: 3 }}>
                    <CustomDropdown<string>
                      label={t('members.form_type', 'المنصب / نوع العقد') + ' *'}
                      value={formData.type}
                      options={typeOptions}
                      onChange={(val) => setFormData((prev: any) => ({ ...prev, type: val }))}
                    />
                  </div>
                  <div className="form-group" style={{ zIndex: 3 }}>
                    <CustomDropdown<string>
                      label={t('members.form_team', 'الفريق')}
                      value={formData.team_id?.toString() || ''}
                      options={formTeamOptions}
                      onChange={(val) => setFormData((prev: any) => ({ ...prev, team_id: val }))}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ zIndex: 2 }}>
                    <CustomDropdown<string>
                      label={t('members.form_status', 'الحالة') + ' *'}
                      value={formData.status}
                      options={statusOptions}
                      onChange={(val) => setFormData((prev: any) => ({ ...prev, status: val }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('members.form_jersey', 'رقم القميص (اختياري للأنواع الأخرى)')}</label>
                    <input type="number" name="Shirt_number" value={formData.Shirt_number} onChange={handleFormDataChange} className="form-control" />
                  </div>
                </div>
              </form>
            </div>
            <div className="dialog-footer">
              <button className="btn-cancel" onClick={closeAddMemberDialog}>{t('members.cancel', 'إلغاء')}</button>
              <button type="submit" form="memberForm" className="btn-primary" disabled={controller.isLoading}>
                {controller.isLoading ? 'جاري الحفظ...' : (memberToEdit ? 'حفظ التعديلات' : t('members.save', 'حفظ العضو'))}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expenses & Details Dialog */}
      {isDialogOpen && selectedMember && (
        <div className="dialog-overlay printable-overlay" onClick={closeDialog}>
          <div className="dialog-content details-dialog" onClick={e => e.stopPropagation()}>
            <div className="dialog-header no-print">
              <div className="dialog-title">
                <Receipt size={24} />
                <h2>{t('members.expenses_record', 'كشف الحساب')} - {selectedMember.first_name} {selectedMember.last_name}</h2>
              </div>
              <button className="close-btn" onClick={closeDialog}>
                <X size={24} />
              </button>
            </div>
            
            <div className="dialog-body printable-area">
              <div className="print-header only-print">
                <h2>نادي أولمبيك - كشف حساب</h2>
                <h3>{selectedMember.first_name} {selectedMember.last_name}</h3>
                <p>تاريخ الإصدار: {new Intl.DateTimeFormat('ar-DZ').format(new Date())}</p>
              </div>

              {/* Financial Summary Card */}
              <div className="financial-summary-card">
                <div className="card-header">
                  <h3>{selectedMember.first_name} {selectedMember.last_name}</h3>
                  <span className="card-badge">{selectedMember.type === 'player' ? 'لاعب' : 'عضو فريق'}</span>
                </div>
                
                {/* Contracts Loop */}
                {controller.getContractsForMember(selectedMember.id).map((contract, index) => {
                  const contractVal = Number(contract.contractValue) || Number(contract.Contract_value) || 0;
                  const contractPaid = controller.getPaidForContract(selectedMember.id, contract);
                  const contractRemaining = contractVal - contractPaid;
                  
                  return (
                    <div key={contract.id || index} style={{ marginBottom: '20px', padding: '16px', background: 'var(--bg-body)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <h4 style={{ marginBottom: '12px', color: 'var(--text-h)', fontSize: '1.1rem' }}>
                        عقد موسم: {contract.startDate || contract.start_date || 'غير محدد'}
                      </h4>
                      <div className="card-grid">
                        <div className="card-item contract">
                          <div className="card-icon"><FileSignature size={24} /></div>
                          <div className="card-content">
                            <span className="label">{t('members.contract', 'قيمة العقد:')}</span>
                            <span className="value">{formatCurrency(contractVal)}</span>
                          </div>
                        </div>
                        <div className="card-item paid">
                          <div className="card-icon"><CheckCircle2 size={24} /></div>
                          <div className="card-content">
                            <span className="label text-success">{t('members.paid', 'المدفوع من العقد:')}</span>
                            <span className="value text-success">{formatCurrency(contractPaid)}</span>
                          </div>
                        </div>
                        <div className="card-item highlight-item">
                          <div className="card-icon"><Wallet size={24} /></div>
                          <div className="card-content">
                            <span className="label">{t('members.remaining', 'المتبقي من العقد:')}</span>
                            <span className="value">{formatCurrency(contractRemaining)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Global Advances and Global Remaining (after advances) */}
                <div className="card-grid" style={{ marginTop: '20px' }}>
                  <div className="card-item advances">
                    <div className="card-icon"><Landmark size={24} /></div>
                    <div className="card-content">
                      <span className="label text-danger">{t('members.advances', 'إجمالي السلف:')}</span>
                      <span className="value text-danger">{formatCurrency(controller.getAdvances(selectedMember.id))}</span>
                    </div>
                  </div>
                  <div className="card-item" style={{ background: 'rgba(249, 115, 22, 0.1)', borderColor: 'rgba(249, 115, 22, 0.2)' }}>
                    <div className="card-icon" style={{ color: '#F97316' }}><Wallet size={24} /></div>
                    <div className="card-content">
                      <span className="label" style={{ color: '#F97316' }}>الرصيد النهائي المتبقي:</span>
                      <span className="value" style={{ color: '#F97316' }}>{formatCurrency(controller.getRemainingAmount(selectedMember.id))}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Operations Table */}
              <h3 className="timeline-title" style={{ marginTop: '32px', marginBottom: '16px' }}>{t('members.operations_timeline', 'سجل العمليات والمدفوعات')}</h3>
              <div className="table-responsive">
                <table className="custom-table premium-ops-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>{t('members.op_date', 'التاريخ')}</th>
                      <th>{t('members.op_nature', 'النوع')}</th>
                      <th>{t('members.op_method', 'طريقة الدفع')}</th>
                      <th>{t('members.op_amount', 'المبلغ')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {controller.getMemberPayments(selectedMember.id).map((p: any) => (
                      <tr key={p.id}>
                        <td>{new Intl.DateTimeFormat('ar-DZ', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(p.paymentDate || p.created_at || new Date()))}</td>
                        <td>
                          <span className={`badge ${(p.amountNature === 'استقطاع' || p.amountNature === 'خصم') ? 'badge-red' : p.amountNature === 'سلفة' ? 'badge-blue' : 'badge-green'}`}>
                            {p.amountNature || 'دفع'}
                          </span>
                        </td>
                        <td>{p.paymentMethod}</td>
                        <td className={`amount-cell ${(p.amountNature === 'استقطاع' || p.amountNature === 'خصم') ? 'text-danger' : 'text-success'}`}>
                          {formatCurrency(p.amount)}
                        </td>
                      </tr>
                    ))}
                    {controller.getMemberPayments(selectedMember.id).length === 0 && (
                      <tr>
                        <td colSpan={4} className="no-data" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                          {t('members.no_expenses', 'لا توجد عمليات مسجلة حالياً')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="dialog-footer no-print">
              <button className="btn-cancel" onClick={closeDialog}>{t('members.close', 'إغلاق')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
