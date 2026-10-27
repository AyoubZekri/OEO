import React, { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Save, Loader2, AlertCircle, Mic, UserRound, Shapes, ArrowLeft, RotateCcw } from 'lucide-react';
import { SidePanel } from '../../../shared/SidePanel';
import { VoicePlayer } from './VoicePlayer';
import { UserPicker } from '../../../shared/FormBits';
import { VoiceInput } from './VoiceInput';
import { recordInWindow, VOICE_NOTES } from './voiceNote';
import type { TasksAdmin } from '../useTasks';
import { NATURE_META, type Task, type TaskNature } from '../taskUtils';

/** The Android app: the voice note in Google's voice window (the phone shares its microphone with no one) */
const IN_WINDOW = Capacitor.isNativePlatform();

/**
 * A voice note, in two dialogs: first the listening one (it records as soon as it opens, the words written as they
 * are said, and stops by itself once the speaker pauses, like Google's voice window), then who it is for and its nature. Given at once, with no deadline.
 * In the Android app: Google's voice window straight away, then the second one with its words and its recording.
 * Editing starts on the second one (the recording can be done again from there).
 */
export const VoiceTaskForm: React.FC<{ c: TasksAdmin; task?: Task; mobile: boolean }> = ({ c, task, mobile }) => {
  const [step, setStep] = useState<'listen' | 'details'>(task || IN_WINDOW ? 'details' : 'listen');
  // Google's voice window open (the Android app)
  const [capturing, setCapturing] = useState(false);
  const [text, setText] = useState(task ? task.details || task.title : '');
  // The voice itself (recorded with its words); editing: the one kept until it is recorded again
  const [audio, setAudio] = useState<Blob | null>(null);
  const [heard, setHeard] = useState(task?.audio_url || '');
  const [assignee, setAssignee] = useState(String(task?.assignee?.id ?? ''));
  const [nature, setNature] = useState<TaskNature | ''>(task?.nature || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const spoken = text.trim();

  // The new recording, to listen to before sending
  useEffect(() => {
    if (!audio) return;
    const url = URL.createObjectURL(audio);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the recording's own link, while it is shown
    setHeard(url);
    return () => URL.revokeObjectURL(url);
  }, [audio]);

  // The Android app: Google's voice window; what it heard replaces the words and the recording (nothing heard: as it was)
  const capture = async () => {
    setCapturing(true);
    setError('');
    try {
      const r = await recordInWindow();
      if (r.text) {
        setText(r.text);
        setAudio(r.audio);
        if (!r.audio) setHeard('');
      } else if (!spoken) c.closeForm();
    } catch {
      setError('تعذر التسجيل، أعد المحاولة');
    } finally {
      setCapturing(false);
    }
  };

  // A new one in the Android app: the voice window as soon as it opens
  const opened = useRef(false);
  useEffect(() => {
    if (!IN_WINDOW || task || opened.current) return;
    opened.current = true;
    capture();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, when it opens
  }, []);

  const save = async () => {
    if (!assignee) return setError('اختر المكلّف');
    if (!nature) return setError('اختر طبيعة التنبيه');
    setError('');
    setSaving(true);
    try {
      await c.save({
        ...(task ? { id: task.id } : {}),
        // A long note: its start as the title, all of it in the details
        title: spoken.length > 200 ? `${spoken.slice(0, 197)}…` : spoken,
        details: spoken.length > 200 ? spoken : null,
        kind: 'voice',
        nature,
        assignee_id: Number(assignee),
        audio,
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (step === 'listen') {
    return (
      <SidePanel
        mobile={mobile}
        layer={2}
        size="sm"
        icon={Mic}
        title="تنبيه صوتي"
        onClose={c.closeForm}
        footer={(
          <>
            {!mobile && <button type="button" className="btn-cancel tk-dlg-btn" onClick={c.closeForm}>إلغاء</button>}
            <button type="button" className={`tk-btn primary ${mobile ? 'block' : 'tk-dlg-btn'}`} onClick={() => setStep('details')} disabled={!spoken}>
              التالي<ArrowLeft size={17} />
            </button>
          </>
        )}
      >
        <div className="tk-form calm">
          <VoiceInput value={text} onChange={setText} onAudio={setAudio} autoStart once onDone={() => setStep(t => (text.trim() ? 'details' : t))} />
        </div>
      </SidePanel>
    );
  }

  return (
    <SidePanel
      mobile={mobile}
      layer={2}
      size="sm"
      icon={Mic}
      title={task ? 'تعديل التنبيه الصوتي' : 'تنبيه صوتي'}
      onClose={c.closeForm}
      footer={(
        <>
          {!mobile && <button type="button" className="btn-cancel tk-dlg-btn" onClick={c.closeForm}>إلغاء</button>}
          <button type="button" className={`tk-btn primary ${mobile ? 'block' : 'tk-dlg-btn'}`} onClick={save} disabled={saving || capturing || !spoken}>
            {saving ? <Loader2 size={17} className="tk-spin" /> : <Save size={17} />}
            {task ? 'حفظ التعديلات' : 'إرسال التنبيه'}
          </button>
        </>
      )}
    >
      <div className="tk-form calm">
        <div className="tk-field">
          <span className="tk-label"><Mic size={14} />التنبيه</span>
          {capturing && !spoken ? <p className="tsk-voice-quote"><Loader2 size={18} className="tk-spin" /></p> : <p className="tsk-voice-quote">{spoken}</p>}
          {heard && <VoicePlayer src={heard} />}
          {VOICE_NOTES && <button
            type="button"
            className="tk-btn ghost sm"
            disabled={capturing}
            onClick={() => {
              if (IN_WINDOW) return capture();
              setText('');
              setAudio(null);
              setHeard('');
              setStep('listen');
            }}
          >
            {capturing ? <Loader2 size={15} className="tk-spin" /> : <RotateCcw size={15} />}إعادة التسجيل
          </button>}
        </div>

        <UserPicker mobile={mobile} label="المكلّف" icon={UserRound} value={assignee} users={c.users} onChange={v => { setAssignee(v); setError(''); }} placeholder="اختر العضو" />

        <div className="tk-field">
          <span className="tk-label"><Shapes size={14} />طبيعة التنبيه</span>
          <div className="tk-seg three tsk-nature">
            {(Object.keys(NATURE_META) as TaskNature[]).map(n => {
              const meta = NATURE_META[n];
              return <button key={n} type="button" className={nature === n ? 'on' : ''} onClick={() => { setNature(n); setError(''); }}><meta.icon size={15} />{meta.label}</button>;
            })}
          </div>
        </div>

        {error && <p className="tk-error"><AlertCircle size={15} />{error}</p>}
      </div>
    </SidePanel>
  );
};
