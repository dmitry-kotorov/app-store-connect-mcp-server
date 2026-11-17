import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";

/**
 * Shaping for Apple's tab-separated report files (sales reports, analytics report
 * segments). A raw monthly sales summary is ~2,600 rows / 500k characters, far
 * beyond a tool result, so callers filter rows, pick columns or aggregate.
 */
export interface ReportShapeOptions {
  /** Column name -> accepted value(s); case-insensitive exact match. */
  filter?: Record<string, string | string[]>;
  /** Aggregate: one output row per distinct combination of these columns. */
  groupBy?: string[];
  /** Numeric columns summed per group (and in the totals line). */
  sum?: string[];
  /** Raw-row mode only: which columns to return (default: all). */
  columns?: string[];
  /** Maximum output rows (default 50, max 1000). */
  limit?: number;
}

/** Columns summed by default when grouping, first one present wins. */
const DEFAULT_SUM_COLUMNS = ['Units', 'Counts'];

interface Table {
  columns: string[];
  rows: string[][];
}

export function parseTsv(text: string): Table {
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length === 0) return { columns: [], rows: [] };
  const columns = lines[0].split('\t').map(c => c.trim());
  const rows = lines.slice(1).map(line => line.split('\t'));
  return { columns, rows };
}

function toList(value: string | string[] | undefined): string[] {
  if (value === undefined || value === null) return [];
  return (Array.isArray(value) ? value : [value]).map(v => String(v));
}

function columnIndex(table: Table, name: string): number {
  const exact = table.columns.indexOf(name);
  if (exact >= 0) return exact;
  const loose = table.columns.findIndex(c => c.toLowerCase() === name.trim().toLowerCase());
  if (loose >= 0) return loose;
  throw new McpError(
    ErrorCode.InvalidParams,
    `Unknown report column "${name}". Available columns: ${table.columns.join(', ')}`
  );
}

const toNumber = (value: string | undefined): number => {
  const n = parseFloat(String(value ?? '').replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
};

const formatNumber = (n: number): string =>
  Number.isInteger(n) ? String(n) : n.toFixed(2);

const clean = (value: string | undefined): string =>
  String(value ?? '').replace(/[\t\r\n]+/g, ' ');

/**
 * Filter, project or aggregate a tab-separated report and render it as compact
 * text: a summary line, the available columns, a totals line and a TSV body.
 */
export function shapeReport(text: string, options: ReportShapeOptions = {}, title = 'Report'): string {
  const table = parseTsv(text);
  if (table.columns.length === 0) return `${title}: empty report.`;

  const limit = Math.min(Math.max(1, Number(options.limit) || 50), 1000);

  const filters = Object.entries(options.filter ?? {})
    .map(([name, value]) => ({
      index: columnIndex(table, name),
      accepted: new Set(toList(value).map(v => v.trim().toLowerCase())),
    }))
    .filter(f => f.accepted.size > 0);

  const matched = table.rows.filter(row =>
    filters.every(f => f.accepted.has(String(row[f.index] ?? '').trim().toLowerCase()))
  );

  const groupBy = toList(options.groupBy);
  let sumColumns = toList(options.sum);
  if (sumColumns.length === 0) {
    const fallback = DEFAULT_SUM_COLUMNS.find(c => table.columns.includes(c));
    if (fallback) sumColumns = [fallback];
  }
  const sumIdx = sumColumns.map(c => columnIndex(table, c));
  const sumNames = sumIdx.map(i => table.columns[i]);

  const totals = sumIdx.map(i => matched.reduce((acc, row) => acc + toNumber(row[i]), 0));
  const header: string[] = [
    `${title}: ${table.rows.length} rows` +
      (filters.length ? `, ${matched.length} match the filter` : ''),
    `Columns: ${table.columns.join(', ')}`,
  ];
  if (sumNames.length) {
    header.push(`Totals (matched rows): ${sumNames.map((n, k) => `${n}=${formatNumber(totals[k])}`).join(', ')}`);
  }

  let outColumns: string[];
  let outRows: string[][];
  let note: string;

  if (groupBy.length > 0) {
    const groupIdx = groupBy.map(c => columnIndex(table, c));
    const groups = new Map<string, { key: string[]; sums: number[]; rows: number }>();
    for (const row of matched) {
      const key = groupIdx.map(i => clean(row[i]));
      const id = key.join('\u0000');
      let g = groups.get(id);
      if (!g) {
        g = { key, sums: sumIdx.map(() => 0), rows: 0 };
        groups.set(id, g);
      }
      sumIdx.forEach((i, k) => { g!.sums[k] += toNumber(row[i]); });
      g.rows += 1;
    }
    const sorted = [...groups.values()].sort((a, b) =>
      sumIdx.length ? b.sums[0] - a.sums[0] : b.rows - a.rows
    );
    outColumns = [...groupIdx.map(i => table.columns[i]), ...sumNames, 'Rows'];
    outRows = sorted.slice(0, limit).map(g => [...g.key, ...g.sums.map(formatNumber), String(g.rows)]);
    note = `Grouped by ${outColumns.slice(0, groupIdx.length).join(', ')}: ${sorted.length} groups` +
      (sorted.length > limit ? `, showing top ${limit}` : '') +
      ` (sorted by ${sumNames[0] ?? 'Rows'} desc).`;
  } else {
    const colIdx = toList(options.columns).length
      ? toList(options.columns).map(c => columnIndex(table, c))
      : table.columns.map((_, i) => i);
    outColumns = colIdx.map(i => table.columns[i]);
    outRows = matched.slice(0, limit).map(row => colIdx.map(i => clean(row[i])));
    note = `Rows: showing ${outRows.length} of ${matched.length}` +
      (matched.length > limit ? ' (raise limit, filter, or use groupBy to aggregate).' : '.');
  }

  return [
    ...header,
    note,
    '',
    outColumns.join('\t'),
    ...outRows.map(r => r.join('\t')),
  ].join('\n');
}
