import React, { useEffect, useState } from 'react';
import { FileText, FileUp } from 'lucide-react';
import { MobileScreen } from '../widgets/MobileScreen';
import { MobileLoader } from '../widgets/MobileLoader';
import type { Match } from '../../Screen/Matches/match_model';
import { reportImageApi } from '../../Screen/Matches/reportApi';
import { ReportImageView } from '../../Screen/Matches/parts/MatchReportImage';
import { MatchStrip } from './MatchStrip';
import '../MobileEvaluations/MobileEvaluations.css';
import { StateIcon } from '../../widget/StateIcon';

// ── The match's report to read (phone version of ViewAdministrativeReportDialog): a picture or a PDF of the paper report ──
export const MobileMatchReport: React.FC<{ match: Match; onEdit: () => void; onClose: () => void }> = ({ match, onEdit, onClose }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    reportImageApi.get(match.id)
      .then(u => { if (active) setUrl(u); })
      .catch(() => { if (active) setError('حدث خطأ أثناء جلب التقرير. يرجى المحاولة مرة أخرى.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [match.id]);

  return (
    <MobileScreen
      title="تقرير المباراة"
      layer={2}
      onBack={onClose}
      footer={!loading && (
        <button type="button" className="me-btn primary" onClick={onEdit}>
          <FileUp size={18} /> {url ? 'تغيير التقرير' : 'رفع التقرير'}
        </button>
      )}
    >
      <MatchStrip match={match} label="تقرير المباراة" icon={FileText} />

      {loading ? (
        <MobileLoader text="جاري تحميل التقرير..." />
      ) : url ? (
        <section className="mp-section"><ReportImageView url={url} /></section>
      ) : (
        <StateIcon failed={Boolean(error)} />
      )}
    </MobileScreen>
  );
};
