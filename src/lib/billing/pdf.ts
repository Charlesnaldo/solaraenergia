import { PDFDocument } from 'pdf-lib';
import { normalizePixPayload, validatePixCrc, validatePixPayload } from '@/lib/itau/bolecode';
import { getLogoPngBuffer } from '@/lib/pdf/getLogoPngBuffer';

export function formatCurrencyBRL(value: number) {
  const amount = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

  return `R$ ${amount}`;
}

/** Formats a number as Brazilian decimal WITHOUT the R$ prefix (for boleto value fields) */
function formatValueOnly(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) && value > 0 ? value : 0);
}

export function money(value: number) {
  return formatCurrencyBRL(value);
}

export function formatDateBR(value: string | Date | null | undefined) {
  if (!value) return 'Não informado';
  const date = value instanceof Date ? value : new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return 'Não informado';
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

const WIN_ANSI_OVERRIDES = new Map<number, number>([
  [0x20ac, 0x80],
  [0x201a, 0x82],
  [0x0192, 0x83],
  [0x201e, 0x84],
  [0x2026, 0x85],
  [0x2020, 0x86],
  [0x2021, 0x87],
  [0x02c6, 0x88],
  [0x2030, 0x89],
  [0x0160, 0x8a],
  [0x2039, 0x8b],
  [0x0152, 0x8c],
  [0x017d, 0x8e],
  [0x2018, 0x91],
  [0x2019, 0x92],
  [0x201c, 0x93],
  [0x201d, 0x94],
  [0x2022, 0x95],
  [0x2013, 0x96],
  [0x2014, 0x97],
  [0x02dc, 0x98],
  [0x2122, 0x99],
  [0x0161, 0x9a],
  [0x203a, 0x9b],
  [0x0153, 0x9c],
  [0x017e, 0x9e],
  [0x0178, 0x9f],
]);

function toWinAnsiByte(char: string) {
  const codePoint = char.codePointAt(0) ?? 0x3f;
  if (codePoint <= 0x7f) return codePoint;
  if (codePoint >= 0xa0 && codePoint <= 0xff) return codePoint;
  return WIN_ANSI_OVERRIDES.get(codePoint) ?? 0x3f;
}

function escapePdfText(value: string) {
  return Array.from(value)
    .map((char) => {
      const byte = toWinAnsiByte(char);

      if (byte === 0x28 || byte === 0x29 || byte === 0x5c) {
        return `\\${String.fromCharCode(byte)}`;
      }

      if (byte < 0x20 || byte > 0x7e) {
        return `\\${byte.toString(8).padStart(3, '0')}`;
      }

      return String.fromCharCode(byte);
    })
    .join('');
}

function clean(value: string | null | undefined) {
  return value?.trim() || 'Não informado';
}

function wrap(value: string, maxLength: number) {
  const text = value.trim();
  if (text.length <= maxLength) return [text];

  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if (!current) {
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

// ─── PDF Vector Icons ─────────────────────────────────────────────────────────

function iconPerson(x: number, y: number, color: string, s = 1): string[] {
  const cx = x + 6 * s;
  return [
    circle(cx, y + 8.5 * s, 2.8 * s, color),
    rrect(x + 1.5 * s, y + 0.5 * s, 9 * s, 5.5 * s, 3 * s, color),
  ];
}

function iconPin(x: number, y: number, color: string, s = 1): string[] {
  const cx = x + 6 * s;
  const cy = y + 6 * s;
  const c = 3.5 * s * 0.5522847498;
  const r = 3.5 * s;
  const circ = [
    `${color} rg`,
    `${(cx + r).toFixed(2)} ${cy.toFixed(2)} m`,
    `${(cx + r).toFixed(2)} ${(cy + c).toFixed(2)} ${(cx + c).toFixed(2)} ${(cy + r).toFixed(2)} ${cx.toFixed(2)} ${(cy + r).toFixed(2)} c`,
    `${(cx - c).toFixed(2)} ${(cy + r).toFixed(2)} ${(cx - r).toFixed(2)} ${(cy + c).toFixed(2)} ${(cx - r).toFixed(2)} ${cy.toFixed(2)} c`,
    `${(cx - r).toFixed(2)} ${(cy - c * 0.5).toFixed(2)} ${cx.toFixed(2)} ${(y + 0.5 * s).toFixed(2)} ${cx.toFixed(2)} ${(y + 0.5 * s).toFixed(2)} c`,
    `${cx.toFixed(2)} ${(y + 0.5 * s).toFixed(2)} ${(cx + r).toFixed(2)} ${(cy - c * 0.5).toFixed(2)} ${(cx + r).toFixed(2)} ${cy.toFixed(2)} c f`,
  ].join(' ');
  return [circ, circle(cx, cy + 1.5 * s, 1.6 * s, '1 1 1')];
}

function iconReceipt(x: number, y: number, color: string, s = 1): string[] {
  return [
    rrect(x + 1.5 * s, y + 0.5 * s, 9 * s, 11 * s, 1.5 * s, color),
    rect(x + 3.5 * s, y + 8.5 * s, 5 * s, 1 * s, '1 1 1'),
    rect(x + 3.5 * s, y + 6.5 * s, 5 * s, 1 * s, '1 1 1'),
    rect(x + 3.5 * s, y + 4.5 * s, 3 * s, 1 * s, '1 1 1'),
  ];
}

function iconBarcode(x: number, y: number, color: string, s = 1): string[] {
  const bars = [0, 2, 3.5, 5, 6.5, 8, 9.5];
  return bars.map((bx) => rect(x + bx * s, y + 1 * s, 1 * s, 10 * s, color));
}

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

function iconCalendar(x: number, y: number, color: string, s = 1): string[] {
  return [
    rrect(x + 0.5 * s, y + 0.5 * s, 11 * s, 11 * s, 1.5 * s, color),
    rect(x + 0.5 * s, y + 6 * s, 11 * s, 5.5 * s, '1 1 1'),
    ...([3, 5.5, 8] as number[]).flatMap((bx) =>
      ([2, 4] as number[]).map((by) => circle(x + bx * s, y + by * s, 0.9 * s, color)),
    ),
  ];
}

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

function iconInfo(x: number, y: number, color: string, s = 1): string[] {
  return [
    circle(x + 6 * s, y + 6 * s, 5.5 * s, color),
    rect(x + 5.2 * s, y + 2.5 * s, 1.6 * s, 4.5 * s, '1 1 1'),
    circle(x + 6 * s, y + 8.5 * s, 1 * s, '1 1 1'),
  ];
}

function iconPhone(x: number, y: number, color: string, s = 1): string[] {
  return [
    rrect(x + 2 * s, y + 0.5 * s, 8 * s, 11 * s, 2 * s, color),
    circle(x + 6 * s, y + 2 * s, 0.8 * s, '1 1 1'),
    rect(x + 3.5 * s, y + 3.5 * s, 5 * s, 6 * s, '1 1 1'),
  ];
}

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
  const mer = rrect(cx - 2 * s, cy - 5 * s, 4 * s, 10 * s, 2 * s, '1 1 1');
  const eq = rect(cx - 5 * s, cy - 0.6 * s, 10 * s, 1.2 * s, '1 1 1');
  return [globe, mer, eq];
}

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

// ─── Barcode ───────────────────────────────────────────────────────────────────

function drawBarcode(codigoBarras: string | null | undefined, x: number, y: number, maxWidth: number, height: number) {
  const digits = codigoBarras?.replace(/\D/g, '') ?? '';
  if (digits.length < 2) return [tx(x, y + 18, 'Código de barras não informado', 9, '0.5 0.5 0.5')];

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
  if (!text) return;
  if (!validatePixCrc(text)) {
    console.error('Payload Pix com CRC inválido');
    return;
  }
  if (validatePixPayload(text)) return;
  console.error(
    `[billing-pdf] Payload Pix invalido em ${source}. length=${text.length}; preview=${previewPixValue(text)}`,
  );
}

function resolveOfficialPixPayload(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const payload = normalizePixPayload(value);
    if (!payload) continue;
    if (!validatePixCrc(payload)) continue;
    if (validatePixPayload(payload)) return payload;
  }
  return null;
}

function drawUnavailableQr(x: number, y: number, size: number): string[] {
  return [
    rect(x, y, size, size, '0.97 0.97 0.98'),
    strokeRect(x, y, size, size, '0.85 0.88 0.92', 0.5),
    tx(x + size / 2 - 28, y + size / 2 + 6, 'Pix indisponível', 8, '0.55 0.60 0.69', 'F2'),
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
  companyName?: string | null;
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
  nossoNumero?: string | null;
  pixUrl?: string | null;
  pixPayload?: string | null;
  pixCopiaCola?: string | null;
  pixQrCode?: string | null;
  // ── NEW: Itaú-specific fields ──────────────────────────────────────────
  /** Agência e código do beneficiário. Ex: "0057/12345-7" */
  agenciaCodBeneficiario?: string | null;
  /**
   * Instruções de responsabilidade do BENEFICIÁRIO (até 4 linhas).
   * Se não fornecido, usa o padrão com juros 5% a.m. e multa 10%.
   */
  instrucoes?: string[] | null;
  /** Desconto/abatimento a exibir. Deixe null/undefined para exibir em branco. */
  descontoAbatimento?: string | null;
  /** Mora/multa a exibir. Deixe null/undefined para exibir em branco. */
  moraMulTA?: string | null;
}

// ─── Layout constants ──────────────────────────────────────────────────────────

const ITAU_PAGE_W = 842;
const ITAU_PAGE_H = 595;
const ITAU_PAPER_X = 18;
const ITAU_PAPER_Y = 18;
const ITAU_PAPER_W = 806;
const ITAU_PAPER_H = 558;
const ITAU_VIA_X = 32;
const ITAU_VIA_W = 778;
const ITAU_VIA_H = 255;
const ITAU_TOP_VIA_Y = 314;
const ITAU_BOTTOM_VIA_Y = 35;
const ITAU_BANK_CODE = '341-7';
const ITAU_FALLBACK_LINE = '34191.79001 01043.510047 91020.150008 9 96990000012345';
const ITAU_FALLBACK_BARCODE = '34199969900000123451790010010435100479102015';
const ITAU_FALLBACK_PIX =
  '00020101021226580014BR.GOV.BCB.PIX0136f0cddcaa-2c3a-44ad-9f97-0000000001235204000053039865406123.455802BR5913SIMULACAO S/A6009SAO PAULO62070503***6304ABCD';

/** Default instructions shown in boleto when not provided by caller */
const DEFAULT_INSTRUCOES = [
  'Instruções de responsabilidade do BENEFICIÁRIO. Qualquer dúvida sobre este boleto Contate o BENEFICIÁRIO',
  'APÓS O VENCIMENTO COBRAR JUROS DE .......5,00% AO MÊS',
  'APÓS O VENCIMENTO COBRAR MULTA DE .......10,00% AO MÊS',
  'NEGATIVAÇÃO APÓS 10 DIAS DO VENCIMENTO',
];

function estimateTextWidth(text: string, size: number) {
  return text.length * size * 0.52;
}

function txRight(xRight: number, y: number, text: string, size = 8, color = '0 0 0', font = 'F1') {
  return tx(xRight - estimateTextWidth(text, size), y, text, size, color, font);
}

function txCenter(x: number, w: number, y: number, text: string, size = 8, color = '0 0 0', font = 'F1') {
  return tx(x + w / 2 - estimateTextWidth(text, size) / 2, y, text, size, color, font);
}

function dashedLine(x1: number, y1: number, x2: number, y2: number, color = '0.45 0.45 0.45', lw = 0.35) {
  return `q [4 3] 0 d ${lw} w ${color} RG ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S Q`;
}

function rotationMatrix(degrees: number, cx: number, cy: number) {
  const rad = (degrees * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const e = cx - cos * cx + sin * cy;
  const f = cy - sin * cx - cos * cy;
  return `q ${cos.toFixed(5)} ${sin.toFixed(5)} ${(-sin).toFixed(5)} ${cos.toFixed(5)} ${e.toFixed(2)} ${f.toFixed(2)} cm`;
}

function formatItauLinhaDigitavel(value: string | null | undefined) {
  const digits = onlyDigits(value ?? '');
  if (digits.length >= 47) {
    const boletoDigits = digits.slice(0, 47);
    return [
      `${boletoDigits.slice(0, 5)}.${boletoDigits.slice(5, 10)}`,
      `${boletoDigits.slice(10, 15)}.${boletoDigits.slice(15, 21)}`,
      `${boletoDigits.slice(21, 26)}.${boletoDigits.slice(26, 32)}`,
      boletoDigits.slice(32, 33),
      boletoDigits.slice(33, 47),
    ].join(' ');
  }
  const text = value?.trim();
  return text && text.length > 20 ? text : ITAU_FALLBACK_LINE;
}

function formatItauCodigoBarras(value: string | null | undefined) {
  const digits = onlyDigits(value ?? '');
  return digits.length >= 44 ? digits.slice(0, 44) : ITAU_FALLBACK_BARCODE;
}

function buildItauDocNumber(input: BoletoPdfInput) {
  const cleanId = (input.faturamentoId ?? '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return cleanId ? cleanId.slice(-10).padStart(8, '0') : '00000123';
}

function buildItauNossoNumero(input: BoletoPdfInput, codigoBarras: string) {
  const explicit = input.nossoNumero?.trim();
  if (explicit) return explicit;
  const serial =
    onlyDigits(input.faturamentoId ?? '').slice(-8) ||
    onlyDigits(codigoBarras).slice(-8) ||
    '00000123';
  return `109/${serial.padStart(8, '0')}-4`;
}

function maxCharsForWidth(width: number, size: number) {
  return Math.max(8, Math.floor(width / (size * 0.53)));
}

function drawBoletoField(
  parts: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string | string[],
  options: {
    size?: number;
    labelSize?: number;
    bold?: boolean;
    right?: boolean;
    maxLines?: number;
    maxChars?: number;
    font?: string;
    /** When true, renders an empty field (no value text) */
    empty?: boolean;
  } = {},
) {
  const labelSize = options.labelSize ?? 5.2;
  const valueSize = options.size ?? 7.1;
  const valueFont = options.font ?? (options.bold ? 'F2' : 'F1');
  const maxLines = options.maxLines ?? Math.max(1, Math.floor((h - 10) / (valueSize + 2)));
  const maxChars = options.maxChars ?? maxCharsForWidth(w - 7, valueSize);
  const lines = Array.isArray(value) ? value : wrap(clean(value), maxChars);

  parts.push(strokeRect(x, y, w, h, '0.08 0.08 0.08', 0.35));
  parts.push(tx(x + 3, y + h - labelSize - 1.5, label, labelSize, '0.22 0.22 0.22', 'F1'));

  if (!options.empty) {
    lines.slice(0, maxLines).forEach((item, index) => {
      const text = item.trim();
      const textY = y + h - 16 - index * (valueSize + 2);
      if (options.right) {
        parts.push(txRight(x + w - 4, textY, text, valueSize, '0.02 0.02 0.02', valueFont));
      } else {
        parts.push(tx(x + 3, textY, text, valueSize, '0.02 0.02 0.02', valueFont));
      }
    });
  }
}

function drawItauLogo(parts: string[], x: number, y: number) {
  parts.push(rect(x, y, 22, 22, '0 0 0'));
  parts.push(txCenter(x, 22, y + 7.2, 'Itaú', 9.4, '1 1 1', 'F2'));
}

function drawItauHeader(parts: string[], x: number, y: number, w: number, title: string, linhaDigitavel: string) {
  drawItauLogo(parts, x, y);
  parts.push(tx(x + 29, y + 13.2, 'Banco Itaú S.A.', 8.4, '0 0 0', 'F2'));
  parts.push(strokeRect(x + 118, y, 44, 22, '0 0 0', 0.65));
  parts.push(txCenter(x + 118, 44, y + 6.6, ITAU_BANK_CODE, 11.2, '0 0 0', 'F2'));
  parts.push(tx(x + 172, y + 8.3, linhaDigitavel, 11.4, '0 0 0', 'F4'));
  parts.push(strokeRect(x + w - 128, y + 1.5, 128, 18, '0.18 0.18 0.18', 0.3));
  parts.push(txCenter(x + w - 128, 128, y + 7.4, title, 6.4, '0.18 0.18 0.18', 'F2'));
  parts.push(line(x, y - 5, x + w, y - 5, '0 0 0', 1.05));
}

function drawPaperNoise(parts: string[]) {
  for (let i = 0; i < 16; i += 1) {
    const y = ITAU_PAPER_Y + 18 + i * 33;
    parts.push(line(ITAU_PAPER_X + 5, y, ITAU_PAPER_X + ITAU_PAPER_W - 5, y + 0.7, '0.955 0.955 0.955', 0.18));
  }
  for (let i = 0; i < 42; i += 1) {
    const x = ITAU_PAPER_X + 13 + ((i * 37) % Math.floor(ITAU_PAPER_W - 26));
    const y = ITAU_PAPER_Y + 11 + ((i * 53) % Math.floor(ITAU_PAPER_H - 22));
    parts.push(rect(x, y, 0.55, 0.55, i % 3 === 0 ? '0.82 0.82 0.82' : '0.90 0.90 0.90'));
  }
}

function drawItauVia(
  parts: string[],
  originY: number,
  title: string,
  data: {
    linhaDigitavel: string;
    codigoBarras: string;
    pixPayload: string;
    pixCopyText: string;
    amount: string;           // formatted WITHOUT "R$" prefix (e.g. "123,45")
    dueDate: string;
    issueDate: string;
    docNumber: string;
    beneficiaryName: string;
    beneficiaryDocument: string;
    beneficiaryAddress: string;
    payerName: string;
    payerDocument: string;
    payerAddress: string;
    nossoNumero: string;
    agenciaCodBeneficiario: string;
    instrucoes: string[];
    descontoAbatimento: string | null;
    moraMulTA: string | null;
    withPaymentArea: boolean;
  },
) {
  const x = ITAU_VIA_X;
  const y = originY;
  const w = ITAU_VIA_W;
  const h = ITAU_VIA_H;
  const row = 22;
  const fieldGap = data.withPaymentArea ? 104 : 0;
  const rightW = data.withPaymentArea ? 96 : 168;
  const leftW = w - rightW - fieldGap;
  const rightX = x + leftW;
  const headerY = y + h - 29;
  const row1Y = y + h - 55;
  const row2Y = row1Y - row;
  const row3Y = row2Y - row;
  const row4Y = row3Y - 28;
  const row5Y = row4Y - 60;

  parts.push(strokeRect(x, y, w, h, '0.18 0.18 0.18', 0.35));
  drawItauHeader(parts, x, headerY, w, title, data.linhaDigitavel);

  // Row 1: Local de pagamento + Vencimento
  drawBoletoField(parts, x, row1Y, leftW, row, 'Local de pagamento',
    'Em qualquer banco ou correspondente bancário mesmo após o vencimento.', { size: 6.8, maxLines: 1 });
  drawBoletoField(parts, rightX, row1Y, rightW, row, 'Vencimento', data.dueDate,
    { size: 8.2, bold: true, right: true, maxLines: 1 });

  // Row 2: Beneficiário — two rows tall to fit name/CNPJ + address
  // We draw this as a taller cell (row*2 height) so name+address fit without overlap
  const row2H = row;
  const beneficiaryLine = `${data.beneficiaryName}      CNPJ: ${data.beneficiaryDocument}`;
  const beneficiaryAddrLine = `Endereço Beneficiário: ${data.beneficiaryAddress}`;
  // Draw the cell border and label manually so we can place two value lines
  parts.push(strokeRect(x, row2Y, leftW, row2H, '0.08 0.08 0.08', 0.35));
  parts.push(tx(x + 3, row2Y + row2H - 5.2 - 1.5, 'Beneficiário:', 5.2, '0.22 0.22 0.22', 'F1'));
  // First value line: name + CNPJ (bold)
  parts.push(tx(x + 3, row2Y + row2H - 14, beneficiaryLine, 6.3, '0.02 0.02 0.02', 'F2'));
  // Second value line: address (smaller, regular)
  parts.push(tx(x + 3, row2Y + 3.5, beneficiaryAddrLine, 5.4, '0.18 0.18 0.18', 'F1'));
  drawBoletoField(parts, rightX, row2Y, rightW, row, 'Agência/Código Beneficiário', data.agenciaCodBeneficiario,
    { size: 6.3, right: true, maxLines: 1 });

  // Row 3: Date/Doc/Espécie/Aceite/Processamento + Nosso Número
  const dateW = 104;
  const docW = 151;
  const especieW = 68;
  const aceiteW = 52;
  const procW = leftW - dateW - docW - especieW - aceiteW;
  drawBoletoField(parts, x, row3Y, dateW, row, 'Data do documento', data.issueDate, { size: 6.7, maxLines: 1 });
  drawBoletoField(parts, x + dateW, row3Y, docW, row, 'Núm. do Documento', data.docNumber,
    { size: 6.7, font: 'F3', maxLines: 1 });
  drawBoletoField(parts, x + dateW + docW, row3Y, especieW, row, 'Espécie Doc.', 'DM', { size: 6.7, maxLines: 1 });
  drawBoletoField(parts, x + dateW + docW + especieW, row3Y, aceiteW, row, 'Aceite', 'N', { size: 6.7, maxLines: 1 });
  drawBoletoField(parts, x + dateW + docW + especieW + aceiteW, row3Y, procW, row, 'Data Processamento', data.issueDate,
    { size: 6.7, maxLines: 1 });
  drawBoletoField(parts, rightX, row3Y, rightW, row, 'Nosso Número', data.nossoNumero,
    { size: 6.4, font: 'F3', right: true, maxLines: 1 });

  // Row 4: Pagador — manual draw for precise 2-line layout in 28pt cell
  parts.push(strokeRect(x, row4Y, leftW, 28, '0.08 0.08 0.08', 0.35));
  parts.push(tx(x + 3, row4Y + 28 - 5.2 - 1.5, 'Pagador', 5.2, '0.22 0.22 0.22', 'F1'));
  // Line 1: name + CPF/CNPJ
  parts.push(tx(x + 3, row4Y + 14, `${data.payerName}      CPF/CNPJ: ${data.payerDocument}`, 6.5, '0.02 0.02 0.02', 'F2'));
  // Line 2: address
  parts.push(tx(x + 3, row4Y + 4, data.payerAddress, 5.8, '0.18 0.18 0.18', 'F1'));
  // Value shown WITHOUT "R$" prefix — just the number (e.g. "123,45")
  drawBoletoField(parts, rightX, row4Y, rightW, 28, '(=) Valor do Documento', data.amount,
    { size: 8.4, bold: true, right: true, maxLines: 1 });

  // Row 5: Instruções — short label header, instruction lines as values
  // Draw cell manually: label is just "Instruções (BENEFICIÁRIO)" and lines fill the body
  parts.push(strokeRect(x, row5Y, leftW, 60, '0.08 0.08 0.08', 0.35));
  parts.push(tx(x + 3, row5Y + 60 - 5.2 - 1.5, 'Instruções de responsabilidade do BENEFICIÁRIO. Qualquer dúvida sobre este boleto Contate o BENEFICIÁRIO', 5.0, '0.22 0.22 0.22', 'F1'));
  // Instruction lines — drawn top-to-bottom inside the cell body
  data.instrucoes.slice(0, 4).forEach((instrLine, index) => {
    const lineY = row5Y + 60 - 16 - index * 9;
    parts.push(tx(x + 3, lineY, instrLine.trim(), 6.05, '0.02 0.02 0.02', 'F1'));
  });

  // (-) Descontos/Abatimento — empty by default
  if (data.descontoAbatimento) {
    drawBoletoField(parts, rightX, row5Y + 40, rightW, 20, '(-) Descontos/Abatimento',
      data.descontoAbatimento, { size: 6.3, right: true, maxLines: 1 });
  } else {
    drawBoletoField(parts, rightX, row5Y + 40, rightW, 20, '(-) Descontos/Abatimento', '',
      { size: 6.3, right: true, maxLines: 1, empty: true });
  }

  // (+) Mora/Multa — empty by default
  if (data.moraMulTA) {
    drawBoletoField(parts, rightX, row5Y + 20, rightW, 20, '(+) Mora/Multa',
      data.moraMulTA, { size: 6.3, right: true, maxLines: 1 });
  } else {
    drawBoletoField(parts, rightX, row5Y + 20, rightW, 20, '(+) Mora/Multa', '',
      { size: 6.3, right: true, maxLines: 1, empty: true });
  }

  // (=) Valor Cobrado — empty by default (filled after payment)
  drawBoletoField(parts, rightX, row5Y, rightW, 20, '(=) Valor Cobrado', '',
    { size: 6.8, bold: true, right: true, maxLines: 1, empty: true });

  // ── Via: RECIBO DO PAGADOR (top, no payment area) ──────────────────────
  if (!data.withPaymentArea) {
    const receiptBoxX = x + w - 138;
    parts.push(strokeRect(receiptBoxX, y + 31, 126, 23, '0.25 0.25 0.25', 0.35));
    parts.push(txCenter(receiptBoxX, 126, y + 44, 'RECIBO DO PAGADOR', 6.7, '0.25 0.25 0.25', 'F2'));
    parts.push(txCenter(receiptBoxX, 126, y + 34, 'Autenticação no verso', 5.8, '0.35 0.35 0.35'));
    return;
  }

  // ── Via: FICHA DE COMPENSAÇÃO (bottom, with QR + barcode) ─────────────

  // QR Code Pix
  const qrSize = 82;
  const qrX = x + w - qrSize - 12;
  const qrY = y + 92;
  try {
    parts.push(...drawQrCode(data.pixPayload, qrX, qrY, qrSize));
  } catch (err) {
    console.error('[billing-pdf] QR Pix indisponível no layout Itaú.', err);
    parts.push(...drawQrCode(ITAU_FALLBACK_PIX, qrX, qrY, qrSize));
  }

  // PIX Copia e Cola label + text above QR
  parts.push(txCenter(qrX, qrSize, qrY - 10, 'PIX Copia e Cola', 6.8, '0 0 0', 'F2'));
  wrap(data.pixCopyText, 28).slice(0, 2).forEach((lineText, index) => {
    parts.push(tx(qrX, qrY - 21 - index * 7, lineText, 5, '0.22 0.22 0.22', 'F3'));
  });

  // "Escolha a forma..." hint text — placed below instructions, above barcode
  // qrY is y+92, barcode is at y+17+45=y+62, so hint sits around y+80..y+90
  const hintLines = [
    'Escolha a forma mais conveniente para realizar o seu pagamento: Codigo de barras ou QR Code basta acessar o',
    'aplicativo da sua instituição financeira e utilizar apenas uma das opções.',
  ];
  hintLines.forEach((hl, i) => {
    parts.push(tx(x + 6, y + 88 - i * 8, hl, 5.0, '0.22 0.22 0.22'));
  });

  // Barcode + FICHA DE COMPENSAÇÃO label
  const barcodeY = y + 17;
  parts.push(strokeRect(x + 354, barcodeY + 41, 176, 15, '0.18 0.18 0.18', 0.35));
  parts.push(txCenter(x + 354, 176, barcodeY + 45.5, 'FICHA DE COMPENSAÇÃO', 7.1, '0 0 0', 'F2'));
  parts.push(tx(x + 354 + 176 + 4, barcodeY + 45.5, 'autenticação Mecanica', 6.3, '0 0 0', 'F2'));
  parts.push(...drawBarcode(data.codigoBarras, x + 6, barcodeY + 7, 520, 38));
  parts.push(tx(x + 6, barcodeY - 2, data.codigoBarras, 5.6, '0.18 0.18 0.18', 'F3'));
}

function createRawPdfBuffer(content: string, width: number, height: number) {
  const header = Buffer.from('%PDF-1.4\n', 'utf8');
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n',
    `3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /Font << /F1 4 0 R /F2 5 0 R /F3 6 0 R /F4 7 0 R >> >> /Contents 8 0 R >> endobj\n`,
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >> endobj\n',
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >> endobj\n',
    '6 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >> endobj\n',
    '7 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold /Encoding /WinAnsiEncoding >> endobj\n',
    `8 0 obj << /Length ${Buffer.byteLength(content, 'utf8')} >> stream\n${content}\nendstream endobj\n`,
  ];

  const chunks: Buffer[] = [header];
  const offsets: number[] = [0];
  let offset = header.length;

  for (const object of objects) {
    offsets.push(offset);
    const chunk = Buffer.from(object, 'utf8');
    chunks.push(chunk);
    offset += chunk.length;
  }

  const xrefStart = offset;
  const xref = [
    'xref\n',
    `0 ${objects.length + 1}\n`,
    '0000000000 65535 f \n',
    ...offsets.slice(1).map((item) => `${String(item).padStart(10, '0')} 00000 n \n`),
    `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\n`,
    `startxref\n${xrefStart}\n%%EOF`,
  ].join('');

  chunks.push(Buffer.from(xref, 'utf8'));
  return Buffer.concat(chunks);
}

async function createItauBoletoPdfBuffer(input: BoletoPdfInput) {
  const pixPayload = resolveOfficialPixPayload(input.pixPayload, input.pixCopiaCola, input.pixQrCode);
  logInvalidPixPayload('pixPayload', input.pixPayload);
  logInvalidPixPayload('pixCopiaCola', input.pixCopiaCola);
  logInvalidPixPayload('pixQrCode', input.pixQrCode);
  if (!pixPayload) console.warn('[billing-pdf] Payload Pix EMV não encontrado. Usando QR de simulação no PDF.');

  const amount = Number.isFinite(input.amount) && input.amount > 0 ? input.amount : 123.45;
  const linhaDigitavel = formatItauLinhaDigitavel(input.linhaDigitavel);
  const codigoBarras = formatItauCodigoBarras(input.codigoBarras);
  const issueDate = formatDateBR(input.issueDate ?? new Date());
  const dueDate = formatDateBR(input.dueDate || '2024-05-01');

  const beneficiaryName = clean(
    input.companyName ||
      process.env.BOLETO_BENEFICIARY_NAME ||
      process.env.SOLARA_RAZAO_SOCIAL ||
      process.env.SOLARA_NAME ||
      process.env.COMPANY_NAME ||
      'SIMULACAO S/A',
  );
  const beneficiaryDocument = maskCpfCnpj(
    input.companyCnpj || process.env.BOLETO_BENEFICIARY_CNPJ || process.env.SOLARA_CNPJ || process.env.COMPANY_CNPJ || '11111111000111',
  );
  const beneficiaryAddress = clean(
    input.companyAddress ||
      process.env.BOLETO_BENEFICIARY_ADDRESS ||
      process.env.SOLARA_ADDRESS ||
      process.env.COMPANY_ADDRESS ||
      'Rua Simulação,1234 - Bairro Teste - São Paulo SP CEP.01234-001',
  );

  const payerName = clean(input.clientName || 'PAGADOR - TESTE NOME DO PAGADOR');
  const payerDocument = maskCpfCnpj(input.clientDocument || '00000000000182');
  const payerAddress = clean(input.clientAddress || input.installationAddress || 'Endereço do Pagador - CIDADE - ESTADO - SIGLA ESTADO');
  const docNumber = buildItauDocNumber(input);
  const nossoNumero = buildItauNossoNumero(input, codigoBarras);
  const pixCopyText = pixPayload ?? ITAU_FALLBACK_PIX;

  // ── Resolve new parametric fields ─────────────────────────────────────
  const agenciaCodBeneficiario = input.agenciaCodBeneficiario?.trim() || '0057/12345-7';
  const instrucoes = (input.instrucoes && input.instrucoes.length > 0)
    ? input.instrucoes
    : DEFAULT_INSTRUCOES;
  const descontoAbatimento = input.descontoAbatimento ?? null;
  const moraMulTA = input.moraMulTA ?? null;

  // Amount formatted WITHOUT "R$" prefix — just the decimal number
  const amountFormatted = formatValueOnly(amount);

  const data = {
    linhaDigitavel,
    codigoBarras,
    pixPayload: pixCopyText,
    pixCopyText,
    amount: amountFormatted,
    dueDate,
    issueDate,
    docNumber,
    beneficiaryName,
    beneficiaryDocument,
    beneficiaryAddress,
    payerName,
    payerDocument,
    payerAddress,
    nossoNumero,
    agenciaCodBeneficiario,
    instrucoes,
    descontoAbatimento,
    moraMulTA,
  };

  const parts: string[] = [];
  parts.push(rect(0, 0, ITAU_PAGE_W, ITAU_PAGE_H, '0.91 0.91 0.91'));
  parts.push(rotationMatrix(-0.28, ITAU_PAGE_W / 2, ITAU_PAGE_H / 2));
  parts.push(rect(ITAU_PAPER_X + 5, ITAU_PAPER_Y - 5, ITAU_PAPER_W, ITAU_PAPER_H, '0.70 0.70 0.70'));
  parts.push(rect(ITAU_PAPER_X, ITAU_PAPER_Y, ITAU_PAPER_W, ITAU_PAPER_H, '0.985 0.985 0.975'));
  parts.push(strokeRect(ITAU_PAPER_X, ITAU_PAPER_Y, ITAU_PAPER_W, ITAU_PAPER_H, '0.72 0.72 0.72', 0.35));
  drawPaperNoise(parts);
  parts.push(dashedLine(ITAU_PAPER_X + 8, 299, ITAU_PAPER_X + ITAU_PAPER_W - 8, 299, '0.42 0.42 0.42', 0.35));
  parts.push(tx(ITAU_PAPER_X + 10, 303, 'Corte na linha pontilhada', 5.6, '0.35 0.35 0.35'));

  // Top via: RECIBO DO PAGADOR (no QR / barcode)
  drawItauVia(parts, ITAU_TOP_VIA_Y, 'RECIBO DO PAGADOR', { ...data, withPaymentArea: false });

  // Bottom via: FICHA DE COMPENSAÇÃO (with QR + barcode)
  drawItauVia(parts, ITAU_BOTTOM_VIA_Y, 'FICHA DE COMPENSAÇÃO', { ...data, withPaymentArea: true });

  parts.push('Q');

  return createRawPdfBuffer(parts.join('\n'), ITAU_PAGE_W, ITAU_PAGE_H);
}

// ─── Layout constants (legacy renderer) ───────────────────────────────────────

const PAGE_W = 595;
const PAGE_H = 842;
const ML = 40;
const MR = 40;
const CW = PAGE_W - ML - MR;
const GAP = 10;

export async function createBoletoPdfBuffer(input: BoletoPdfInput) {
  if (process.env.PDF_RENDERER_LEGACY === '1') {
    return createLegacyBoletoPdfBuffer(input);
  }
  return createItauBoletoPdfBuffer(input);
}

async function createLegacyBoletoPdfBuffer(input: BoletoPdfInput) {

  const pixPayload = resolveOfficialPixPayload(input.pixPayload, input.pixCopiaCola, input.pixQrCode);
  console.log('PIX PAYLOAD USADO NO PDF', pixPayload);
  const pixCopyLabel = pixPayload ? 'Pix Cópia e Cola' : 'Pix indisponível';
  const pixCopyText = pixPayload ?? 'Pix indisponível. Utilize boleto.';

  logInvalidPixPayload('pixPayload', input.pixPayload);
  logInvalidPixPayload('pixCopiaCola', input.pixCopiaCola);
  logInvalidPixPayload('pixQrCode', input.pixQrCode);
  if (!pixPayload) console.warn('[billing-pdf] Payload Pix EMV não encontrado. QR não será gerado.');

  const companyCnpj     = input.companyCnpj     || process.env.SOLARA_CNPJ              || process.env.COMPANY_CNPJ   || null;
  const companyAddress  = input.companyAddress  || process.env.SOLARA_ADDRESS            || process.env.COMPANY_ADDRESS || null;
  const supportEmail    = input.supportEmail    || process.env.BILLING_SUPPORT_EMAIL     || 'financeiro@solaraenergia.com.br';
  const supportWhatsapp = input.supportWhatsapp || process.env.BILLING_SUPPORT_WHATSAPP  || process.env.NEXT_PUBLIC_WHATSAPP || '(85) 99999-9999';
  const siteUrl         = input.siteUrl         || process.env.NEXT_PUBLIC_SITE_URL      || 'www.solaraenergia.com.br';
  const siteDisplay     = siteUrl.replace(/^https?:\/\/(www\.)?/, 'www.');
  const issueDate       = formatDateBR(input.issueDate ?? new Date());
  const dueDate         = formatDateBR(input.dueDate);
  const status          = clean(input.status || 'gerado').toUpperCase();
  const description     = input.description || 'Serviços de Energia Solar / Faturamento Mensal';
  const installAddr     = clean(input.installationAddress || input.clientAddress);
  const isPago          = status === 'PAGO';

  const yellow   = '0.98 0.80 0.08';
  const orange   = '1 0.68 0.20';
  const green    = '0.06 0.55 0.38';
  const ink      = '0.008 0.024 0.090';
  const ink800   = '0.12 0.16 0.24';
  const ink600   = '0.28 0.33 0.41';
  const ink400   = '0.55 0.60 0.69';
  const ink100   = '0.94 0.95 0.97';
  const white    = '1 1 1';
  const border   = '0.88 0.91 0.94';
  const sYellow  = '1 0.97 0.83';
  const sGreen   = '0.88 0.97 0.93';
  const yBorder  = '0.93 0.78 0.20';
  const gBorder  = '0.54 0.85 0.68';

  const p: string[] = [];

  function sLabel(x: number, y: number, text: string) {
    p.push(rect(x, y, 2, 10, orange));
    p.push(tx(x + 6, y + 1, text.toUpperCase(), 7, ink400, 'F2'));
  }

  function lv(x: number, y: number, label: string, value: string, maxLen = 34) {
    p.push(tx(x, y, label.toUpperCase(), 6.5, ink400, 'F2'));
    wrap(clean(value), maxLen).slice(0, 2).forEach((ln, i) => {
      p.push(tx(x, y - 13 - i * 11, ln, 9, ink800));
    });
  }

  function sLines(x: number, y: number, value: string, maxLen: number, size = 8, color = ink600, limit = 3) {
    wrap(clean(value), maxLen).slice(0, limit).forEach((ln, i) => {
      p.push(tx(x, y - i * (size + 3), ln, size, color));
    });
  }

  function badge(x: number, y: number, w: number, label: string, fill: string, tc: string) {
    p.push(rrect(x, y, w, 16, 8, fill));
    p.push(tx(x + 7, y + 5, label, 6.5, tc, 'F2'));
  }

  function divider(y: number) {
    p.push(line(ML, y, ML + CW, y, border, 0.4));
  }

  function iconLabel(x: number, y: number, icon: string[][], label: string, value: string, size = 8, maxLen = 38) {
    p.push(...icon.flat());
    p.push(tx(x + 16, y + 8, label.toUpperCase(), 6.5, ink400, 'F2'));
    wrap(clean(value), maxLen).slice(0, 2).forEach((ln, i) => {
      p.push(tx(x + 16, y + 8 - 13 - i * 11, ln, size, ink800));
    });
  }

  p.push(rect(0, 0, PAGE_W, PAGE_H, white));

  const HDR_Y = 750;
  const HDR_H = 92;
  p.push(rect(0, HDR_Y, PAGE_W, HDR_H, ink));
  p.push(rect(0, PAGE_H - 5, PAGE_W, 5, yellow));
  p.push(line(0, HDR_Y, PAGE_W, HDR_Y, '0.12 0.16 0.24', 0.5));
  p.push(line(320, HDR_Y + 10, 320, PAGE_H - 10, '0.18 0.20 0.30', 0.5));

  const RX = 334;
  p.push(tx(RX, 818, 'RESUMO DE FATURAMENTO', 10.5, white, 'F2'));
  p.push(line(RX, 814, PAGE_W - ML, 814, '0.25 0.28 0.38', 0.4));
  p.push(tx(RX, 803, `Emitido em ${issueDate}`, 7.5, '0.72 0.76 0.86'));
  p.push(tx(RX, 792, companyCnpj ? `CNPJ ${maskCpfCnpj(companyCnpj)}` : 'Energia solar por assinatura', 7.5, '0.60 0.66 0.76'));
  if (companyAddress) {
    sLines(RX, 781, companyAddress, 44, 7, '0.52 0.58 0.67', 2);
  } else {
    p.push(tx(RX, 781, 'Cobrança mensal de energia solar', 7, '0.52 0.58 0.67'));
  }
  badge(PAGE_W - ML - 76, 786, 76, isPago ? 'PAGO' : 'GERADO', isPago ? sGreen : yellow, isPago ? green : ink);
  badge(PAGE_W - ML - 76, 768, 76, 'EMISSÃO', '0.10 0.14 0.24', white);
  p.push(tx(ML, HDR_Y + 8, companyCnpj ? `CNPJ ${maskCpfCnpj(companyCnpj)}` : '', 7, '0.42 0.48 0.58'));

  const HERO_Y = 640;
  const HERO_H = 102;
  p.push(rect(0, HERO_Y, PAGE_W, HERO_H, ink100));
  p.push(line(0, HERO_Y, PAGE_W, HERO_Y, border, 0.5));
  p.push(line(0, HERO_Y + HERO_H, PAGE_W, HERO_Y + HERO_H, border, 0.5));
  p.push(rect(0, HERO_Y, 4, HERO_H, orange));
  p.push(tx(ML + 8, HERO_Y + HERO_H - 18, 'VALOR DO FATURAMENTO', 7.5, ink600, 'F2'));
  p.push(tx(ML + 8, HERO_Y + HERO_H - 52, formatCurrencyBRL(input.amount), 32, ink, 'F2'));
  p.push(tx(ML + 8, HERO_Y + 10, description, 8, ink600));
  p.push(line(390, HERO_Y + 12, 390, HERO_Y + HERO_H - 12, border, 0.5));

  const DX = 404;
  p.push(...iconCalendar(DX, HERO_Y + HERO_H - 20, ink600, 0.85));
  p.push(tx(DX + 14, HERO_Y + HERO_H - 14, 'VENCIMENTO', 7, ink600, 'F2'));
  p.push(tx(DX, HERO_Y + HERO_H - 40, dueDate, 19, ink, 'F2'));
  badge(DX, HERO_Y + 28, 72, isPago ? 'PAGO' : 'A VENCER', isPago ? sGreen : sYellow, isPago ? green : '0.60 0.42 0.02');
  p.push(tx(DX, HERO_Y + 13, `Emissão ${issueDate}`, 7, ink400));

  const CARD_Y = 516;
  const CARD_H = 108;
  const CARD_W = (CW - GAP) / 2;

  p.push(rrect(ML, CARD_Y, CARD_W, CARD_H, 8, white, border));
  p.push(rect(ML, CARD_Y + CARD_H - 4, CARD_W, 4, green));
  sLabel(ML + 14, CARD_Y + CARD_H - 16, 'Dados do cliente');

  const nameY = CARD_Y + CARD_H - 38;
  p.push(...iconPerson(ML + 14, nameY - 4, green, 0.8));
  lv(ML + 27, nameY, 'Nome', input.clientName, 36);

  const docY = CARD_Y + CARD_H - 64;
  p.push(...iconReceipt(ML + 14, docY - 4, ink400, 0.8));
  lv(ML + 27, docY, 'CPF / CNPJ', maskCpfCnpj(input.clientDocument), 36);

  const C2X = ML + CARD_W + GAP;
  p.push(rrect(C2X, CARD_Y, CARD_W, CARD_H, 8, white, border));
  p.push(rect(C2X, CARD_Y + CARD_H - 4, CARD_W, 4, orange));
  sLabel(C2X + 14, CARD_Y + CARD_H - 16, 'Unidade consumidora');
  p.push(...iconPin(C2X + 14, CARD_Y + CARD_H - 46, orange, 0.9));
  sLines(C2X + 28, CARD_Y + CARD_H - 30, installAddr, 38, 8, ink600, 4);

  const DET_Y = 448;
  const DET_H = 72;
  p.push(rrect(ML, DET_Y, CW, DET_H, 8, white, border));
  p.push(rect(ML, DET_Y + DET_H - 4, CW, 4, ink));
  sLabel(ML + 14, DET_Y + DET_H - 16, 'Detalhamento da cobrança');
  p.push(...iconReceipt(ML + 14, DET_Y + DET_H - 42, ink, 0.85));
  lv(ML + 28, DET_Y + DET_H - 30, 'Descrição', description, 48);
  p.push(line(ML + CW / 2, DET_Y + 10, ML + CW / 2, DET_Y + DET_H - 24, border, 0.4));
  p.push(...iconReceipt(ML + CW / 2 + 10, DET_Y + DET_H - 42, ink400, 0.85));
  lv(ML + CW / 2 + 24, DET_Y + DET_H - 30, 'Faturamento ID', clean(input.faturamentoId), 24);

  const PAY_Y = 148;
  const PAY_H = 292;
  p.push(rrect(ML, PAY_Y, CW, PAY_H, 10, white, border));

  const BAND_H = 40;
  const BAND_Y = PAY_Y + PAY_H - BAND_H;
  p.push(rect(ML, BAND_Y, CW, BAND_H, ink));
  p.push(...iconPix(ML + 14, BAND_Y + 14, yellow, 0.9));
  p.push(tx(ML + 28, BAND_Y + BAND_H - 14, 'PAGUE COM PIX OU BOLETO', 10.5, white, 'F2'));
  badge(ML + CW - 96, BAND_Y + 12, 82, 'INSTANTÂNEO', yellow, ink);

  const INNER_Y = BAND_Y - 8;
  const LX = ML + 16;
  const RIGHT_DIVIDER_X = ML + CW - 152;

  p.push(tx(LX, INNER_Y - 10, 'Linha digitável', 9, ink800, 'F2'));
  sLines(LX, INNER_Y - 26, clean(input.linhaDigitavel), 56, 7.5, ink600, 3);
  p.push(line(LX, INNER_Y - 66, RIGHT_DIVIDER_X - 10, INNER_Y - 66, border, 0.4));
  p.push(...iconPix(LX, INNER_Y - 82, green, 0.8));
  p.push(tx(LX + 13, INNER_Y - 76, pixCopyLabel, 9, ink800, 'F2'));
  sLines(LX, INNER_Y - 92, pixCopyText, 54, 7, ink600, 4);

  const QR_SIZE = 124;
  const QR_X = ML + CW - QR_SIZE - 14;
  const QR_LABEL_Y = INNER_Y - 10;
  const QR_BASE_Y = QR_LABEL_Y - 10 - QR_SIZE;

  p.push(tx(QR_X, QR_LABEL_Y, 'QR Code Pix', 9, ink800, 'F2'));
  if (pixPayload) {
    try {
      p.push(...drawQrCode(pixPayload, QR_X, QR_BASE_Y, QR_SIZE));
    } catch (err) {
      console.error('[billing-pdf] QR Pix indisponível.', err);
      p.push(...drawUnavailableQr(QR_X, QR_BASE_Y, QR_SIZE));
    }
  } else {
    p.push(...drawUnavailableQr(QR_X, QR_BASE_Y, QR_SIZE));
  }
  p.push(tx(QR_X, QR_BASE_Y - 6, 'Abra no app do banco', 6.5, ink400));

  p.push(line(RIGHT_DIVIDER_X, INNER_Y - 6, RIGHT_DIVIDER_X, PAY_Y + 58, border, 0.4));

  const BC_Y = PAY_Y + 8;
  const BC_H = 38;
  p.push(line(LX, BC_Y + BC_H + 10, LX + CW - 30, BC_Y + BC_H + 10, border, 0.4));
  p.push(...iconBarcode(LX, BC_Y + BC_H + 2, ink400, 0.7));
  p.push(tx(LX + 11, BC_Y + BC_H + 6, 'Código de barras', 8, ink800, 'F2'));
  p.push(...drawBarcode(input.codigoBarras, LX, BC_Y, CW - 36, BC_H));
  p.push(tx(LX, BC_Y - 8, clean(input.codigoBarras), 6, ink400));

  const NB_Y = 94;
  const NB_H = 44;
  p.push(rrect(ML, NB_Y, CW, NB_H, 8, sYellow, yBorder));
  p.push(...iconInfo(ML + 12, NB_Y + NB_H / 2 - 6, yellow, 0.9));
  p.push(tx(ML + 30, NB_Y + 31, 'Observação', 8.5, ink800, 'F2'));
  p.push(tx(ML + 30, NB_Y + 18, 'Após o pagamento, a compensação poderá ocorrer conforme o prazo da instituição financeira.', 7.5, ink600));

  const FTR_H = 86;
  p.push(rect(0, 0, PAGE_W, FTR_H, ink));
  p.push(rect(0, FTR_H - 4, PAGE_W, 4, yellow));

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

  p.push(line(ML, 32, PAGE_W - MR, 32, '0.14 0.16 0.24', 0.4));
  p.push(tx(ML, 18, 'Solara Energia: transparência, economia e confiança na sua jornada de energia solar.', 7.5, '0.42 0.48 0.58'));

  const content = p.join('\n');
  const objects = [
    '%PDF-1.4\n',
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >> endobj\n',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >> endobj\n',
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >> endobj\n',
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

  const pdfDoc = await PDFDocument.load(Buffer.concat(chunks));
  const [page] = pdfDoc.getPages();
  const logoBuffer = await getLogoPngBuffer();
  const logoImage = await pdfDoc.embedPng(logoBuffer);
  const logoDims = logoImage.scale(0.58);

  page.drawImage(logoImage, {
    x: 40,
    y: 772,
    width: logoDims.width,
    height: logoDims.height,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}