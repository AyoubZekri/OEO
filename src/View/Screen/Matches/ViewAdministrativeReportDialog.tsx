import React, { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import type { Match } from './match_model';
import { SidePanel } from '../../shared/SidePanel';
import { PageLoader } from '../../shared/PageLoader';
import { reportImageApi } from './reportApi';
import { ReportImageView } from './parts/MatchReportImage';
import '../../shared/kit.css';

interface ViewAdministrativeReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  matchData: Match | null;
}

/** The match's report to read (computer): a picture or a PDF of the paper report */
export const ViewAdministrativeReportDialog: React.FC<ViewAdministrativeReportDialogProps> = ({ isOpen, onClose, matchData }) => {
  if (!isOpen || !matchData) return null;
  return <ReportView key={matchData.id} match={matchData} onClose={onClose} />;
};

const ReportView: React.FC<{ match: Match; onClose: () => void }> = ({ match, onClose }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    reportImageApi.get(match.id)
      .then(u => { if (active) setUrl(u); })
      .catch(() => { if (active) setError('حدث خطأ أثناء جلب التقرير.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [match.id]);

  return (
    <SidePanel
      mobile={false}
      icon={FileText}
      title="تقرير المباراة"
      subtitle={[match.match_title, match.opponent].filter(Boolean).join(' · ')}
      onClose={onClose}
      footer={<div className="tk-actions"><button type="button" className="btn-cancel tk-dlg-btn tk-actions-side" onClick={onClose}>إغلاق</button></div>}
    >
      {loading ? <PageLoader mobile={false} text="جاري تحميل التقرير..." />
        : url ? <ReportImageView url={url} />
          : <div className="mr-empty"><FileText size={40} /><strong>{error || 'لم يُرفع التقرير بعد.'}</strong></div>}
    </SidePanel>
  );
};
