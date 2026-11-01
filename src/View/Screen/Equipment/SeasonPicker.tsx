import React from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import './SeasonPicker.css';

/** This sporting season, «2026/2027» (it starts in July) */
export const currentSeason = () => {
  const d = new Date();
  const start = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
  return `${start}/${start + 1}`;
};

/** One season back or forward; a season written another way starts from its first year */
const shiftSeason = (season: string, step: number) => {
  const first = Number((season.match(/\d{4}/) || [])[0]) || Number(currentSeason().slice(0, 4));
  const y = first + step;
  return `${y}/${y + 1}`;
};

/** The season, changed one step at a time with the arrows (‹ 2026/2027 ›) */
export const SeasonPicker: React.FC<{ value: string; onChange: (season: string) => void; label?: string }> = ({ value, onChange, label = 'الموسم الرياضي' }) => (
  <div className="eq-season-field">
    {label && <span className="eq-season-label">{label}</span>}
    <div className="eq-season-pick">
      <button type="button" onClick={() => onChange(shiftSeason(value, -1))} aria-label="الموسم السابق"><ChevronRight size={18} /></button>
      <b dir="ltr">{value || currentSeason()}</b>
      <button type="button" onClick={() => onChange(shiftSeason(value, 1))} aria-label="الموسم التالي"><ChevronLeft size={18} /></button>
    </div>
  </div>
);
