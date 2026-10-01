import React, { useEffect, useState } from 'react';
import { Loader2, MapPin, Users, CalendarX, Check } from 'lucide-react';
import { apiError, taskApi } from '../taskApi';
import { dateText, eventMeta, EVENT_TYPES, parseDate, type TaskEvent } from '../taskUtils';

const DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

/** "الخميس 01/10 · 16:00" */
const whenText = (at: string | null) => {
  const d = parseDate(at);
  if (!d) return 'بدون تاريخ';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${DAYS[d.getDay()]} ${p(d.getDate())}/${p(d.getMonth() + 1)} · ${p(d.getHours())}:${p(d.getMinutes())}`;
};

interface EventPickerProps {
  type: TaskEvent['type'];
  onType: (t: TaskEvent['type']) => void;
  value: TaskEvent | null;
  onChange: (e: TaskEvent | null) => void;
}

/** Match, training session, meeting or travel, then one of the upcoming ones */
export const EventPicker: React.FC<EventPickerProps> = ({ type, onType, value, onChange }) => {
  const [events, setEvents] = useState<Record<string, TaskEvent[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const list = events[type];

  useEffect(() => {
    if (events[type]) return;
    let alive = true;
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- loading the list from the server */
    setLoading(true);
    setError('');
    taskApi.events(type)
      .then(data => { if (alive) setEvents(prev => ({ ...prev, [type]: data })); })
      .catch(e => { if (alive) setError(apiError(e, 'تعذر تحميل القائمة')); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [type, events]);

  const pickType = (t: TaskEvent['type']) => {
    if (t === type) return;
    onType(t);
    onChange(null);
  };

  return (
    <div className="tk-event-picker">
      <div className="tk-seg four">
        {EVENT_TYPES.map(e => (
          <button key={e.value} type="button" className={type === e.value ? 'on' : ''} onClick={() => pickType(e.value)}><e.icon size={15} />{e.label}</button>
        ))}
      </div>

      <div className="tk-event-list" role="listbox" aria-label={eventMeta(type).list}>
        {loading && !list ? (
          <p className="tk-muted center"><Loader2 size={15} className="tk-spin" />جاري التحميل...</p>
        ) : error ? (
          <p className="tk-muted center">{error}</p>
        ) : !list?.length ? (
          <p className="tk-muted center"><CalendarX size={16} />{eventMeta(type).empty}</p>
        ) : list.map(e => {
          const on = value?.type === e.type && value.id === e.id;
          const Icon = eventMeta(e.type).icon;
          return (
            <button key={`${e.type}-${e.id}`} type="button" role="option" aria-selected={on} className={`tk-event ${on ? 'on' : ''}`} onClick={() => onChange(on ? null : e)}>
              <span className="tk-event-icon"><Icon size={17} /></span>
              <span className="tk-event-text">
                <strong>{e.title}</strong>
                <small>
                  <b>{whenText(e.at)}</b>
                  {e.team && e.type !== 'training' && <span><Users size={11} />{e.team}</span>}
                  {e.place && <span><MapPin size={11} />{e.place}</span>}
                </small>
              </span>
              <span className="tk-event-check" aria-hidden="true">{on && <Check size={14} />}</span>
            </button>
          );
        })}
      </div>
      {value && <p className="tk-hint">الحدث المختار: {value.title} · {dateText(value.at)}</p>}
    </div>
  );
};
