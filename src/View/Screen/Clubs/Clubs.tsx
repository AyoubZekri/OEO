import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Plus, Edit2, Trash2, Camera, X, UploadCloud, Search } from 'lucide-react';
import { useClubsController } from './ClubsController';
import type { Club } from './club_model';
import { CustomInput } from '../../widget/CustomInput';
import { useIsMobile } from '../../../core/functions/useIsMobile';
import { MobileClubs } from '../../Mobile/MobileClubs/MobileClubs';
import './Clubs.css';

export const Clubs: React.FC = () => {
  const { t } = useTranslation();
  const controller = useClubsController();
  const { clubs, addClub, updateClub, deleteClub, isLoading } = controller;
  const isMobile = useIsMobile();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', symbol: '', logo: '' });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  if (isMobile) return <MobileClubs controller={controller} />;

  const openAdd = () => {
    setEditingId(null);
    setFormData({ name: '', symbol: '', logo: '' });
    setPhotoFile(null);
    setIsModalOpen(true);
  };

  const openEdit = (club: Club) => {
    setEditingId(club.id);
    setFormData({ name: club.name, symbol: club.symbol, logo: club.logo });
    setPhotoFile(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا النادي؟')) {
      deleteClub(id);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      // Create object URL for immediate preview
      setFormData({ ...formData, logo: URL.createObjectURL(file) });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSend = { ...formData, file: photoFile };
    if (editingId) {
      await updateClub(editingId, dataToSend);
    } else {
      await addClub(dataToSend);
    }
    setIsModalOpen(false);
  };

  const filteredClubs = clubs.filter(club => 
    club.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (club.symbol && club.symbol.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="clubs-container">
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div className="search-box">
            <Search size={18} />
            <input 
              type="text"
              placeholder="بحث عن نادي..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="add-eq-btn" onClick={openAdd}>
            <Plus size={20} />
            <span>إضافة نادي</span>
          </button>
        </div>
      </div>

      {/* Grid Section */}
      {isLoading ? (
        <div className="loading-container" style={{ minHeight: '300px' }}>
          <div className="premium-loader">
            <div className="loader-ring"></div>
            <div className="loader-ring"></div>
            <div className="loader-ring"></div>
            <div className="loader-dot"></div>
          </div>
          <p className="loading-text">جاري تحميل الأندية...</p>
        </div>
      ) : (
        <div className="clubs-grid">
        {filteredClubs.map((club) => (
          <div 
            key={club.id} 
            className="club-card-wow"
          >
            {/* Background gradient blur */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100px', background: 'linear-gradient(180deg, var(--accent-bg) 0%, transparent 100%)', opacity: 0.5, pointerEvents: 'none' }}></div>

            <div 
              className="card-actions" 
              style={{ 
                position: 'absolute', 
                top: '20px', 
                right: '20px', 
                display: 'flex', 
                gap: '12px',
                opacity: 0.8,
                transition: 'opacity 0.2s ease',
                zIndex: 10
              }}
            >
              <button 
                onClick={(e) => { e.stopPropagation(); openEdit(club); }} 
                style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '12px', padding: '10px', cursor: 'pointer', color: 'var(--text-h)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                onMouseOver={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-h)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                title="تعديل"
              >
                <Edit2 size={18} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleDelete(club.id); }} 
                style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '12px', padding: '10px', cursor: 'pointer', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                onMouseOver={e => { e.currentTarget.style.background = '#EF4444'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#EF4444'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                title="حذف"
              >
                <Trash2 size={18} />
              </button>
            </div>
            
            <div style={{ 
              width: '130px', 
              height: '130px', 
              flexShrink: 0,
              borderRadius: club.logo ? '24px' : '50%', 
              background: club.logo ? 'transparent' : 'var(--accent-bg)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: club.logo ? 'none' : 'inset 0 0 0 2px var(--accent)',
              marginBottom: '24px',
              position: 'relative',
              zIndex: 1
            }}>
              {club.logo ? (
                <img src={club.logo} alt={club.name} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '24px', boxSizing: 'border-box' }} />
              ) : (
                <span style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--accent)', textShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                  {club.symbol ? club.symbol.charAt(0) : club.name.charAt(0)}
                </span>
              )}
            </div>
            
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-h)', textAlign: 'center', zIndex: 1 }}>{club.name}</h3>
            
            <div className="club-symbol" style={{ display: 'flex', alignItems: 'center', gap: '8px', zIndex: 1, marginTop: '4px' }}>
              <Shield size={16} />
              <span>{club.symbol || 'بدون رمز'}</span>
            </div>
          </div>
        ))}
        {filteredClubs.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', background: 'var(--card-bg)', borderRadius: '16px', color: 'var(--text-muted)' }}>
            <Shield size={64} style={{ opacity: 0.2, marginBottom: '16px' }} />
            <h3>{clubs.length === 0 ? 'لا توجد أندية مضافة' : 'لا توجد نتائج للبحث'}</h3>
            <p>{clubs.length === 0 ? 'انقر على "إضافة نادي" للبدء' : 'جرب كلمات بحث مختلفة'}</p>
          </div>
        )}
      </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="task-dialog-overlay" onClick={() => setIsModalOpen(false)} style={{ backdropFilter: 'blur(10px)', backgroundColor: 'rgba(15, 23, 42, 0.6)', animation: 'fadeIn 0.3s ease-out' }}>
          <div className="task-dialog role-dialog" style={{ fontFamily: 'var(--sans)', maxWidth: '550px', width: '95%', borderRadius: '28px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)', display: 'flex', flexDirection: 'column', maxHeight: '92vh', background: 'var(--bg)', animation: 'slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }} onClick={(e) => e.stopPropagation()}>
            
            <div className="dialog-app-bar" style={{ padding: '16px 24px', background: 'var(--card-bg)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', position: 'relative', borderRadius: '28px 28px 0 0' }}>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', right: '24px', background: 'var(--bg)', padding: '10px', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-h)', transition: 'all 0.2s ease', zIndex: 10 }} onMouseOver={e => e.currentTarget.style.background = 'var(--border)'} onMouseOut={e => e.currentTarget.style.background = 'var(--bg)'}>
                <X size={20} />
              </button>
              
              <h2 style={{ margin: '0 auto', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-h)', letterSpacing: '-0.5px', lineHeight: 1, textAlign: 'center', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={24} style={{ color: 'var(--accent)' }} />
                {editingId ? 'تعديل بيانات النادي' : 'إضافة نادي جديد'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
              <div style={{ padding: '32px', overflowY: 'auto', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '20px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'radial-gradient(circle, var(--accent) 0%, transparent 60%)', opacity: 0.05, pointerEvents: 'none' }}></div>
                  
                  <label 
                    title="انقر لرفع الشعار" 
                    style={{ 
                      cursor: 'pointer', 
                      position: 'relative', 
                      width: '120px', 
                      height: '120px', 
                      flexShrink: 0,
                      borderRadius: '24px', 
                      border: formData.logo ? 'none' : '2px dashed var(--accent)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      background: formData.logo ? 'transparent' : 'var(--accent-bg)', 
                      boxShadow: formData.logo ? '0 10px 25px -5px rgba(0,0,0,0.1), 0 0 0 4px var(--bg), 0 0 0 6px var(--accent)' : 'none',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      zIndex: 1
                    }}
                    onMouseOver={e => {
                      if (!formData.logo) {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.background = 'var(--bg)';
                      }
                      const overlay = e.currentTarget.querySelector('.upload-overlay') as HTMLElement;
                      if (overlay) overlay.style.opacity = '1';
                    }}
                    onMouseOut={e => {
                      if (!formData.logo) {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.background = 'var(--accent-bg)';
                      }
                      const overlay = e.currentTarget.querySelector('.upload-overlay') as HTMLElement;
                      if (overlay) overlay.style.opacity = '0';
                    }}
                  >
                    {formData.logo ? (
                      <img src={formData.logo} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '20px', background: '#fff', padding: '8px', boxSizing: 'border-box' }} />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--accent)' }}>
                        <UploadCloud size={36} strokeWidth={1.5} />
                      </div>
                    )}
                    
                    <div 
                      className="upload-overlay"
                      style={{ 
                        position: 'absolute', 
                        inset: 0, 
                        background: 'rgba(0,0,0,0.6)', 
                        backdropFilter: 'blur(2px)',
                        color: 'white', 
                        fontSize: '0.85rem', 
                        fontWeight: 600,
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        borderRadius: formData.logo ? '20px' : '24px',
                        opacity: 0,
                        transition: 'opacity 0.2s ease'
                      }}
                    >
                      <Camera size={24} />
                      {formData.logo ? 'تغيير الشعار' : 'رفع الشعار'}
                    </div>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
                  </label>
                  
                  <div style={{ textAlign: 'center', zIndex: 1 }}>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: 'var(--text-h)', fontWeight: 700 }}>شعار النادي</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>PNG, JPG أو SVG (الحد الأقصى 2MB)</span>
                  </div>
                </div>
                
                <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '20px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <CustomInput 
                    icon={<Shield size={18} />} 
                    label="اسم النادي" 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    required 
                  />
                  
                  <CustomInput 
                    icon={<Shield size={18} />} 
                    label="رمز النادي (مثال: USMA)" 
                    value={formData.symbol} 
                    onChange={(e) => setFormData({...formData, symbol: e.target.value})} 
                    required 
                  />
                </div>

              </div>

              <div className="dialog-actions-section" style={{ padding: '16px 24px', background: 'var(--card-bg)', borderTop: '1px solid var(--border)', display: 'flex', gap: '12px', justifyContent: 'flex-end', alignItems: 'center', zIndex: 10, borderRadius: '0 0 28px 28px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="mc-btn mc-btn-secondary" style={{ padding: '10px 20px', minWidth: '100px', borderRadius: '10px', fontSize: '0.95rem', fontWeight: 600, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', cursor: 'pointer' }}>
                  إلغاء
                </button>
                <button type="submit" className="mc-btn mc-btn-primary" style={{ padding: '10px 24px', minWidth: '140px', borderRadius: '10px', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--accent)', color: 'white', border: 'none', cursor: 'pointer', transition: 'all 0.2s ease' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  {editingId ? 'حفظ التعديلات' : 'إضافة النادي'}
                </button>
              </div>
            </form>
          </div>
          <style>{`
            @keyframes slideUpFade {
              from { opacity: 0; transform: translateY(40px) scale(0.98); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};
