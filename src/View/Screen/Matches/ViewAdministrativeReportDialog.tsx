import React, { useState, useEffect } from 'react';
import { X, FileText, MapPin, AlertTriangle, ClipboardList, CheckCircle2, XCircle, Users, Package, Home, ShieldAlert, AlertCircle, FileWarning, Gavel, Calendar, Printer } from 'lucide-react';
import axios from 'axios';
import { Applink } from '../../../LinkApi';
import {type Match } from './match_model';

interface ViewAdministrativeReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  matchData: Match | null;
}

export const ViewAdministrativeReportDialog: React.FC<ViewAdministrativeReportDialogProps> = ({
  isOpen,
  onClose,
  matchData
}) => {
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && matchData) {
      fetchReport();
    } else {
      setReportData(null);
      setError('');
    }
  }, [isOpen, matchData]);

  const fetchReport = async () => {
    setIsLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(Applink.getAdministrativeReport(matchData!.id), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.data && response.data.status === 'success' && response.data.data) {
        setReportData(response.data.data);
      } else {
        // Just empty report if null but HTTP 200
        setError('لا يوجد تقرير إداري لهذه المباراة بعد.');
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
         setError('لا يوجد تقرير إداري لهذه المباراة بعد.');
      } else {
         setError('حدث خطأ أثناء جلب التقرير. يرجى المحاولة مرة أخرى.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  const renderFieldValue = (value: any, isBoolean: boolean = false) => {
    if (isBoolean) {
      return value === true ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: 700, background: 'rgba(16, 185, 129, 0.1)', padding: '4px 12px', borderRadius: '8px', fontSize: '0.9rem' }}>
          <CheckCircle2 size={16} /> نعم
        </span>
      ) : (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontWeight: 700, background: 'rgba(239, 68, 68, 0.1)', padding: '4px 12px', borderRadius: '8px', fontSize: '0.9rem' }}>
          <XCircle size={16} /> لا
        </span>
      );
    }
    
    if (!value || value.trim() === '') {
      return <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>لا يوجد ملاحظات</span>;
    }
    
    return <div style={{ color: 'var(--text-h)', fontWeight: 500, fontSize: '0.95rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{value}</div>;
  };

  return (
    <div className="task-dialog-overlay" onClick={onClose} style={{ 
      backdropFilter: 'blur(10px)', 
      backgroundColor: 'rgba(15, 23, 42, 0.7)',
      animation: 'fadeIn 0.3s ease-out',
      zIndex: 1000
    }}>
      <div 
        className="task-dialog role-dialog view-report-dialog" 
        style={{ 
          fontFamily: 'var(--sans)', maxWidth: '950px', width: '95%', 
          borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)', 
          display: 'flex', flexDirection: 'column', maxHeight: '92vh',
          background: 'var(--bg)',
          animation: 'slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="dialog-app-bar hide-on-print" style={{ 
          padding: '24px 32px',
          background: 'var(--card-bg)', 
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderRadius: '24px 24px 0 0'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ 
                background: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)', 
                padding: '14px', 
                borderRadius: '16px',
                boxShadow: '0 4px 15px rgba(14, 165, 233, 0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <FileText size={26} color="white" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-h)', letterSpacing: '-0.5px' }}>عرض التقرير الإداري</h2>
                <p style={{ margin: '6px 0 0', color: 'var(--text-p)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-h)', padding: '4px 12px', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem'}}>
                    {matchData?.match_title}
                  </span>
                  <span style={{color: 'var(--text-muted)'}}>•</span>
                  <span style={{fontWeight: 600, color: 'var(--text-h)'}}>{matchData?.opponent}</span>
                </p>
              </div>
            </div>
          </div>
          <div style={{display: 'flex', gap: '12px'}}>
            {reportData && !error && (
              <button type="button" onClick={handlePrint} style={{
                background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-h)', 
                height: '44px', padding: '0 16px', borderRadius: '12px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }} onMouseOver={e => {e.currentTarget.style.background = 'var(--border)'; e.currentTarget.style.transform = 'translateY(-2px)'}}
                 onMouseOut={e => {e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.transform = 'translateY(0)'}}
              >
                <Printer size={18} /> طباعة
              </button>
            )}
            <button type="button" onClick={onClose} style={{
              background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-h)', 
              width: '44px', height: '44px', borderRadius: '50%', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }} onMouseOver={e => {e.currentTarget.style.background = 'var(--border)'; e.currentTarget.style.transform = 'rotate(90deg)'}}
               onMouseOut={e => {e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.transform = 'rotate(0deg)'}}
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ overflowY: 'auto', flexGrow: 1, padding: '32px', background: 'var(--bg)' }} className="print-content">
          
          {/* Print Header (Only visible in print) */}
          <div className="show-on-print" style={{ display: 'none', marginBottom: '30px', textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '20px' }}>
            <h1 style={{ fontSize: '24px', margin: '0 0 10px 0' }}>التقرير الإداري للمباراة</h1>
            <h3 style={{ margin: '0 0 5px 0' }}>المباراة: {matchData?.match_title} | الخصم: {matchData?.opponent}</h3>
            <p style={{ margin: 0, color: '#555' }}>التاريخ: {matchData?.match_date ? new Date(matchData.match_date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : ''} | الوقت: {matchData?.match_date ? new Date(matchData.match_date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : ''}</p>
          </div>

          {isLoading ? (
             <div style={{ padding: '100px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
               <div style={{ width: '40px', height: '40px', border: '4px solid var(--border)', borderTop: '4px solid #0ea5e9', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
               <div style={{ color: 'var(--text-p)', fontWeight: 600, fontSize: '1.1rem' }}>جاري تحميل التقرير...</div>
             </div>
          ) : error ? (
            <div style={{ padding: '60px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', background: 'var(--card-bg)', borderRadius: '20px', border: '1px dashed var(--border)' }}>
              <div style={{ background: 'rgba(100, 116, 139, 0.1)', padding: '20px', borderRadius: '50%', color: 'var(--text-muted)' }}>
                <FileText size={48} />
              </div>
              <div>
                <h3 style={{ margin: '0 0 8px', color: 'var(--text-h)', fontSize: '1.3rem' }}>{error}</h3>
                <p style={{ margin: 0, color: 'var(--text-p)' }}>يمكنك إضافة تقرير إداري بالنقر على زر "التقرير الإداري".</p>
              </div>
              <button onClick={onClose} className="mc-btn mc-btn-primary" style={{marginTop: '16px'}}>حسناً</button>
            </div>
          ) : reportData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Report Metadata */}
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }} className="hide-on-print">
                <div style={{ background: 'var(--card-bg)', padding: '12px 20px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Calendar size={18} color="var(--text-muted)" />
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-p)' }}>تاريخ الإنشاء</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-h)' }}>{new Date(reportData.report_date || reportData.created_at).toLocaleDateString('ar-SA')}</div>
                  </div>
                </div>
              </div>

              {/* Section 1: Logistics */}
              <div style={{ background: 'var(--card-bg)', borderRadius: '20px', padding: '28px', border: '1px solid var(--border)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }} className="print-section">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                  <div style={{ background: 'rgba(14, 165, 233, 0.1)', padding: '10px', borderRadius: '12px', color: '#0ea5e9' }}>
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, color: '#0ea5e9', fontWeight: 800, fontSize: '1.3rem' }}>التقييم اللوجستي</h3>
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                  <div style={{ background: 'var(--bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-p)', marginBottom: '12px', fontSize: '0.9rem', fontWeight: 600 }}>
                      <MapPin size={16} /> هل تم التنقل حسب البرنامج؟
                    </div>
                    {renderFieldValue(reportData.travel_as_planned, true)}
                  </div>
                  
                  <div style={{ background: 'var(--bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-p)', marginBottom: '12px', fontSize: '0.9rem', fontWeight: 600 }}>
                      <Users size={16} /> حالة الحضور
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--text-h)', fontSize: '1.1rem' }}>
                      {reportData.attendance_status || 'غير محدد'}
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-p)', marginBottom: '12px', fontSize: '0.9rem', fontWeight: 600 }}>
                      <Package size={16} /> حالة المعدات
                    </div>
                    <div style={{ fontWeight: 700, color: reportData.equipment_status === 'كاملة' ? '#10b981' : '#f59e0b', fontSize: '1.1rem' }}>
                      {reportData.equipment_status || 'غير محدد'}
                    </div>
                  </div>
                </div>

                {reportData.equipment_notes && (
                  <div style={{ marginTop: '20px', background: 'rgba(245, 158, 11, 0.05)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                    <div style={{ color: '#f59e0b', fontWeight: 700, marginBottom: '8px', fontSize: '0.9rem' }}>نقص المعدات:</div>
                    {renderFieldValue(reportData.equipment_notes)}
                  </div>
                )}

                <div style={{ marginTop: '20px', background: 'var(--bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-p)', marginBottom: '12px', fontSize: '0.9rem', fontWeight: 600 }}>
                    <Home size={16} /> ملاحظات الإقامة والإعاشة
                  </div>
                  {renderFieldValue(reportData.accommodation_catering_notes)}
                </div>
              </div>

              {/* Section 2: Incidents */}
              <div style={{ background: 'var(--card-bg)', borderRadius: '20px', padding: '28px', border: '1px solid var(--border)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }} className="print-section">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                  <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '10px', borderRadius: '12px', color: '#f59e0b' }}>
                    <ShieldAlert size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, color: '#f59e0b', fontWeight: 800, fontSize: '1.3rem' }}>الحوادث والملاحظات الهامة</h3>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ background: 'var(--bg)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', marginBottom: '12px', fontSize: '1rem', fontWeight: 700 }}>
                      <AlertCircle size={18} /> الحوادث التنظيمية
                    </div>
                    {renderFieldValue(reportData.organizational_incidents)}
                  </div>

                  <div style={{ background: 'var(--bg)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', marginBottom: '12px', fontSize: '1rem', fontWeight: 700 }}>
                      <FileWarning size={18} /> الحوادث الانضباطية
                    </div>
                    {renderFieldValue(reportData.disciplinary_incidents)}
                  </div>

                  <div style={{ background: 'var(--bg)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-h)', marginBottom: '12px', fontSize: '1rem', fontWeight: 700 }}>
                      <Gavel size={18} /> ملاحظات التحكيم (إدارياً)
                    </div>
                    {renderFieldValue(reportData.refereeing_notes)}
                  </div>
                </div>
              </div>

              {/* Section 3: Recommendations */}
              <div style={{ background: 'var(--card-bg)', borderRadius: '20px', padding: '28px', border: '1px solid var(--border)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }} className="print-section">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '12px', color: '#10b981' }}>
                    <ClipboardList size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, color: '#10b981', fontWeight: 800, fontSize: '1.3rem' }}>التوصيات والإجراءات المطلوبة</h3>
                  </div>
                </div>
                
                <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  {renderFieldValue(reportData.required_actions)}
                </div>
              </div>

            </div>
          ) : null}
        </div>
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
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media print {
          body * {
            visibility: hidden;
          }
          .view-report-dialog, .view-report-dialog * {
            visibility: visible;
          }
          .view-report-dialog {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: 100%;
            height: auto;
            max-height: none;
            box-shadow: none !important;
            border-radius: 0 !important;
            background: white !important;
          }
          .hide-on-print {
            display: none !important;
          }
          .show-on-print {
            display: block !important;
          }
          .print-section {
            break-inside: avoid;
            page-break-inside: avoid;
            background: white !important;
            border: 1px solid #ccc !important;
            margin-bottom: 20px;
          }
          .print-content {
            padding: 0 !important;
          }
          * {
            color: black !important;
          }
        }
      `}</style>
    </div>
  );
};
