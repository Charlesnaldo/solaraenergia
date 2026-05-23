import { extractPixPayload, normalizePixPayload, validatePixPayload } from '@/lib/itau/bolecode';

export function formatCurrencyBRL(value: number) {
  const amount = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

  return `R$ ${amount}`;
}

export function money(value: number) {
  return formatCurrencyBRL(value);
}

export function formatDateBR(value: string | Date | null | undefined) {
  if (!value) return 'Nao informado';
  const date = value instanceof Date ? value : new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return 'Nao informado';
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(date);
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

export function maskCpfCnpj(value: string | null | undefined) {
  const digits = onlyDigits(value ?? '');
  if (digits.length === 11)
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  if (digits.length === 14)
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  return clean(value);
}

type Matrix = boolean[][];

const ECC_CODEWORDS_PER_BLOCK = [
  [-1, -1, -1, -1],
  [7, 10, 13, 17], [10, 16, 22, 28], [15, 26, 36, 44], [20, 36, 52, 64],
  [26, 48, 72, 88], [18, 64, 96, 112], [20, 72, 108, 130], [24, 88, 132, 156],
  [30, 110, 160, 192], [18, 130, 192, 224], [20, 150, 224, 264], [24, 176, 260, 308],
  [26, 198, 288, 352], [30, 216, 320, 384], [22, 240, 360, 432], [24, 280, 408, 480],
  [28, 308, 448, 532], [30, 338, 504, 588], [28, 364, 546, 650], [28, 416, 600, 700],
  [28, 442, 644, 750], [28, 476, 690, 816], [30, 504, 750, 900], [30, 560, 810, 960],
  [26, 588, 870, 1050], [28, 644, 952, 1110], [30, 700, 1020, 1200], [30, 728, 1050, 1260],
  [30, 784, 1140, 1350], [30, 812, 1200, 1440], [30, 868, 1290, 1530], [30, 924, 1350, 1620],
  [30, 980, 1440, 1710], [30, 1036, 1530, 1800], [30, 1064, 1590, 1890], [30, 1120, 1680, 1980],
  [30, 1204, 1770, 2100], [30, 1260, 1860, 2220], [30, 1316, 1950, 2310], [30, 1372, 2040, 2430],
];

const NUM_ERROR_CORRECTION_BLOCKS = [
  [-1, -1, -1, -1],
  [1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 2, 2], [1, 2, 2, 4],
  [1, 2, 4, 4], [2, 4, 4, 4], [2, 4, 6, 5], [2, 4, 6, 6],
  [2, 5, 8, 8], [4, 5, 8, 8], [4, 5, 8, 11], [4, 8, 10, 11],
  [4, 9, 12, 16], [4, 9, 16, 16], [6, 10, 12, 18], [6, 10, 17, 16],
  [6, 11, 16, 19], [6, 13, 18, 21], [7, 14, 21, 25], [8, 16, 20, 25],
  [8, 17, 23, 25], [9, 17, 23, 34], [9, 18, 25, 30], [10, 20, 27, 32],
  [12, 21, 29, 35], [12, 23, 34, 37], [12, 25, 34, 40], [13, 26, 35, 42],
  [14, 28, 38, 45], [15, 29, 40, 48], [16, 31, 43, 51], [17, 33, 45, 54],
  [18, 35, 48, 57], [19, 37, 51, 60], [19, 38, 53, 63], [20, 40, 56, 66],
  [21, 43, 59, 70], [22, 45, 62, 74], [24, 47, 65, 77], [25, 49, 68, 81],
];

const ITF_PATTERNS: Record<string, string> = {
  '0': '00110', '1': '10001', '2': '01001', '3': '11000', '4': '00101',
  '5': '10100', '6': '01100', '7': '00011', '8': '10010', '9': '01010',
};

// ─── PDF Primitives ────────────────────────────────────────────────────────────

function escapePdfText(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function clean(value: string | null | undefined) {
  return value?.trim() || 'Nao informado';
}

function wrap(value: string, maxLength: number) {
  const text = value.trim();
  if (text.length <= maxLength) return [text];

  // Break on word boundaries first; fall back to hard break only if a single
  // word exceeds maxLength (e.g. a very long barcode or URL).
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if (!current) {
      // Single word longer than maxLength: hard-break it
      if (word.length > maxLength) {
        for (let i = 0; i < word.length; i += maxLength) lines.push(word.slice(i, i + maxLength));
      } else {
        current = word;
      }
    } else if (current.length + 1 + word.length <= maxLength) {
      current += ` ${word}`;
    } else {
      lines.push(current);
      current = word.length > maxLength ? '' : word;
      if (word.length > maxLength) {
        for (let i = 0; i < word.length; i += maxLength) lines.push(word.slice(i, i + maxLength));
      }
    }
  }

  if (current) lines.push(current);
  return lines;
}

function tx(x: number, y: number, text: string, size = 10, color = '0 0 0', font = 'F1') {
  return `BT ${color} rg /${font} ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td (${escapePdfText(text)}) Tj ET`;
}

function rect(x: number, y: number, w: number, h: number, color = '0 0 0') {
  return `${color} rg ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`;
}

function strokeRect(x: number, y: number, w: number, h: number, color = '0 0 0', lw = 0.5) {
  return `${lw} w ${color} RG ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re S`;
}

function line(x1: number, y1: number, x2: number, y2: number, color = '0.88 0.91 0.94', lw = 0.5) {
  return `${lw} w ${color} RG ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`;
}

function rrect(x: number, y: number, w: number, h: number, r: number, fill = '1 1 1', stroke?: string, lw = 0.5) {
  r = Math.min(r, w / 2, h / 2);
  const c = r * 0.5522847498;
  return [
    `${fill} rg`,
    ...(stroke ? [`${lw} w ${stroke} RG`] : []),
    `${(x + r).toFixed(2)} ${y.toFixed(2)} m`,
    `${(x + w - r).toFixed(2)} ${y.toFixed(2)} l`,
    `${(x + w - r + c).toFixed(2)} ${y.toFixed(2)} ${(x + w).toFixed(2)} ${(y + r - c).toFixed(2)} ${(x + w).toFixed(2)} ${(y + r).toFixed(2)} c`,
    `${(x + w).toFixed(2)} ${(y + h - r).toFixed(2)} l`,
    `${(x + w).toFixed(2)} ${(y + h - r + c).toFixed(2)} ${(x + w - r + c).toFixed(2)} ${(y + h).toFixed(2)} ${(x + w - r).toFixed(2)} ${(y + h).toFixed(2)} c`,
    `${(x + r).toFixed(2)} ${(y + h).toFixed(2)} l`,
    `${(x + r - c).toFixed(2)} ${(y + h).toFixed(2)} ${x.toFixed(2)} ${(y + h - r + c).toFixed(2)} ${x.toFixed(2)} ${(y + h - r).toFixed(2)} c`,
    `${x.toFixed(2)} ${(y + r).toFixed(2)} l`,
    `${x.toFixed(2)} ${(y + r - c).toFixed(2)} ${(x + r - c).toFixed(2)} ${y.toFixed(2)} ${(x + r).toFixed(2)} ${y.toFixed(2)} c`,
    stroke ? 'B' : 'f',
  ].join(' ');
}

function circle(cx: number, cy: number, r: number, color: string) {
  const c = r * 0.5522847498;
  return [
    `${color} rg`,
    `${(cx + r).toFixed(2)} ${cy.toFixed(2)} m`,
    `${(cx + r).toFixed(2)} ${(cy + c).toFixed(2)} ${(cx + c).toFixed(2)} ${(cy + r).toFixed(2)} ${cx.toFixed(2)} ${(cy + r).toFixed(2)} c`,
    `${(cx - c).toFixed(2)} ${(cy + r).toFixed(2)} ${(cx - r).toFixed(2)} ${(cy + c).toFixed(2)} ${(cx - r).toFixed(2)} ${cy.toFixed(2)} c`,
    `${(cx - r).toFixed(2)} ${(cy - c).toFixed(2)} ${(cx - c).toFixed(2)} ${(cy - r).toFixed(2)} ${cx.toFixed(2)} ${(cy - r).toFixed(2)} c`,
    `${(cx + c).toFixed(2)} ${(cy - r).toFixed(2)} ${(cx + r).toFixed(2)} ${(cy - c).toFixed(2)} ${(cx + r).toFixed(2)} ${cy.toFixed(2)} c f`,
  ].join(' ');
}

function diamond(cx: number, cy: number, w: number, h: number, color: string) {
  return [
    `${color} rg`,
    `${cx.toFixed(2)} ${(cy + h / 2).toFixed(2)} m`,
    `${(cx + w / 2).toFixed(2)} ${cy.toFixed(2)} l`,
    `${cx.toFixed(2)} ${(cy - h / 2).toFixed(2)} l`,
    `${(cx - w / 2).toFixed(2)} ${cy.toFixed(2)} l f`,
  ].join(' ');
}

// ─── PDF Vector Icons (12×12 at origin, translate via caller) ─────────────────
// Each returns PDF path operators. All icons drawn at ~12pt baseline.

/** Person / user icon */
function iconPerson(x: number, y: number, color: string, s = 1): string[] {
  const cx = x + 6 * s;
  return [
    circle(cx, y + 8.5 * s, 2.8 * s, color),
    // body arc approximated as rounded rect
    rrect(x + 1.5 * s, y + 0.5 * s, 9 * s, 5.5 * s, 3 * s, color),
  ];
}

/** Location pin icon */
function iconPin(x: number, y: number, color: string, s = 1): string[] {
  const cx = x + 6 * s;
  const cy = y + 6 * s;
  const c = 3.5 * s * 0.5522847498;
  const r = 3.5 * s;
  // circle top
  const circ = [
    `${color} rg`,
    `${(cx + r).toFixed(2)} ${cy.toFixed(2)} m`,
    `${(cx + r).toFixed(2)} ${(cy + c).toFixed(2)} ${(cx + c).toFixed(2)} ${(cy + r).toFixed(2)} ${cx.toFixed(2)} ${(cy + r).toFixed(2)} c`,
    `${(cx - c).toFixed(2)} ${(cy + r).toFixed(2)} ${(cx - r).toFixed(2)} ${(cy + c).toFixed(2)} ${(cx - r).toFixed(2)} ${cy.toFixed(2)} c`,
    // taper to point at bottom
    `${(cx - r).toFixed(2)} ${(cy - c * 0.5).toFixed(2)} ${cx.toFixed(2)} ${(y + 0.5 * s).toFixed(2)} ${cx.toFixed(2)} ${(y + 0.5 * s).toFixed(2)} c`,
    `${cx.toFixed(2)} ${(y + 0.5 * s).toFixed(2)} ${(cx + r).toFixed(2)} ${(cy - c * 0.5).toFixed(2)} ${(cx + r).toFixed(2)} ${cy.toFixed(2)} c f`,
  ].join(' ');
  return [circ, circle(cx, cy + 1.5 * s, 1.6 * s, '1 1 1')];
}

/** Receipt / document icon */
function iconReceipt(x: number, y: number, color: string, s = 1): string[] {
  return [
    rrect(x + 1.5 * s, y + 0.5 * s, 9 * s, 11 * s, 1.5 * s, color),
    rect(x + 3.5 * s, y + 8.5 * s, 5 * s, 1 * s, '1 1 1'),
    rect(x + 3.5 * s, y + 6.5 * s, 5 * s, 1 * s, '1 1 1'),
    rect(x + 3.5 * s, y + 4.5 * s, 3 * s, 1 * s, '1 1 1'),
  ];
}

/** Barcode icon */
function iconBarcode(x: number, y: number, color: string, s = 1): string[] {
  const bars = [0, 2, 3.5, 5, 6.5, 8, 9.5];
  return bars.map((bx) => rect(x + bx * s, y + 1 * s, 1 * s, 10 * s, color));
}

/** Pix bolt / lightning icon */
function iconPix(x: number, y: number, color: string, s = 1): string[] {
  return [
    [
      `${color} rg`,
      `${(x + 7 * s).toFixed(2)} ${(y + 11.5 * s).toFixed(2)} m`,
      `${(x + 3.5 * s).toFixed(2)} ${(y + 6.5 * s).toFixed(2)} l`,
      `${(x + 6 * s).toFixed(2)} ${(y + 6.5 * s).toFixed(2)} l`,
      `${(x + 5 * s).toFixed(2)} ${(y + 0.5 * s).toFixed(2)} l`,
      `${(x + 8.5 * s).toFixed(2)} ${(y + 5.5 * s).toFixed(2)} l`,
      `${(x + 6 * s).toFixed(2)} ${(y + 5.5 * s).toFixed(2)} l f`,
    ].join(' '),
  ];
}

/** Calendar icon */
function iconCalendar(x: number, y: number, color: string, s = 1): string[] {
  return [
    rrect(x + 0.5 * s, y + 0.5 * s, 11 * s, 11 * s, 1.5 * s, color),
    rect(x + 0.5 * s, y + 6 * s, 11 * s, 5.5 * s, '1 1 1'),
    // dots grid
    ...([3, 5.5, 8] as number[]).flatMap((bx) =>
      ([2, 4] as number[]).map((by) => circle(x + bx * s, y + by * s, 0.9 * s, color)),
    ),
  ];
}

/** Check circle icon */
function iconCheck(x: number, y: number, color: string, s = 1): string[] {
  return [
    circle(x + 6 * s, y + 6 * s, 5.5 * s, color),
    [
      `1 1 1 rg`,
      `${(x + 3 * s).toFixed(2)} ${(y + 6 * s).toFixed(2)} m`,
      `${(x + 5 * s).toFixed(2)} ${(y + 4 * s).toFixed(2)} l`,
      `${(x + 9 * s).toFixed(2)} ${(y + 8.5 * s).toFixed(2)} l`,
      `${(x + 8 * s).toFixed(2)} ${(y + 9.5 * s).toFixed(2)} l`,
      `${(x + 5 * s).toFixed(2)} ${(y + 6 * s).toFixed(2)} l`,
      `${(x + 4 * s).toFixed(2)} ${(y + 7 * s).toFixed(2)} l f`,
    ].join(' '),
  ];
}

/** Info circle icon */
function iconInfo(x: number, y: number, color: string, s = 1): string[] {
  return [
    circle(x + 6 * s, y + 6 * s, 5.5 * s, color),
    rect(x + 5.2 * s, y + 2.5 * s, 1.6 * s, 4.5 * s, '1 1 1'),
    circle(x + 6 * s, y + 8.5 * s, 1 * s, '1 1 1'),
  ];
}

/** Phone / WhatsApp icon */
function iconPhone(x: number, y: number, color: string, s = 1): string[] {
  return [
    rrect(x + 2 * s, y + 0.5 * s, 8 * s, 11 * s, 2 * s, color),
    circle(x + 6 * s, y + 2 * s, 0.8 * s, '1 1 1'),
    rect(x + 3.5 * s, y + 3.5 * s, 5 * s, 6 * s, '1 1 1'),
  ];
}

/** Globe / site icon */
function iconGlobe(x: number, y: number, color: string, s = 1): string[] {
  const cx = x + 6 * s;
  const cy = y + 6 * s;
  const c2 = 5 * s * 0.5522847498;
  const globe = [
    `${color} rg`,
    `${(cx + 5 * s).toFixed(2)} ${cy.toFixed(2)} m`,
    `${(cx + 5 * s).toFixed(2)} ${(cy + c2).toFixed(2)} ${(cx + c2).toFixed(2)} ${(cy + 5 * s).toFixed(2)} ${cx.toFixed(2)} ${(cy + 5 * s).toFixed(2)} c`,
    `${(cx - c2).toFixed(2)} ${(cy + 5 * s).toFixed(2)} ${(cx - 5 * s).toFixed(2)} ${(cy + c2).toFixed(2)} ${(cx - 5 * s).toFixed(2)} ${cy.toFixed(2)} c`,
    `${(cx - 5 * s).toFixed(2)} ${(cy - c2).toFixed(2)} ${(cx - c2).toFixed(2)} ${(cy - 5 * s).toFixed(2)} ${cx.toFixed(2)} ${(cy - 5 * s).toFixed(2)} c`,
    `${(cx + c2).toFixed(2)} ${(cy - 5 * s).toFixed(2)} ${(cx + 5 * s).toFixed(2)} ${(cy - c2).toFixed(2)} ${(cx + 5 * s).toFixed(2)} ${cy.toFixed(2)} c f`,
  ].join(' ');
  // meridian oval
  const mer = rrect(cx - 2 * s, cy - 5 * s, 4 * s, 10 * s, 2 * s, '1 1 1');
  // equator line
  const eq = rect(cx - 5 * s, cy - 0.6 * s, 10 * s, 1.2 * s, '1 1 1');
  return [globe, mer, eq];
}

/** Email icon */
function iconEmail(x: number, y: number, color: string, s = 1): string[] {
  return [
    rrect(x + 0.5 * s, y + 2.5 * s, 11 * s, 8 * s, 1.5 * s, color),
    [
      `1 1 1 rg`,
      `${(x + 0.5 * s).toFixed(2)} ${(y + 10.5 * s).toFixed(2)} m`,
      `${(x + 6 * s).toFixed(2)} ${(y + 5.5 * s).toFixed(2)} l`,
      `${(x + 11.5 * s).toFixed(2)} ${(y + 10.5 * s).toFixed(2)} l f`,
    ].join(' '),
    line(x + 0.5 * s, y + 2.5 * s, x + 6 * s, y + 7.5 * s, '1 1 1', 1),
    line(x + 11.5 * s, y + 2.5 * s, x + 6 * s, y + 7.5 * s, '1 1 1', 1),
  ];
}

// ─── Solara Logo ───────────────────────────────────────────────────────────────

function solaraLogo(x: number, y: number, scale = 1): string[] {
  const orange = '1 0.68 0.20';
  const yellow = '0.98 0.65 0.15';
  const white = '1 1 1';
  const cx = x + 20 * scale;
  const cy = y + 20 * scale;
  return [
    diamond(cx, cy + 20 * scale, 8 * scale, 18 * scale, orange),
    diamond(cx, cy - 20 * scale, 8 * scale, 18 * scale, orange),
    diamond(cx - 20 * scale, cy, 18 * scale, 8 * scale, orange),
    diamond(cx + 20 * scale, cy, 18 * scale, 8 * scale, orange),
    diamond(cx - 14 * scale, cy + 14 * scale, 10 * scale, 16 * scale, orange),
    diamond(cx + 14 * scale, cy + 14 * scale, 10 * scale, 16 * scale, orange),
    diamond(cx - 14 * scale, cy - 14 * scale, 10 * scale, 16 * scale, orange),
    diamond(cx + 14 * scale, cy - 14 * scale, 10 * scale, 16 * scale, orange),
    circle(cx, cy, 9 * scale, white),
    circle(cx, cy, 4 * scale, orange),
    tx(x + 54 * scale, y + 25 * scale, 'Solara', 25 * scale, white, 'F2'),
    tx(x + 94 * scale, y + 7 * scale, 'ENERGIA', 8 * scale, yellow, 'F2'),
  ];
}

// ─── Barcode ───────────────────────────────────────────────────────────────────

function drawBarcode(codigoBarras: string | null | undefined, x: number, y: number, maxWidth: number, height: number) {
  const digits = codigoBarras?.replace(/\D/g, '') ?? '';
  if (digits.length < 2) return [tx(x, y + 18, 'Codigo de barras nao informado', 9, '0.5 0.5 0.5')];

  const normalized = digits.length % 2 === 0 ? digits : `0${digits}`;
  const segments: Array<{ black: boolean; width: number }> = [
    { black: true, width: 1 }, { black: false, width: 1 },
    { black: true, width: 1 }, { black: false, width: 1 },
  ];

  for (let i = 0; i < normalized.length; i += 2) {
    const bars = ITF_PATTERNS[normalized[i]];
    const spaces = ITF_PATTERNS[normalized[i + 1]];
    for (let j = 0; j < 5; j += 1) {
      segments.push({ black: true, width: bars[j] === '1' ? 3 : 1 });
      segments.push({ black: false, width: spaces[j] === '1' ? 3 : 1 });
    }
  }

  segments.push({ black: true, width: 3 }, { black: false, width: 1 }, { black: true, width: 1 });
  const total = segments.reduce((sum, s) => sum + s.width, 0);
  const unit = Math.min(1.4, maxWidth / total);
  const parts: string[] = [];
  let cursor = x;

  for (const s of segments) {
    const sw = s.width * unit;
    if (s.black) parts.push(rect(cursor, y, sw, height));
    cursor += sw;
  }

  return parts;
}

// ─── QR Code ───────────────────────────────────────────────────────────────────

function getNumRawDataCodewords(version: number) {
  let result = (16 * version + 128) * version + 64;
  if (version >= 2) {
    const numAlign = Math.floor(version / 7) + 2;
    result -= (25 * numAlign - 10) * numAlign - 55;
    if (version >= 7) result -= 36;
  }
  return Math.floor(result / 8);
}

function appendBits(bits: number[], value: number, length: number) {
  for (let i = length - 1; i >= 0; i -= 1) bits.push((value >>> i) & 1);
}

function bitsToBytes(bits: number[]) {
  const result: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let v = 0;
    for (let j = 0; j < 8; j += 1) v = (v << 1) | (bits[i + j] ?? 0);
    result.push(v);
  }
  return result;
}

function gfMultiply(x: number, y: number) {
  let result = 0;
  for (let i = 7; i >= 0; i -= 1) {
    result = (result << 1) ^ ((result >>> 7) * 0x11d);
    result ^= ((y >>> i) & 1) * x;
  }
  return result & 0xff;
}

function gfPow(x: number, power: number) {
  let result = 1;
  for (let i = 0; i < power; i += 1) result = gfMultiply(result, x);
  return result;
}

function reedSolomonDivisor(degree: number) {
  const result = Array<number>(degree).fill(0);
  result[degree - 1] = 1;
  for (let i = 0; i < degree; i += 1) {
    const root = gfPow(2, i);
    for (let j = 0; j < degree; j += 1) {
      result[j] = gfMultiply(result[j], root);
      if (j + 1 < degree) result[j] ^= result[j + 1];
    }
  }
  return result;
}

function reedSolomonRemainder(data: number[], divisor: number[]) {
  const result = Array<number>(divisor.length).fill(0);
  for (const byte of data) {
    const factor = byte ^ result.shift()!;
    result.push(0);
    divisor.forEach((coeff, index) => { result[index] ^= gfMultiply(coeff, factor); });
  }
  return result;
}

function addEccAndInterleave(data: number[], version: number) {
  const ecl = 0;
  const numBlocks = NUM_ERROR_CORRECTION_BLOCKS[version][ecl];
  const blockEccLen = ECC_CODEWORDS_PER_BLOCK[version][ecl];
  const rawCodewords = getNumRawDataCodewords(version);
  const numShortBlocks = numBlocks - (rawCodewords % numBlocks);
  const shortBlockLen = Math.floor(rawCodewords / numBlocks);
  const rsDiv = reedSolomonDivisor(blockEccLen);
  const blocks: number[][] = [];
  let offset = 0;

  for (let i = 0; i < numBlocks; i += 1) {
    const dataLen = shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1);
    const dat = data.slice(offset, offset + dataLen);
    offset += dataLen;
    const ecc = reedSolomonRemainder(dat, rsDiv);
    if (i < numShortBlocks) dat.push(0);
    blocks.push(dat.concat(ecc));
  }

  const result: number[] = [];
  for (let i = 0; i < blocks[0].length; i += 1) {
    blocks.forEach((block, j) => {
      if (i !== shortBlockLen - blockEccLen || j >= numShortBlocks) result.push(block[i]);
    });
  }
  return result;
}

function chooseQrVersion(byteLength: number) {
  for (let version = 1; version <= 40; version += 1) {
    const dataCapacity = getNumRawDataCodewords(version) - ECC_CODEWORDS_PER_BLOCK[version][0] * NUM_ERROR_CORRECTION_BLOCKS[version][0];
    const countBits = version <= 9 ? 8 : 16;
    const usedBits = 4 + countBits + byteLength * 8;
    if (Math.ceil(usedBits / 8) <= dataCapacity) return version;
  }
  return 40;
}

function encodeQrCode(text: string): Matrix {
  const bytes = [...Buffer.from(text, 'utf8')];
  const version = chooseQrVersion(bytes.length);
  const size = version * 4 + 17;
  const dataCapacity = getNumRawDataCodewords(version) - ECC_CODEWORDS_PER_BLOCK[version][0] * NUM_ERROR_CORRECTION_BLOCKS[version][0];
  const bits: number[] = [];

  appendBits(bits, 0x4, 4);
  appendBits(bits, bytes.length, version <= 9 ? 8 : 16);
  bytes.forEach((byte) => appendBits(bits, byte, 8));
  appendBits(bits, 0, Math.min(4, dataCapacity * 8 - bits.length));
  while (bits.length % 8 !== 0) bits.push(0);

  const data = bitsToBytes(bits);
  for (let padByte = 0xec; data.length < dataCapacity; padByte ^= 0xec ^ 0x11) data.push(padByte);

  const codewords = addEccAndInterleave(data, version);
  const modules = Array.from({ length: size }, () => Array<boolean>(size).fill(false));
  const isFunction = Array.from({ length: size }, () => Array<boolean>(size).fill(false));

  const setFn = (x: number, y: number, dark: boolean) => { modules[y][x] = dark; isFunction[y][x] = true; };

  const drawFinder = (x: number, y: number) => {
    for (let dy = -4; dy <= 4; dy += 1) for (let dx = -4; dx <= 4; dx += 1) {
      const xx = x + dx; const yy = y + dy;
      if (xx >= 0 && xx < size && yy >= 0 && yy < size) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        setFn(xx, yy, dist !== 2 && dist !== 4);
      }
    }
  };

  const drawAlignment = (x: number, y: number) => {
    for (let dy = -2; dy <= 2; dy += 1) for (let dx = -2; dx <= 2; dx += 1)
      setFn(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  };

  const alignmentPositions = (): number[] => {
    if (version === 1) return [];
    const result: number[] = [];
    const numAlign = Math.floor(version / 7) + 2;
    const step = version === 32 ? 26 : Math.ceil((version * 4 + 4) / (numAlign * 2 - 2)) * 2;
    for (let pos = size - 7; result.length < numAlign - 1; pos -= step) result.push(pos);
    result.push(6);
    return result.reverse();
  };

  const drawFormatBits = () => {
    const dataBits = (1 << 3) | 0;
    let rem = dataBits;
    for (let i = 0; i < 10; i += 1) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const bitsValue = ((dataBits << 10) | rem) ^ 0x5412;
    for (let i = 0; i <= 5; i += 1) setFn(8, i, ((bitsValue >>> i) & 1) !== 0);
    setFn(8, 7, ((bitsValue >>> 6) & 1) !== 0);
    setFn(8, 8, ((bitsValue >>> 7) & 1) !== 0);
    setFn(7, 8, ((bitsValue >>> 8) & 1) !== 0);
    for (let i = 9; i < 15; i += 1) setFn(14 - i, 8, ((bitsValue >>> i) & 1) !== 0);
    for (let i = 0; i < 8; i += 1) setFn(size - 1 - i, 8, ((bitsValue >>> i) & 1) !== 0);
    for (let i = 8; i < 15; i += 1) setFn(8, size - 15 + i, ((bitsValue >>> i) & 1) !== 0);
    setFn(8, size - 8, true);
  };

  const drawVersion = () => {
    if (version < 7) return;
    let rem = version;
    for (let i = 0; i < 12; i += 1) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const bitsValue = (version << 12) | rem;
    for (let i = 0; i < 18; i += 1) {
      const bit = ((bitsValue >>> i) & 1) !== 0;
      const a = size - 11 + (i % 3); const b = Math.floor(i / 3);
      setFn(a, b, bit); setFn(b, a, bit);
    }
  };

  drawFinder(3, 3); drawFinder(size - 4, 3); drawFinder(3, size - 4);
  for (let i = 0; i < size; i += 1) {
    if (!isFunction[i][6]) setFn(6, i, i % 2 === 0);
    if (!isFunction[6][i]) setFn(i, 6, i % 2 === 0);
  }
  const align = alignmentPositions();
  align.forEach((ax) => align.forEach((ay) => { if (!isFunction[ay][ax]) drawAlignment(ax, ay); }));
  drawFormatBits(); drawVersion();

  let bitIndex = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right -= 1;
    for (let vert = 0; vert < size; vert += 1) {
      for (let j = 0; j < 2; j += 1) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vert : vert;
        if (!isFunction[y][x] && bitIndex < codewords.length * 8) {
          const dark = ((codewords[bitIndex >>> 3] >>> (7 - (bitIndex & 7))) & 1) !== 0;
          modules[y][x] = dark !== ((x + y) % 2 === 0);
          bitIndex += 1;
        }
      }
    }
  }
  drawFormatBits();
  return modules;
}

// ─── QR Helpers ────────────────────────────────────────────────────────────────

function previewPixValue(value: string) {
  const trimmed = normalizePixPayload(value) ?? '';
  return trimmed.length <= 24 ? trimmed : `${trimmed.slice(0, 12)}...${trimmed.slice(-6)}`;
}

function logInvalidPixPayload(source: string, value: string | null | undefined) {
  const text = normalizePixPayload(value);
  if (!text || validatePixPayload(text)) return;
  console.error(
    `[billing-pdf] Payload Pix invalido em ${source}. length=${text.length}; preview=${previewPixValue(text)}`,
  );
}

function isHttpUrlText(value: string | null | undefined) {
  const text = value?.trim();
  if (!text) return false;
  try {
    const url = new URL(text);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch { return false; }
}

function drawUnavailableQr(x: number, y: number, size: number): string[] {
  return [
    rect(x, y, size, size, '0.97 0.97 0.98'),
    strokeRect(x, y, size, size, '0.85 0.88 0.92', 0.5),
    tx(x + size / 2 - 28, y + size / 2 + 6, 'Pix indisponivel', 8, '0.55 0.60 0.69', 'F2'),
    tx(x + size / 2 - 22, y + size / 2 - 8, 'Use o boleto', 7, '0.70 0.74 0.80'),
  ];
}

function drawQrCode(payload: string, x: number, y: number, size: number): string[] {
  const byteLength = Buffer.byteLength(payload, 'utf8');
  const maxVersion = 40;
  const maxCapacity = getNumRawDataCodewords(maxVersion) - ECC_CODEWORDS_PER_BLOCK[maxVersion][0] * NUM_ERROR_CORRECTION_BLOCKS[maxVersion][0];
  if (Math.ceil((4 + 16 + byteLength * 8) / 8) > maxCapacity) throw new Error('Payload Pix excede capacidade do QR Code');

  const matrix = encodeQrCode(payload);
  const quiet = 4;
  const moduleSize = size / (matrix.length + quiet * 2);
  const parts = [rect(x, y, size, size, '1 1 1'), strokeRect(x, y, size, size, '0.85 0.85 0.85', 0.5)];

  matrix.forEach((row, ri) => {
    row.forEach((dark, ci) => {
      if (dark) parts.push(rect(x + (ci + quiet) * moduleSize, y + size - (ri + quiet + 1) * moduleSize, moduleSize, moduleSize));
    });
  });
  return parts;
}

// ─── Public interface ──────────────────────────────────────────────────────────

export interface BoletoPdfInput {
  clientName: string;
  clientDocument: string;
  amount: number;
  dueDate: string;
  status?: string | null;
  faturamentoId?: string | null;
  issueDate?: string | null;
  description?: string | null;
  clientAddress?: string | null;
  installationAddress?: string | null;
  companyCnpj?: string | null;
  companyAddress?: string | null;
  supportEmail?: string | null;
  supportWhatsapp?: string | null;
  siteUrl?: string | null;
  boletoUrl?: string | null;
  linhaDigitavel?: string | null;
  codigoBarras?: string | null;
  pixUrl?: string | null;
  pixPayload?: string | null;
  pixCopiaCola?: string | null;
  pixQrCode?: string | null;
}

// ─── Layout constants ──────────────────────────────────────────────────────────

const PAGE_W = 595;
const PAGE_H = 842;
const ML = 40;       // margin left
const MR = 40;       // margin right
const CW = PAGE_W - ML - MR; // content width = 515
const GAP = 10;      // gap between cards

export function createBoletoPdfBuffer(input: BoletoPdfInput) {

  // ── Resolve Pix ────────────────────────────────────────────────────────
  const pixPayload =
    extractPixPayload(input.pixPayload) ??
    extractPixPayload(input.pixCopiaCola) ??
    extractPixPayload(input.pixQrCode) ??
    null;
  const pixFallbackUrl = isHttpUrlText(input.pixUrl) ? input.pixUrl!.trim() : null;
  const pixCopyLabel = pixPayload ? 'Pix Copia e Cola' : pixFallbackUrl ? 'Link Pix Itau' : 'Pix indisponivel';
  const pixCopyText = pixPayload ?? (pixFallbackUrl ? `Pix indisponivel. Link: ${pixFallbackUrl}` : 'Pix indisponivel. Utilize o boleto.');

  logInvalidPixPayload('pixPayload', input.pixPayload);
  logInvalidPixPayload('pixCopiaCola', input.pixCopiaCola);
  logInvalidPixPayload('pixQrCode', input.pixQrCode);
  if (!pixPayload) console.warn('[billing-pdf] Payload Pix EMV nao encontrado. QR nao sera gerado.');

  // ── Resolve env ────────────────────────────────────────────────────────
  const companyCnpj     = input.companyCnpj     || process.env.SOLARA_CNPJ              || process.env.COMPANY_CNPJ   || null;
  const companyAddress  = input.companyAddress  || process.env.SOLARA_ADDRESS            || process.env.COMPANY_ADDRESS || null;
  const supportEmail    = input.supportEmail    || process.env.BILLING_SUPPORT_EMAIL     || 'financeiro@solaraenergia.com.br';
  const supportWhatsapp = input.supportWhatsapp || process.env.BILLING_SUPPORT_WHATSAPP  || process.env.NEXT_PUBLIC_WHATSAPP || '(85) 99999-9999';
  const siteUrl         = input.siteUrl         || process.env.NEXT_PUBLIC_SITE_URL      || 'www.solaraenergia.com.br';
  const siteDisplay     = siteUrl.replace(/^https?:\/\/(www\.)?/, 'www.');
  const issueDate       = formatDateBR(input.issueDate ?? new Date());
  const dueDate         = formatDateBR(input.dueDate);
  const status          = clean(input.status || 'gerado').toUpperCase();
  const description     = input.description || 'Servicos de Energia Solar / Faturamento Mensal';
  const installAddr     = clean(input.installationAddress || input.clientAddress);
  const isPago          = status === 'PAGO';

  // ── Palette ────────────────────────────────────────────────────────────
  const yellow   = '0.98 0.80 0.08';
  const orange   = '1 0.68 0.20';
  const green    = '0.06 0.55 0.38';
  const ink      = '0.01 0.02 0.06';   // slate-950
  const ink800   = '0.12 0.16 0.24';   // slate-800
  const ink600   = '0.28 0.33 0.41';   // slate-600
  const ink400   = '0.55 0.60 0.69';   // slate-400
  const ink100   = '0.94 0.95 0.97';   // slate-100
  const white    = '1 1 1';
  const border   = '0.88 0.91 0.94';
  const sYellow  = '1 0.97 0.83';
  const sGreen   = '0.88 0.97 0.93';
  const yBorder  = '0.93 0.78 0.20';
  const gBorder  = '0.54 0.85 0.68';

  const p: string[] = [];

  // ── Layout helpers ─────────────────────────────────────────────────────

  /** Thin ALL-CAPS label with left orange bar */
  function sLabel(x: number, y: number, text: string) {
    p.push(rect(x, y, 2, 10, orange));
    p.push(tx(x + 6, y + 1, text.toUpperCase(), 7, ink400, 'F2'));
  }

  /** Label above + value below */
  function lv(x: number, y: number, label: string, value: string, maxLen = 34) {
    p.push(tx(x, y, label.toUpperCase(), 6.5, ink400, 'F2'));
    wrap(clean(value), maxLen).slice(0, 2).forEach((ln, i) => {
      p.push(tx(x, y - 13 - i * 11, ln, 9, ink800));
    });
  }

  /** Small multiline text */
  function sLines(x: number, y: number, value: string, maxLen: number, size = 8, color = ink600, limit = 3) {
    wrap(clean(value), maxLen).slice(0, limit).forEach((ln, i) => {
      p.push(tx(x, y - i * (size + 3), ln, size, color));
    });
  }

  /** Pill / badge */
  function badge(x: number, y: number, w: number, label: string, fill: string, tc: string) {
    p.push(rrect(x, y, w, 16, 8, fill));
    p.push(tx(x + 7, y + 5, label, 6.5, tc, 'F2'));
  }

  /** Section divider line full content width */
  function divider(y: number) {
    p.push(line(ML, y, ML + CW, y, border, 0.4));
  }

  /** Icon + label row (label to the right of icon) */
  function iconLabel(x: number, y: number, icon: string[][], label: string, value: string, size = 8, maxLen = 38) {
    p.push(...icon.flat());
    p.push(tx(x + 16, y + 8, label.toUpperCase(), 6.5, ink400, 'F2'));
    wrap(clean(value), maxLen).slice(0, 2).forEach((ln, i) => {
      p.push(tx(x + 16, y + 8 - 13 - i * 11, ln, size, ink800));
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  // 1. PAGE BACKGROUND
  // ════════════════════════════════════════════════════════════════════════
  p.push(rect(0, 0, PAGE_W, PAGE_H, white));

  // ════════════════════════════════════════════════════════════════════════
  // 2. HEADER  y 750–842
  // ════════════════════════════════════════════════════════════════════════
  const HDR_Y = 750;
  const HDR_H = 92;
  p.push(rect(0, HDR_Y, PAGE_W, HDR_H, ink));
  // top accent bars
  p.push(rect(0, PAGE_H - 4, PAGE_W, 4, yellow));
  p.push(rect(0, PAGE_H - 8, PAGE_W, 4, orange));

  // Logo left
  p.push(...solaraLogo(ML, 776, 0.82));

  // Vertical separator
  p.push(line(320, HDR_Y + 10, 320, PAGE_H - 10, '0.18 0.20 0.30', 0.5));

  // Right block
  const RX = 334;
  p.push(tx(RX, 818, 'RESUMO DE FATURAMENTO', 10.5, white, 'F2'));
  p.push(line(RX, 814, PAGE_W - ML, 814, '0.25 0.28 0.38', 0.4));
  p.push(tx(RX, 803, `Emitido em ${issueDate}`, 7.5, '0.72 0.76 0.86'));
  p.push(tx(RX, 792, companyCnpj ? `CNPJ ${maskCpfCnpj(companyCnpj)}` : 'Energia solar por assinatura', 7.5, '0.60 0.66 0.76'));
  if (companyAddress) {
    sLines(RX, 781, companyAddress, 44, 7, '0.52 0.58 0.67', 2);
  } else {
    p.push(tx(RX, 781, 'Cobranca mensal de energia solar', 7, '0.52 0.58 0.67'));
  }
  // status + issue badges in header
  badge(PAGE_W - ML - 76, 786, 76, isPago ? 'PAGO' : 'GERADO', isPago ? sGreen : yellow, isPago ? green : ink);
  badge(PAGE_W - ML - 76, 768, 76, 'EMISSAO', '0.10 0.14 0.24', white);

  // CNPJ tiny on logo side bottom
  p.push(tx(ML, HDR_Y + 8, companyCnpj ? `CNPJ ${maskCpfCnpj(companyCnpj)}` : '', 7, '0.42 0.48 0.58'));

  // ════════════════════════════════════════════════════════════════════════
  // 3. HERO VALUE BAND  y 640–742
  // ════════════════════════════════════════════════════════════════════════
  const HERO_Y = 640;
  const HERO_H = 102;
  p.push(rect(0, HERO_Y, PAGE_W, HERO_H, ink100));
  p.push(line(0, HERO_Y, PAGE_W, HERO_Y, border, 0.5));
  p.push(line(0, HERO_Y + HERO_H, PAGE_W, HERO_Y + HERO_H, border, 0.5));
  // left accent strip
  p.push(rect(0, HERO_Y, 4, HERO_H, orange));

  // Value
  p.push(tx(ML + 8, HERO_Y + HERO_H - 18, 'VALOR DO FATURAMENTO', 7.5, ink600, 'F2'));
  p.push(tx(ML + 8, HERO_Y + HERO_H - 52, formatCurrencyBRL(input.amount), 32, ink, 'F2'));
  p.push(tx(ML + 8, HERO_Y + 10, description, 8, ink600));

  // vertical divider
  p.push(line(390, HERO_Y + 12, 390, HERO_Y + HERO_H - 12, border, 0.5));

  // Due date block
  const DX = 404;
  // calendar icon
  p.push(...iconCalendar(DX, HERO_Y + HERO_H - 20, ink600, 0.85));
  p.push(tx(DX + 14, HERO_Y + HERO_H - 14, 'VENCIMENTO', 7, ink600, 'F2'));
  p.push(tx(DX, HERO_Y + HERO_H - 40, dueDate, 19, ink, 'F2'));
  badge(DX, HERO_Y + 28, 72, isPago ? 'PAGO' : 'A VENCER', isPago ? sGreen : sYellow, isPago ? green : '0.60 0.42 0.02');
  p.push(tx(DX, HERO_Y + 13, `Emissao ${issueDate}`, 7, ink400));

  // ════════════════════════════════════════════════════════════════════════
  // 4. INFO CARDS  y 528–632
  // ════════════════════════════════════════════════════════════════════════
  const CARD_Y = 516;
  const CARD_H = 108;
  const CARD_W = (CW - GAP) / 2;

  // ── Card: Cliente ──────────────────────────────────────────────────────
  p.push(rrect(ML, CARD_Y, CARD_W, CARD_H, 8, white, border));
  // green top bar
  p.push(rect(ML, CARD_Y + CARD_H - 4, CARD_W, 4, green));
  sLabel(ML + 14, CARD_Y + CARD_H - 16, 'Dados do cliente');

  // person icon + name
  const nameY = CARD_Y + CARD_H - 38;
  p.push(...iconPerson(ML + 14, nameY - 4, green, 0.8));
  lv(ML + 27, nameY, 'Nome', input.clientName, 36);

  // document icon + cpf/cnpj
  const docY = CARD_Y + CARD_H - 64;
  p.push(...iconReceipt(ML + 14, docY - 4, ink400, 0.8));
  lv(ML + 27, docY, 'CPF / CNPJ', maskCpfCnpj(input.clientDocument), 36);

  // ── Card: Instalação ───────────────────────────────────────────────────
  const C2X = ML + CARD_W + GAP;
  p.push(rrect(C2X, CARD_Y, CARD_W, CARD_H, 8, white, border));
  p.push(rect(C2X, CARD_Y + CARD_H - 4, CARD_W, 4, orange));
  sLabel(C2X + 14, CARD_Y + CARD_H - 16, 'Unidade consumidora');

  // pin icon + address lines
  p.push(...iconPin(C2X + 14, CARD_Y + CARD_H - 46, orange, 0.9));
  sLines(C2X + 28, CARD_Y + CARD_H - 30, installAddr, 38, 8, ink600, 4);

  // ════════════════════════════════════════════════════════════════════════
  // 5. DETALHAMENTO  y 448–520
  // ════════════════════════════════════════════════════════════════════════
  const DET_Y = 448;
  const DET_H = 72;
  p.push(rrect(ML, DET_Y, CW, DET_H, 8, white, border));
  p.push(rect(ML, DET_Y + DET_H - 4, CW, 4, ink));
  sLabel(ML + 14, DET_Y + DET_H - 16, 'Detalhamento da cobranca');

  // receipt icon + description
  p.push(...iconReceipt(ML + 14, DET_Y + DET_H - 42, ink, 0.85));
  lv(ML + 28, DET_Y + DET_H - 30, 'Descricao', description, 48);

  // vertical mini-divider
  p.push(line(ML + CW / 2, DET_Y + 10, ML + CW / 2, DET_Y + DET_H - 24, border, 0.4));

  // faturamento id
  p.push(...iconReceipt(ML + CW / 2 + 10, DET_Y + DET_H - 42, ink400, 0.85));
  lv(ML + CW / 2 + 24, DET_Y + DET_H - 30, 'Faturamento ID', clean(input.faturamentoId), 24);

  // ════════════════════════════════════════════════════════════════════════
  // 6. PAYMENT SECTION  y 148–440
  // ════════════════════════════════════════════════════════════════════════
  const PAY_Y = 148;
  const PAY_H = 292;
  p.push(rrect(ML, PAY_Y, CW, PAY_H, 10, white, border));

  // dark header band
  const BAND_H = 40;
  const BAND_Y = PAY_Y + PAY_H - BAND_H;
  p.push(rect(ML, BAND_Y, CW, BAND_H, ink));
  // pix icon in band
  p.push(...iconPix(ML + 14, BAND_Y + 14, yellow, 0.9));
  p.push(tx(ML + 28, BAND_Y + BAND_H - 14, 'PAGUE COM PIX OU BOLETO', 10.5, white, 'F2'));
  badge(ML + CW - 96, BAND_Y + 12, 82, 'INSTANTANEO', yellow, ink);

  const INNER_Y = BAND_Y - 8; // baseline below header

  // ── Left column ────────────────────────────────────────────────────────
  const LX = ML + 16;
  const RIGHT_DIVIDER_X = ML + CW - 152;

  // Linha Digitável
  p.push(tx(LX, INNER_Y - 10, 'Linha digitavel', 9, ink800, 'F2'));
  sLines(LX, INNER_Y - 26, clean(input.linhaDigitavel), 56, 7.5, ink600, 3);
  p.push(line(LX, INNER_Y - 66, RIGHT_DIVIDER_X - 10, INNER_Y - 66, border, 0.4));

  // Pix copia e cola
  p.push(...iconPix(LX, INNER_Y - 82, green, 0.8));
  p.push(tx(LX + 13, INNER_Y - 76, pixCopyLabel, 9, ink800, 'F2'));
  sLines(LX, INNER_Y - 92, pixCopyText, 54, 7, ink600, 4);

  // ── QR code column ────────────────────────────────────────────────────
  const QR_SIZE = 124;
  const QR_X = ML + CW - QR_SIZE - 14;
  const QR_LABEL_Y = INNER_Y - 10;
  const QR_BASE_Y = QR_LABEL_Y - 10 - QR_SIZE;

  p.push(tx(QR_X, QR_LABEL_Y, 'QR Code Pix', 9, ink800, 'F2'));
  if (pixPayload) {
    try {
      p.push(...drawQrCode(pixPayload, QR_X, QR_BASE_Y, QR_SIZE));
    } catch (err) {
      console.error('[billing-pdf] QR Pix indisponivel.', err);
      p.push(...drawUnavailableQr(QR_X, QR_BASE_Y, QR_SIZE));
    }
  } else {
    p.push(...drawUnavailableQr(QR_X, QR_BASE_Y, QR_SIZE));
  }

  // hint below QR
  p.push(tx(QR_X, QR_BASE_Y - 6, 'Abra no app do banco', 6.5, ink400));

  // vertical divider between columns
  p.push(line(RIGHT_DIVIDER_X, INNER_Y - 6, RIGHT_DIVIDER_X, PAY_Y + 58, border, 0.4));

  // ── Barcode ────────────────────────────────────────────────────────────
  const BC_Y = PAY_Y + 8;
  const BC_H = 38;
  p.push(line(LX, BC_Y + BC_H + 10, LX + CW - 30, BC_Y + BC_H + 10, border, 0.4));
  p.push(...iconBarcode(LX, BC_Y + BC_H + 2, ink400, 0.7));
  p.push(tx(LX + 11, BC_Y + BC_H + 6, 'Codigo de barras', 8, ink800, 'F2'));
  p.push(...drawBarcode(input.codigoBarras, LX, BC_Y, CW - 36, BC_H));
  p.push(tx(LX, BC_Y - 8, clean(input.codigoBarras), 6, ink400));

  // ════════════════════════════════════════════════════════════════════════
  // 7. NOTICE BAR  y 94–140
  // ════════════════════════════════════════════════════════════════════════
  const NB_Y = 94;
  const NB_H = 44;
  p.push(rrect(ML, NB_Y, CW, NB_H, 8, sYellow, yBorder));
  p.push(...iconInfo(ML + 12, NB_Y + NB_H / 2 - 6, yellow, 0.9));
  p.push(tx(ML + 30, NB_Y + 31, 'Observacao', 8.5, ink800, 'F2'));
  p.push(tx(ML + 30, NB_Y + 18, 'Apos o pagamento, a compensacao podera ocorrer conforme o prazo da instituicao financeira.', 7.5, ink600));

  // ════════════════════════════════════════════════════════════════════════
  // 8. FOOTER  y 0–86
  // ════════════════════════════════════════════════════════════════════════
  const FTR_H = 86;
  p.push(rect(0, 0, PAGE_W, FTR_H, ink));
  p.push(rect(0, FTR_H - 4, PAGE_W, 4, yellow));

  // Three equal contact columns
 const COL_W = CW / 3;
const footerCols = [
  { iconFn: iconEmail,  label: 'Email',     value: supportEmail },
  { iconFn: iconPhone,  label: 'WhatsApp',  value: supportWhatsapp || 'Atendimento Solara' },
  { iconFn: iconGlobe,  label: 'Site',      value: siteDisplay },
];

footerCols.forEach(({ iconFn, label, value }, i) => {
  const cx = ML + COL_W * i;
  p.push(...iconFn(cx, 46, yellow, 0.82));
  p.push(tx(cx + 16, 62, label.toUpperCase(), 7, '0.65 0.70 0.80', 'F2'));
  p.push(line(cx + 16, 58, cx + COL_W - 4, 58, '0.18 0.22 0.32', 0.4));
  p.push(tx(cx + 16, 47, value, 7.5, '0.88 0.91 0.96'));
});

  // Tagline + logo watermark
  p.push(line(ML, 32, PAGE_W - MR, 32, '0.14 0.16 0.24', 0.4));
  p.push(tx(ML, 18, 'Solara Energia: transparencia, economia e confianca na sua jornada de energia solar.', 7.5, '0.42 0.48 0.58'));

  // ════════════════════════════════════════════════════════════════════════
  // 9. BUILD PDF BYTES
  // ════════════════════════════════════════════════════════════════════════
  const content = p.join('\n');
  const objects = [
    '%PDF-1.4\n',
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >> endobj\n',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n',
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj\n',
    `6 0 obj << /Length ${Buffer.byteLength(content, 'utf8')} >> stream\n${content}\nendstream endobj\n`,
  ];

  let offset = 0;
  const chunks: Buffer[] = [];
  const offsets: number[] = [0];

  for (const obj of objects) {
    const buf = Buffer.from(obj, 'utf8');
    chunks.push(buf);
    offset += buf.length;
    offsets.push(offset);
  }

  const xrefStart = offset;
  const xrefLines = [
    'xref\n',
    '0 7\n',
    '0000000000 65535 f \n',
    ...offsets.slice(1).map((off) => `${String(off).padStart(10, '0')} 00000 n \n`),
    'trailer << /Size 7 /Root 1 0 R >>\n',
    `startxref\n${xrefStart}\n%%EOF`,
  ].join('');

  chunks.push(Buffer.from(xrefLines, 'utf8'));
  return Buffer.concat(chunks);
}