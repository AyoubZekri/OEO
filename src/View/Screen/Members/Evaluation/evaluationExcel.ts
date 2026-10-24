import type { Workbook, Worksheet, CellValue } from 'exceljs';

/** An active player the sheet lists */
export interface SheetPlayer { id: string; name: string; team: string }

/** The criteria, as in the evaluation form: the API's key and the maximum mark */
export const CRITERIA = [
  { key: 'scoreDiscipline', label: 'الانضباط', max: 10 },
  { key: 'scoreFitness', label: 'الجانب البدني', max: 15 },
  { key: 'scoreTechnical', label: 'الجانب التقني', max: 20 },
  { key: 'scoreTactical', label: 'الجانب التكتيكي', max: 15 },
  { key: 'scoreMatchPerformance', label: 'المردود في المباريات', max: 20 },
  { key: 'scoreInstructions', label: 'تطبيق التعليمات', max: 10 },
  { key: 'scoreBehavior', label: 'السلوك', max: 10 },
] as const;
export type CriterionKey = typeof CRITERIA[number]['key'];
export const TOTAL_MAX = CRITERIA.reduce((s, c) => s + c.max, 0);

/** The recommendations, as in the evaluation form */
export const RECOMMENDATIONS = [
  'استمرار عادي', 'برنامج تحسين', 'متابعة خاصة', 'إعادة تقييم بعد مدة محددة', 'تقييم شامل عند نهاية الذهاب', 'مراجعة الوضعية الرياضية/التعاقدية',
];

/** One row of the filled sheet, checked */
export interface EvaluationRow {
  line: number;
  playerId: string;
  name: string;
  scores: Partial<Record<CriterionKey, number>>;
  total: number;
  strengths: string;
  weaknesses: string;
  recommendation: string;
  errors: string[];
}

const SHEET = 'التقييم';
const LISTS = 'القوائم';
const ORANGE = 'FFF97316';
const NAVY = 'FF0F172A';
// The columns: the player (its id hidden), the criteria, then the notes
const ID_COL = 1;
const NAME_COL = 2;
const TEAM_COL = 3;
const FIRST_SCORE = 4;
const STRENGTHS = FIRST_SCORE + CRITERIA.length;
const WEAKNESSES = STRENGTHS + 1;
const RECOMMENDATION = WEAKNESSES + 1;

const loadExcel = async () => (await import('exceljs')).default;

/**
 * Downloads the sheet: one line per active player (its id in a hidden column), a column per criterion that only takes
 * a whole mark within its maximum, the strengths and weaknesses, and the recommendation from a list.
 */
export const downloadEvaluationSheet = async (players: SheetPlayer[], heading: string) => {
  const ExcelJS = await loadExcel();
  const wb: Workbook = new ExcelJS.Workbook();
  wb.creator = 'أولمبي الوادي';

  const ls = wb.addWorksheet(LISTS, { state: 'veryHidden' });
  RECOMMENDATIONS.forEach((r, i) => { ls.getCell(i + 1, 1).value = r; });

  const ws = wb.addWorksheet(SHEET, { views: [{ rightToLeft: true, state: 'frozen', ySplit: 2, xSplit: NAME_COL }] });
  ws.columns = [
    { width: 8, hidden: true }, { width: 28 }, { width: 18 },
    ...CRITERIA.map(() => ({ width: 14 })),
    { width: 30 }, { width: 30 }, { width: 30 },
  ];

  // Title row
  ws.mergeCells(1, 1, 1, RECOMMENDATION);
  const title = ws.getCell(1, 1);
  title.value = `أولمبي الوادي — تقييم جماعي: ${heading}   (العلامات بالبرتقالي إجبارية)`;
  title.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  title.alignment = { horizontal: 'center', vertical: 'middle' };
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  ws.getRow(1).height = 30;

  // Header row
  const headers = ['المعرّف', 'اللاعب', 'الفئة', ...CRITERIA.map(c => `${c.label} /${c.max} *`), 'نقاط القوة', 'نقاط الضعف', 'التوصية'];
  const header = ws.getRow(2);
  headers.forEach((h, i) => {
    const cell = header.getCell(i + 1);
    const score = i + 1 >= FIRST_SCORE && i + 1 < STRENGTHS;
    cell.value = h;
    cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: score ? ORANGE : 'FF475569' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = { bottom: { style: 'medium', color: { argb: NAVY } } };
  });
  header.height = 34;

  // One line per active player
  const thin = { style: 'thin' as const, color: { argb: 'FFE2E8F0' } };
  players.forEach((p, i) => {
    const row = ws.getRow(3 + i);
    row.height = 20;
    row.getCell(ID_COL).value = Number(p.id);
    row.getCell(NAME_COL).value = p.name;
    row.getCell(TEAM_COL).value = p.team;
    for (let c = 1; c <= RECOMMENDATION; c++) {
      const cell = row.getCell(c);
      cell.border = { top: thin, bottom: thin, left: thin, right: thin };
      cell.alignment = { horizontal: c >= FIRST_SCORE && c < STRENGTHS ? 'center' : 'right', vertical: 'middle', wrapText: c >= STRENGTHS };
      if (i % 2 === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    }
    row.getCell(NAME_COL).font = { bold: true };
    // The marks: whole numbers from 0 to the criterion's maximum
    CRITERIA.forEach((c, k) => {
      row.getCell(FIRST_SCORE + k).dataValidation = {
        type: 'whole', operator: 'between', allowBlank: true, formulae: [0, c.max],
        showErrorMessage: true, errorTitle: 'علامة غير صحيحة', error: `${c.label}: عدد صحيح من 0 إلى ${c.max}`,
      };
    });
    row.getCell(RECOMMENDATION).dataValidation = {
      type: 'list', allowBlank: true, formulae: [`'${LISTS}'!$A$1:$A$${RECOMMENDATIONS.length}`],
      showErrorMessage: true, errorTitle: 'توصية غير موجودة', error: 'اختر التوصية من القائمة',
    };
  });

  // Instructions
  const help = wb.addWorksheet('تعليمات', { views: [{ rightToLeft: true }] });
  help.getColumn(1).width = 95;
  const lines: [string, boolean][] = [
    ['طريقة الاستعمال', true],
    ['1. في صفحة «التقييم» سطر لكل لاعب نشط. لا تغيّر العناوين ولا ترتيب الأعمدة ولا تحذف الأسطر.', false],
    [`2. اكتب علامة كل معيار (عدد صحيح من 0 إلى أقصاه المكتوب في العنوان). المجموع من ${TOTAL_MAX}.`, false],
    ['3. اللاعب الذي تتركه بلا علامات لا يُقيَّم. إذا بدأت تقييم لاعب املأ كل علاماته.', false],
    ['4. نقاط القوة والضعف اختيارية. التوصية: اختر من القائمة المنسدلة.', false],
    ['5. احفظ الملف ثم ارفعه من صفحة الأعضاء ← «تقييم جماعي». ستظهر لك معاينة قبل الحفظ.', false],
  ];
  lines.forEach(([text, bold], i) => {
    const cell = help.getCell(i + 1, 1);
    cell.value = text;
    cell.font = { bold, size: bold ? 13 : 11, color: { argb: bold ? ORANGE : NAVY } };
    cell.alignment = { horizontal: 'right', wrapText: true };
  });

  wb.views = [{ x: 0, y: 0, width: 20000, height: 12000, firstSheet: 1, activeTab: 1, visibility: 'visible' }];
  const buffer = await wb.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `تقييم-جماعي-${heading.replace(/[\\/:*?"<>|\s]+/g, '-')}.xlsx`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

/** A cell's text (rich text, formulas and hyperlinks included) */
const textOf = (v: CellValue): string => {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object' && !(v instanceof Date)) {
    const o = v as { richText?: { text: string }[]; text?: string; result?: unknown };
    if (o.richText) return o.richText.map(t => t.text).join('').trim();
    if (o.text !== undefined) return String(o.text).trim();
    if (o.result !== undefined) return String(o.result).trim();
  }
  return String(v).trim();
};

const same = (a: string, b: string) => a.replace(/\s+/g, ' ').trim() === b.replace(/\s+/g, ' ').trim();

/**
 * Reads a filled sheet: one checked row per player with at least one mark (the others are left out). A player is found
 * by the hidden id, else by name; only the active players. Every mark: a whole number within its maximum.
 */
export const readEvaluationSheet = async (file: File, players: SheetPlayer[]): Promise<EvaluationRow[]> => {
  const ExcelJS = await loadExcel();
  const wb: Workbook = new ExcelJS.Workbook();
  await wb.xlsx.load(await file.arrayBuffer());
  const ws: Worksheet | undefined = wb.getWorksheet(SHEET) || wb.worksheets.find(w => w.state === 'visible');
  if (!ws) throw new Error('لم يتم العثور على صفحة «التقييم» في الملف');

  let headerRow = 0;
  ws.eachRow((row, n) => { if (!headerRow && textOf(row.getCell(NAME_COL).value) === 'اللاعب') headerRow = n; });
  if (!headerRow) throw new Error('الملف لا يطابق النموذج: حمّل النموذج من التطبيق واملأه');

  const rows: EvaluationRow[] = [];
  const seen = new Set<string>();
  ws.eachRow((row, n) => {
    if (n <= headerRow) return;
    const cell = (i: number) => row.getCell(i).value;
    const marks = CRITERIA.map((_, k) => textOf(cell(FIRST_SCORE + k)));
    const notes = [STRENGTHS, WEAKNESSES, RECOMMENDATION].map(i => textOf(cell(i)));
    // A player left without marks: not evaluated
    if (marks.every(m => !m) && notes.every(m => !m)) return;

    const name = textOf(cell(NAME_COL));
    const idText = textOf(cell(ID_COL));
    const player = players.find(p => p.id === idText) || players.find(p => same(p.name, name));
    const r: EvaluationRow = {
      line: n, playerId: player?.id || '', name: player?.name || name || '—', scores: {}, total: 0,
      strengths: notes[0], weaknesses: notes[1], recommendation: notes[2], errors: [],
    };
    if (!player) r.errors.push('ليس لاعباً نشطاً في التطبيق');
    else if (seen.has(player.id)) r.errors.push('اللاعب مكرر في الملف');
    if (player) seen.add(player.id);

    CRITERIA.forEach((c, k) => {
      const m = marks[k];
      if (!m) { r.errors.push(`${c.label} فارغ`); return; }
      const v = Number(m.replace(',', '.'));
      if (!Number.isInteger(v) || v < 0 || v > c.max) { r.errors.push(`${c.label}: من 0 إلى ${c.max}`); return; }
      r.scores[c.key] = v;
      r.total += v;
    });
    if (r.recommendation && !RECOMMENDATIONS.some(x => same(x, r.recommendation))) r.errors.push('توصية غير موجودة في القائمة');
    rows.push(r);
  });
  return rows;
};
