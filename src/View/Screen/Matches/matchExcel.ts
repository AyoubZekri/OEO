import type { Workbook, Worksheet, CellValue } from 'exceljs';

/** What the template's lists are made of (from the app) */
export interface ExcelLists {
  teams: { id: string; name: string }[];
  coaches: { id: string; name: string }[];
  /** The app's users: the administrator in charge of the match */
  admins: { id: string; name: string }[];
}

/** One row of the filled template, checked */
export interface ImportRow {
  line: number;
  competition: string;
  opponent: string;
  date: string;      // YYYY-MM-DD
  time: string;      // HH:mm
  location: string;
  team: string;
  gatheringPlace: string;
  gatheringTime: string;
  coach: string;
  admin: string;
  teamId: string;
  coachId: string;
  adminId: string;
  errors: string[];
}

const SHEET = 'المباريات';
const LISTS = 'القوائم';
const MAX_ROWS = 300;
const ORANGE = 'FFF97316';
const NAVY = 'FF0F172A';

const COLUMNS: { header: string; key: string; width: number; required?: boolean; note: string }[] = [
  { header: 'المنافسة', key: 'competition', width: 24, required: true, note: 'مثال: البطولة الجهوية' },
  { header: 'الفريق الخصم', key: 'opponent', width: 26, required: true, note: 'اسم الفريق المنافس' },
  { header: 'التاريخ', key: 'date', width: 15, required: true, note: 'يوم/شهر/سنة — مثال: 25/10/2026' },
  { header: 'الساعة', key: 'time', width: 11, required: true, note: 'ساعة:دقيقة — مثال: 15:00' },
  { header: 'المكان / الملعب', key: 'location', width: 26, required: true, note: 'مثال: ملعب 8 ماي' },
  { header: 'الفئة', key: 'team', width: 20, required: true, note: 'اختر من القائمة' },
  { header: 'المدرب', key: 'coach', width: 24, required: true, note: 'اختر من القائمة' },
  { header: 'الإداري المسؤول', key: 'admin', width: 24, required: true, note: 'اختر من القائمة (مستخدمو التطبيق)' },
  { header: 'مكان التجمع', key: 'gatheringPlace', width: 22, note: 'اختياري' },
  { header: 'ساعة التجمع', key: 'gatheringTime', width: 13, note: 'اختياري — نفس يوم المباراة' },
];

const loadExcel = async () => (await import('exceljs')).default;

/** Downloads the template: a styled sheet with dropdowns of the app's categories and coaches, and the instructions */
export const downloadTemplate = async (lists: ExcelLists) => {
  const ExcelJS = await loadExcel();
  const wb: Workbook = new ExcelJS.Workbook();
  wb.creator = 'أولمبي الوادي';

  // The lists the dropdowns read (hidden)
  const ls = wb.addWorksheet(LISTS, { state: 'veryHidden' });
  lists.teams.forEach((t, i) => { ls.getCell(i + 1, 1).value = t.name; });
  lists.coaches.forEach((c, i) => { ls.getCell(i + 1, 2).value = c.name; });
  lists.admins.forEach((u, i) => { ls.getCell(i + 1, 3).value = u.name; });

  const ws = wb.addWorksheet(SHEET, { views: [{ rightToLeft: true, state: 'frozen', ySplit: 2 }] });
  ws.columns = COLUMNS.map(c => ({ key: c.key, width: c.width }));

  // Title row
  ws.mergeCells(1, 1, 1, COLUMNS.length);
  const title = ws.getCell(1, 1);
  title.value = 'أولمبي الوادي — استيراد المباريات   (الخانات بالبرتقالي إجبارية)';
  title.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  title.alignment = { horizontal: 'center', vertical: 'middle' };
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  ws.getRow(1).height = 30;

  // Header row
  const header = ws.getRow(2);
  COLUMNS.forEach((c, i) => {
    const cell = header.getCell(i + 1);
    cell.value = c.required ? `${c.header} *` : c.header;
    cell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: c.required ? ORANGE : 'FF475569' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = { bottom: { style: 'medium', color: { argb: NAVY } } };
    cell.note = c.note;
  });
  header.height = 28;

  // The rows to fill: borders, formats, dropdowns, zebra
  for (let r = 3; r < 3 + MAX_ROWS; r++) {
    const row = ws.getRow(r);
    row.height = 20;
    COLUMNS.forEach((c, i) => {
      const cell = row.getCell(i + 1);
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } }, bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } }, right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
      if (r % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      if (c.key === 'date') {
        cell.numFmt = 'dd/mm/yyyy';
        cell.dataValidation = { type: 'date', operator: 'greaterThan', allowBlank: true, formulae: [new Date(2000, 0, 1)], showErrorMessage: true, errorTitle: 'تاريخ غير صحيح', error: 'اكتب التاريخ بصيغة يوم/شهر/سنة' };
      }
      if (c.key === 'time' || c.key === 'gatheringTime') {
        cell.numFmt = 'hh:mm';
        // A time is a fraction of a day in Excel
        cell.dataValidation = { type: 'decimal', operator: 'between', allowBlank: true, formulae: [0, 0.99999], showErrorMessage: true, errorTitle: 'ساعة غير صحيحة', error: 'اكتب الساعة بصيغة ساعة:دقيقة، مثال 15:00' };
      }
      if (c.key === 'team' && lists.teams.length) {
        cell.dataValidation = { type: 'list', allowBlank: true, formulae: [`'${LISTS}'!$A$1:$A$${lists.teams.length}`], showErrorMessage: true, errorTitle: 'فئة غير موجودة', error: 'اختر الفئة من القائمة' };
      }
      if (c.key === 'coach' && lists.coaches.length) {
        cell.dataValidation = { type: 'list', allowBlank: true, formulae: [`'${LISTS}'!$B$1:$B$${lists.coaches.length}`], showErrorMessage: true, errorTitle: 'مدرب غير موجود', error: 'اختر المدرب من القائمة' };
      }
      if (c.key === 'admin' && lists.admins.length) {
        cell.dataValidation = { type: 'list', allowBlank: true, formulae: [`'${LISTS}'!$C$1:$C$${lists.admins.length}`], showErrorMessage: true, errorTitle: 'مستخدم غير موجود', error: 'اختر الإداري من القائمة' };
      }
    });
  }

  // Instructions
  const help = wb.addWorksheet('تعليمات', { views: [{ rightToLeft: true }] });
  help.getColumn(1).width = 95;
  const lines = [
    ['طريقة الاستعمال', true],
    ['1. املأ صفحة «المباريات»: كل سطر = مباراة واحدة. لا تغيّر العناوين ولا ترتيب الأعمدة.', false],
    ['2. الخانات البرتقالية إجبارية: المنافسة، الفريق الخصم، التاريخ، الساعة، المكان، الفئة، المدرب، الإداري المسؤول.', false],
    ['3. التاريخ: يوم/شهر/سنة (25/10/2026). الساعة: ساعة:دقيقة (15:00).', false],
    ['4. الفئة والمدرب والإداري: اختر من القائمة المنسدلة في الخانة (أسماء التطبيق كما هي).', false],
    ['5. ساعة التجمع تُحسب في نفس يوم المباراة.', false],
    ['6. احفظ الملف ثم ارفعه من صفحة المباريات ← «استيراد من Excel». ستظهر لك معاينة قبل الحفظ.', false],
    ['', false],
    ['مثال', true],
    ['البطولة الجهوية | شباب بسكرة | 25/10/2026 | 15:00 | ملعب 8 ماي | الفريق الأول | اسم المدرب | اسم الإداري | مقر النادي | 13:30', false],
  ] as const;
  lines.forEach(([text, bold], i) => {
    const cell = help.getCell(i + 1, 1);
    cell.value = text;
    cell.font = { bold, size: bold ? 13 : 11, color: { argb: bold ? ORANGE : 'FF0F172A' } };
    cell.alignment = { horizontal: 'right', wrapText: true };
  });

  wb.views = [{ x: 0, y: 0, width: 20000, height: 12000, firstSheet: 1, activeTab: 1, visibility: 'visible' }];
  const buffer = await wb.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'نموذج-استيراد-المباريات.xlsx';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

const pad = (n: number) => String(n).padStart(2, '0');

/** A cell's text (rich text, formulas and hyperlinks included) */
const textOf = (v: CellValue): string => {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'object') {
    const o = v as { richText?: { text: string }[]; text?: string; result?: unknown };
    if (o.richText) return o.richText.map(t => t.text).join('');
    if (o.text !== undefined) return String(o.text);
    if (o.result !== undefined) return String(o.result);
  }
  return String(v).trim();
};

/** A date cell → YYYY-MM-DD (a real date, an Excel serial, or text dd/mm/yyyy or yyyy-mm-dd) */
const dateOf = (v: CellValue): string => {
  if (v instanceof Date) return `${v.getUTCFullYear()}-${pad(v.getUTCMonth() + 1)}-${pad(v.getUTCDate())}`;
  if (typeof v === 'number') {
    const d = new Date(Math.round((v - 25569) * 86400000));
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  }
  const t = textOf(v);
  // Only a day that exists (31/02 or 99/99 are refused)
  const real = (y: number, mo: number, d: number) => {
    const dt = new Date(Date.UTC(y, mo - 1, d));
    return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d ? `${y}-${pad(mo)}-${pad(d)}` : '';
  };
  let m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(t);
  if (m) return real(+m[3], +m[2], +m[1]);
  m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(t);
  if (m) return real(+m[1], +m[2], +m[3]);
  return '';
};

/** A time cell → HH:mm (a real time, a day fraction, or text h:mm) */
const timeOf = (v: CellValue): string => {
  if (v instanceof Date) return `${pad(v.getUTCHours())}:${pad(v.getUTCMinutes())}`;
  if (typeof v === 'number') {
    const mins = Math.round((v % 1) * 1440);
    return `${pad(Math.floor(mins / 60) % 24)}:${pad(mins % 60)}`;
  }
  const m = /^(\d{1,2})[:h.](\d{2})/.exec(textOf(v));
  return m && +m[1] < 24 && +m[2] < 60 ? `${pad(+m[1])}:${m[2]}` : '';
};

const same = (a: string, b: string) => a.replace(/\s+/g, ' ').trim() === b.replace(/\s+/g, ' ').trim();

/** Reads a filled template: one checked row per filled line (empty lines skipped) */
export const readMatchesFile = async (file: File, lists: ExcelLists): Promise<ImportRow[]> => {
  const ExcelJS = await loadExcel();
  const wb: Workbook = new ExcelJS.Workbook();
  await wb.xlsx.load(await file.arrayBuffer());
  const ws: Worksheet | undefined = wb.getWorksheet(SHEET) || wb.worksheets.find(w => w.state === 'visible');
  if (!ws) throw new Error('لم يتم العثور على صفحة «المباريات» في الملف');

  // The header row: the one holding "المنافسة"
  let headerRow = 0;
  ws.eachRow((row, n) => { if (!headerRow && textOf(row.getCell(1).value).replace('*', '').trim() === 'المنافسة') headerRow = n; });
  if (!headerRow) throw new Error('الملف لا يطابق النموذج: حمّل النموذج من التطبيق واملأه');

  const rows: ImportRow[] = [];
  ws.eachRow((row, n) => {
    if (n <= headerRow) return;
    const cell = (i: number) => row.getCell(i).value;
    const values = COLUMNS.map((_, i) => textOf(cell(i + 1)));
    if (values.every(v => !v)) return;

    const r: ImportRow = {
      line: n,
      competition: textOf(cell(1)),
      opponent: textOf(cell(2)),
      date: dateOf(cell(3)),
      time: timeOf(cell(4)),
      location: textOf(cell(5)),
      team: textOf(cell(6)),
      coach: textOf(cell(7)),
      admin: textOf(cell(8)),
      gatheringPlace: textOf(cell(9)),
      gatheringTime: timeOf(cell(10)),
      teamId: '',
      coachId: '',
      adminId: '',
      errors: [],
    };
    if (!r.competition) r.errors.push('المنافسة فارغة');
    if (!r.opponent) r.errors.push('الفريق الخصم فارغ');
    if (!r.date) r.errors.push(textOf(cell(3)) ? 'تاريخ غير صحيح' : 'التاريخ فارغ');
    if (!r.time) r.errors.push(textOf(cell(4)) ? 'ساعة غير صحيحة' : 'الساعة فارغة');
    if (!r.location) r.errors.push('المكان فارغ');
    if (textOf(cell(10)) && !r.gatheringTime) r.errors.push('ساعة التجمع غير صحيحة');
    // The category, the coach and the administrator: required, and as named in the app
    const pick = (value: string, list: { id: string; name: string }[], empty: string, unknown: string) => {
      if (!value) { r.errors.push(empty); return ''; }
      const id = list.find(x => same(x.name, value))?.id || '';
      if (!id) r.errors.push(unknown);
      return id;
    };
    r.teamId = pick(r.team, lists.teams, 'الفئة فارغة', `الفئة «${r.team}» غير موجودة`);
    r.coachId = pick(r.coach, lists.coaches, 'المدرب فارغ', `المدرب «${r.coach}» غير موجود`);
    r.adminId = pick(r.admin, lists.admins, 'الإداري المسؤول فارغ', `المستخدم «${r.admin}» غير موجود`);
    rows.push(r);
  });
  return rows;
};

/** The match a checked row becomes (the same fields as the add form) */
export const payloadOf = (r: ImportRow) => ({
  competition: r.competition,
  opponent: r.opponent,
  match_title: '',
  match_date: `${r.date}T${r.time}`,
  location: r.location,
  gathering_time: r.gatheringTime ? `${r.date}T${r.gatheringTime}` : '',
  gathering_location: r.gatheringPlace,
  coach_id: r.coachId,
  team_id: r.teamId,
  admin_id: r.adminId,
  match_status: 'upcoming',
  opponent_club_id: '',
});
