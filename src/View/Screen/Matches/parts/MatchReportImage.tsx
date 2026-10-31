import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FilePlus2, FileText, RefreshCw, Maximize2, AlertCircle, FileUp, Save, Loader2, ExternalLink } from 'lucide-react';
import { compressDocumentImage } from '../../../../core/functions/compressDocumentImage';
import { openDocument } from '../../../widget/openDocument';
import { SidePanel } from '../../../shared/SidePanel';
import { PageLoader } from '../../../shared/PageLoader';
import { apiError } from '../../Travels/travelUtils';
import { reportImageApi } from '../reportApi';
import type { Match } from '../match_model';
import '../../../shared/kit.css';
import './MatchReport.css';

/** A report sent as a PDF (by its type, or by its saved link) */
const isPdf = (file: File | null, url: string | null) =>
  file ? file.type === 'application/pdf' : Boolean(url && /\.pdf($|\?)/i.test(url));

/** A PDF report: its card (a PDF has no preview here), opened in the app's viewer */
const PdfCard: React.FC<{ name: string; onOpen?: () => void }> = ({ name, onOpen }) => (
  <button type="button" className="mr-pdf" onClick={onOpen} disabled={!onOpen}>
    <span><FileText size={28} /></span>
    <span className="mr-pdf-text">
      <strong>{name}</strong>
      <small>ملف PDF</small>
    </span>
    {onOpen && <ExternalLink size={17} className="mr-pdf-go" />}
  </button>
);

/**
 * Picking the report: a picture (camera or gallery on a phone) or a PDF — a box to choose it, then its preview (a
 * PDF: its card) with «تغيير». A large picture is made smaller before it is sent. current: the one already saved,
 * shown until another is chosen.
 */
const ReportImagePicker: React.FC<{ current: string | null; file: File | null; onPick: (f: File) => void; error?: string }> = ({
  current, file, onPick, error,
}) => {
  const input = useRef<HTMLInputElement>(null);
  const [problem, setProblem] = useState('');

  // The chosen file's preview; the one before it freed once replaced
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  const shownBefore = useRef<string | null>(null);
  useEffect(() => {
    const old = shownBefore.current;
    shownBefore.current = preview;
    if (old && old !== preview) URL.revokeObjectURL(old);
  }, [preview]);

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files?.[0];
    e.target.value = '';
    if (!chosen) return;
    if (!chosen.type.startsWith('image/') && chosen.type !== 'application/pdf') return setProblem('اختر صورة أو ملف PDF');
    try {
      setProblem('');
      onPick(await compressDocumentImage(chosen, 5));
    } catch (err) {
      setProblem((err as Error).message);
    }
  };

  const shown = preview || current;
  const message = problem || error;
  const change = (
    <button type="button" className="mr-pick-change" onClick={() => input.current?.click()}>
      <RefreshCw size={16} />تغيير
    </button>
  );

  return (
    <div className="mr-pick">
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" hidden onChange={pick} />
      {shown && isPdf(file, current) ? (
        <div className="mr-pick-file">
          <PdfCard name={file?.name || 'ملف التقرير'} onOpen={file ? undefined : () => openDocument(current, 'تقرير المباراة')} />
          {change}
        </div>
      ) : shown ? (
        <div className="mr-pick-preview">
          <img src={shown} alt="صورة التقرير" />
          {change}
        </div>
      ) : (
        <button type="button" className={`mr-pick-empty ${message ? 'bad' : ''}`} onClick={() => input.current?.click()}>
          <span><FilePlus2 size={30} /></span>
          <strong>رفع التقرير</strong>
        </button>
      )}
      {message && <p className="mr-error"><AlertCircle size={14} />{message}</p>}
    </div>
  );
};

/** «رفع التقرير» (a match's ⋮, once it is over): a picture or a PDF of the paper report */
export const MatchReportImageDialog: React.FC<{ match: Match; mobile: boolean; onClose: () => void }> = ({ match, mobile, onClose }) => {
  const [current, setCurrent] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    reportImageApi.get(match.id)
      .then(url => { if (active) setCurrent(url); })
      .catch(() => undefined)
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [match.id]);

  const save = async () => {
    if (!file) return setError(current ? 'اختر صورة أو ملفاً آخر لتغييره' : 'أرفق صورة أو ملف التقرير');
    setSaving(true);
    setError('');
    try {
      await reportImageApi.save(match.id, file);
      onClose();
    } catch (e) {
      setError(apiError(e));
      setSaving(false);
    }
  };

  return (
    <SidePanel
      mobile={mobile}
      layer={3}
      icon={FileUp}
      title="رفع التقرير"
      subtitle={[match.match_title, match.opponent].filter(Boolean).join(' · ')}
      onClose={onClose}
      footer={(
        <>
          {!mobile && <button type="button" className="btn-cancel tk-dlg-btn" onClick={onClose}>إلغاء</button>}
          <button type="button" className={`tk-btn primary ${mobile ? 'block' : 'tk-dlg-btn'}`} onClick={save} disabled={saving || loading}>
            {saving ? <Loader2 size={17} className="tk-spin" /> : <Save size={17} />}حفظ التقرير
          </button>
        </>
      )}
    >
      {loading
        ? <PageLoader mobile={mobile} text="جاري التحميل..." />
        : <ReportImagePicker current={current} file={file} onPick={f => { setFile(f); setError(''); }} error={error} />}
    </SidePanel>
  );
};

/** The report in its view (computer and phone): its picture, or its PDF's card — opened large in the app's viewer */
export const ReportImageView: React.FC<{ url: string }> = ({ url }) => (isPdf(null, url)
  ? <PdfCard name="ملف التقرير" onOpen={() => openDocument(url, 'تقرير المباراة')} />
  : (
    <button type="button" className="mr-view" onClick={() => openDocument(url, 'تقرير المباراة')}>
      <img src={url} alt="صورة التقرير" />
      <span className="mr-view-open"><Maximize2 size={15} />عرض الصورة</span>
    </button>
  ));
