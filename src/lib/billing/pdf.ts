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
  if (!value) {
    return 'Nao informado';
  }

  const date = value instanceof Date ? value : new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return 'Nao informado';
  }

  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(date);
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

export function maskCpfCnpj(value: string | null | undefined) {
  const digits = onlyDigits(value ?? '');

  if (digits.length === 11) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }

  if (digits.length === 14) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  }

  return clean(value);
}

type Matrix = boolean[][];

const ECC_CODEWORDS_PER_BLOCK = [
  [-1, -1, -1, -1],
  [7, 10, 13, 17],
  [10, 16, 22, 28],
  [15, 26, 36, 44],
  [20, 36, 52, 64],
  [26, 48, 72, 88],
  [18, 64, 96, 112],
  [20, 72, 108, 130],
  [24, 88, 132, 156],
  [30, 110, 160, 192],
  [18, 130, 192, 224],
  [20, 150, 224, 264],
  [24, 176, 260, 308],
  [26, 198, 288, 352],
  [30, 216, 320, 384],
  [22, 240, 360, 432],
  [24, 280, 408, 480],
  [28, 308, 448, 532],
  [30, 338, 504, 588],
  [28, 364, 546, 650],
  [28, 416, 600, 700],
  [28, 442, 644, 750],
  [28, 476, 690, 816],
  [30, 504, 750, 900],
  [30, 560, 810, 960],
  [26, 588, 870, 1050],
  [28, 644, 952, 1110],
  [30, 700, 1020, 1200],
  [30, 728, 1050, 1260],
  [30, 784, 1140, 1350],
  [30, 812, 1200, 1440],
  [30, 868, 1290, 1530],
  [30, 924, 1350, 1620],
  [30, 980, 1440, 1710],
  [30, 1036, 1530, 1800],
  [30, 1064, 1590, 1890],
  [30, 1120, 1680, 1980],
  [30, 1204, 1770, 2100],
  [30, 1260, 1860, 2220],
  [30, 1316, 1950, 2310],
  [30, 1372, 2040, 2430],
];

const NUM_ERROR_CORRECTION_BLOCKS = [
  [-1, -1, -1, -1],
  [1, 1, 1, 1],
  [1, 1, 1, 1],
  [1, 1, 2, 2],
  [1, 2, 2, 4],
  [1, 2, 4, 4],
  [2, 4, 4, 4],
  [2, 4, 6, 5],
  [2, 4, 6, 6],
  [2, 5, 8, 8],
  [4, 5, 8, 8],
  [4, 5, 8, 11],
  [4, 8, 10, 11],
  [4, 9, 12, 16],
  [4, 9, 16, 16],
  [6, 10, 12, 18],
  [6, 10, 17, 16],
  [6, 11, 16, 19],
  [6, 13, 18, 21],
  [7, 14, 21, 25],
  [8, 16, 20, 25],
  [8, 17, 23, 25],
  [9, 17, 23, 34],
  [9, 18, 25, 30],
  [10, 20, 27, 32],
  [12, 21, 29, 35],
  [12, 23, 34, 37],
  [12, 25, 34, 40],
  [13, 26, 35, 42],
  [14, 28, 38, 45],
  [15, 29, 40, 48],
  [16, 31, 43, 51],
  [17, 33, 45, 54],
  [18, 35, 48, 57],
  [19, 37, 51, 60],
  [19, 38, 53, 63],
  [20, 40, 56, 66],
  [21, 43, 59, 70],
  [22, 45, 62, 74],
  [24, 47, 65, 77],
  [25, 49, 68, 81],
];

const ITF_PATTERNS: Record<string, string> = {
  '0': '00110',
  '1': '10001',
  '2': '01001',
  '3': '11000',
  '4': '00101',
  '5': '10100',
  '6': '01100',
  '7': '00011',
  '8': '10010',
  '9': '01010',
};

function escapePdfText(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function clean(value: string | null | undefined) {
  return value?.trim() || 'Nao informado';
}

function wrap(value: string, maxLength: number) {
  const text = value.trim();
  if (text.length <= maxLength) return [text];

  const lines: string[] = [];
  for (let i = 0; i < text.length; i += maxLength) {
    lines.push(text.slice(i, i + maxLength));
  }

  return lines;
}

function drawText(x: number, y: number, text: string, size = 10, color = '0 0 0', font = 'F1') {
  return `BT ${color} rg /${font} ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td (${escapePdfText(text)}) Tj ET`;
}

function drawRect(x: number, y: number, width: number, height: number, color = '0 0 0') {
  return `${color} rg ${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re f`;
}

function drawStrokeRect(x: number, y: number, width: number, height: number, color = '0 0 0') {
  return `${color} RG ${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re S`;
}

function drawLine(x1: number, y1: number, x2: number, y2: number, color = '0.85 0.88 0.92', width = 0.5) {
  return `${width} w ${color} RG ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`;
}

function drawRoundRect(x: number, y: number, width: number, height: number, radius: number, fill = '1 1 1', stroke?: string) {
  const r = Math.min(radius, width / 2, height / 2);
  const c = r * 0.5522847498;
  const path = [
    `${fill} rg`,
    ...(stroke ? [`${stroke} RG`] : []),
    `${(x + r).toFixed(2)} ${y.toFixed(2)} m`,
    `${(x + width - r).toFixed(2)} ${y.toFixed(2)} l`,
    `${(x + width - r + c).toFixed(2)} ${y.toFixed(2)} ${(x + width).toFixed(2)} ${(y + r - c).toFixed(2)} ${(x + width).toFixed(2)} ${(y + r).toFixed(2)} c`,
    `${(x + width).toFixed(2)} ${(y + height - r).toFixed(2)} l`,
    `${(x + width).toFixed(2)} ${(y + height - r + c).toFixed(2)} ${(x + width - r + c).toFixed(2)} ${(y + height).toFixed(2)} ${(x + width - r).toFixed(2)} ${(y + height).toFixed(2)} c`,
    `${(x + r).toFixed(2)} ${(y + height).toFixed(2)} l`,
    `${(x + r - c).toFixed(2)} ${(y + height).toFixed(2)} ${x.toFixed(2)} ${(y + height - r + c).toFixed(2)} ${x.toFixed(2)} ${(y + height - r).toFixed(2)} c`,
    `${x.toFixed(2)} ${(y + r).toFixed(2)} l`,
    `${x.toFixed(2)} ${(y + r - c).toFixed(2)} ${(x + r - c).toFixed(2)} ${y.toFixed(2)} ${(x + r).toFixed(2)} ${y.toFixed(2)} c`,
    stroke ? 'B' : 'f',
  ];

  return path.join(' ');
}

function drawCircle(cx: number, cy: number, radius: number, color: string) {
  const c = radius * 0.5522847498;

  return [
    `${color} rg`,
    `${(cx + radius).toFixed(2)} ${cy.toFixed(2)} m`,
    `${(cx + radius).toFixed(2)} ${(cy + c).toFixed(2)} ${(cx + c).toFixed(2)} ${(cy + radius).toFixed(2)} ${cx.toFixed(2)} ${(cy + radius).toFixed(2)} c`,
    `${(cx - c).toFixed(2)} ${(cy + radius).toFixed(2)} ${(cx - radius).toFixed(2)} ${(cy + c).toFixed(2)} ${(cx - radius).toFixed(2)} ${cy.toFixed(2)} c`,
    `${(cx - radius).toFixed(2)} ${(cy - c).toFixed(2)} ${(cx - c).toFixed(2)} ${(cy - radius).toFixed(2)} ${cx.toFixed(2)} ${(cy - radius).toFixed(2)} c`,
    `${(cx + c).toFixed(2)} ${(cy - radius).toFixed(2)} ${(cx + radius).toFixed(2)} ${(cy - c).toFixed(2)} ${(cx + radius).toFixed(2)} ${cy.toFixed(2)} c`,
    'f',
  ].join(' ');
}

function drawDiamond(cx: number, cy: number, width: number, height: number, color: string) {
  return [
    `${color} rg`,
    `${cx.toFixed(2)} ${(cy + height / 2).toFixed(2)} m`,
    `${(cx + width / 2).toFixed(2)} ${cy.toFixed(2)} l`,
    `${cx.toFixed(2)} ${(cy - height / 2).toFixed(2)} l`,
    `${(cx - width / 2).toFixed(2)} ${cy.toFixed(2)} l`,
    'f',
  ].join(' ');
}

function drawSolaraLogo(x: number, y: number, scale = 1, isDark = false) {
  const yellow = '0.98 0.65 0.15';
  const mainColor = isDark ? '1 1 1' : '0.01 0.02 0.06';
  const parts = [
    drawText(x, y + 15 * scale, 'Solara', 22 * scale, mainColor, 'F2'),
    drawText(x + 70 * scale, y + 15 * scale, 'ENERGIA', 8 * scale, yellow, 'F2'),
  ];

  return parts;
}

function drawShadowedRoundRect(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string,
  stroke?: string,
  shadowAlpha = 0.05,
) {
  // subtle minimalist shadow using a single light gray rect
  const shadow = drawRoundRect(x + 1.5, y - 1.5, width, height, radius, '0.95 0.96 0.98');
  const card = drawRoundRect(x, y, width, height, radius, fill, stroke);
  return [shadow, card];
}

function drawChip(x: number, y: number, width: number, label: string, fill: string, textColor: string) {
  return [drawRoundRect(x, y, width, 14, 7, fill), drawText(x + 8, y + 4.5, label, 6, textColor, 'F2')];
}

function drawBarcode(codigoBarras: string | null | undefined, x: number, y: number, maxWidth: number, height: number) {
  const digits = codigoBarras?.replace(/\D/g, '') ?? '';
  if (digits.length < 2) return [drawText(x, y + 18, 'Codigo de barras nao informado', 8, '0.6 0.6 0.6')];

  const normalized = digits.length % 2 === 0 ? digits : `0${digits}`;
  const segments: Array<{ black: boolean; width: number }> = [
    { black: true, width: 1 },
    { black: false, width: 1 },
    { black: true, width: 1 },
    { black: false, width: 1 },
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
  const total = segments.reduce((sum, segment) => sum + segment.width, 0);
  const unit = Math.min(1.2, maxWidth / total);
  const parts: string[] = [];
  let cursor = x;

  for (const segment of segments) {
    const segmentWidth = segment.width * unit;
    if (segment.black) {
      parts.push(drawRect(cursor, y, segmentWidth, height, '0.1 0.1 0.1'));
    }
    cursor += segmentWidth;
  }

  return parts;
}

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
  for (let i = length - 1; i >= 0; i -= 1) {
    bits.push((value >>> i) & 1);
  }
}

function bitsToBytes(bits: number[]) {
  const result: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let value = 0;
    for (let j = 0; j < 8; j += 1) {
      value = (value << 1) | (bits[i + j] ?? 0);
    }
    result.push(value);
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
  for (let i = 0; i < power; i += 1) {
    result = gfMultiply(result, x);
  }

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
    divisor.forEach((coefficient, index) => {
      result[index] ^= gfMultiply(coefficient, factor);
    });
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
      if (i !== shortBlockLen - blockEccLen || j >= numShortBlocks) {
        result.push(block[i]);
      }
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
  for (let padByte = 0xec; data.length < dataCapacity; padByte ^= 0xec ^ 0x11) {
    data.push(padByte);
  }

  const codewords = addEccAndInterleave(data, version);
  const modules = Array.from({ length: size }, () => Array<boolean>(size).fill(false));
  const isFunction = Array.from({ length: size }, () => Array<boolean>(size).fill(false));

  const setFunction = (x: number, y: number, dark: boolean) => {
    modules[y][x] = dark;
    isFunction[y][x] = true;
  };
  const drawFinder = (x: number, y: number) => {
    for (let dy = -4; dy <= 4; dy += 1) {
      for (let dx = -4; dx <= 4; dx += 1) {
        const xx = x + dx;
        const yy = y + dy;
        if (xx >= 0 && xx < size && yy >= 0 && yy < size) {
          const dist = Math.max(Math.abs(dx), Math.abs(dy));
          setFunction(xx, yy, dist !== 2 && dist !== 4);
        }
      }
    }
  };
  const drawAlignment = (x: number, y: number) => {
    for (let dy = -2; dy <= 2; dy += 1) {
      for (let dx = -2; dx <= 2; dx += 1) {
        setFunction(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }
  };
  const alignmentPositions = () => {
    if (version === 1) return [] as number[];
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

    for (let i = 0; i <= 5; i += 1) setFunction(8, i, ((bitsValue >>> i) & 1) !== 0);
    setFunction(8, 7, ((bitsValue >>> 6) & 1) !== 0);
    setFunction(8, 8, ((bitsValue >>> 7) & 1) !== 0);
    setFunction(7, 8, ((bitsValue >>> 8) & 1) !== 0);
    for (let i = 9; i < 15; i += 1) setFunction(14 - i, 8, ((bitsValue >>> i) & 1) !== 0);
    for (let i = 0; i < 8; i += 1) setFunction(size - 1 - i, 8, ((bitsValue >>> i) & 1) !== 0);
    for (let i = 8; i < 15; i += 1) setFunction(8, size - 15 + i, ((bitsValue >>> i) & 1) !== 0);
    setFunction(8, size - 8, true);
  };
  const drawVersion = () => {
    if (version < 7) return;
    let rem = version;
    for (let i = 0; i < 12; i += 1) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const bitsValue = (version << 12) | rem;
    for (let i = 0; i < 18; i += 1) {
      const bit = ((bitsValue >>> i) & 1) !== 0;
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      setFunction(a, b, bit);
      setFunction(b, a, bit);
    }
  };

  drawFinder(3, 3);
  drawFinder(size - 4, 3);
  drawFinder(3, size - 4);
  for (let i = 0; i < size; i += 1) {
    if (!isFunction[i][6]) setFunction(6, i, i % 2 === 0);
    if (!isFunction[6][i]) setFunction(i, 6, i % 2 === 0);
  }
  const align = alignmentPositions();
  align.forEach((x) => {
    align.forEach((y) => {
      if (!isFunction[y][x]) drawAlignment(x, y);
    });
  });
  drawFormatBits();
  drawVersion();

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

function previewPixValue(value: string) {
  const trimmed = normalizePixPayload(value) ?? '';
  if (trimmed.length <= 24) {
    return trimmed;
  }

  return `${trimmed.slice(0, 12)}...${trimmed.slice(-6)}`;
}

function logInvalidPixPayload(source: string, value: string | null | undefined) {
  const text = normalizePixPayload(value);
  if (!text || validatePixPayload(text)) {
    return;
  }

  console.error(
    `[billing-pdf] Payload Pix invalido em ${source}. QR Pix nao sera gerado. length=${text.length}; preview=${previewPixValue(text)}`,
  );
}

function isHttpUrlText(value: string | null | undefined) {
  const text = value?.trim();
  if (!text) {
    return false;
  }

  try {
    const url = new URL(text);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function drawUnavailablePixQrCode(x: number, y: number, size: number, title = 'Pix indisponivel') {
  return [
    drawRect(x, y, size, size, '1 1 1'),
    drawStrokeRect(x, y, size, size, '0.7 0.7 0.7'),
    drawText(x + 14, y + size / 2 + 8, title, 8, '0.5 0.5 0.5', 'F2'),
    drawText(x + 14, y + size / 2 - 6, 'Utilize boleto', 7, '0.5 0.5 0.5'),
  ];
}

function drawQrCode(value: string | null | undefined, x: number, y: number, size: number) {
  const payload = extractPixPayload(value);
  if (!payload) {
    if (value?.trim()) {
      logInvalidPixPayload('drawQrCode', value);
    }

    throw new Error('Payload Pix invalido');
  }

  console.log('PIX PAYLOAD:', payload);

  const byteLength = Buffer.byteLength(payload, 'utf8');
  const maxVersion = 40;
  const maxCapacity =
    getNumRawDataCodewords(maxVersion) -
    ECC_CODEWORDS_PER_BLOCK[maxVersion][0] * NUM_ERROR_CORRECTION_BLOCKS[maxVersion][0];
  const maxUsedBits = 4 + 16 + byteLength * 8;
  if (Math.ceil(maxUsedBits / 8) > maxCapacity) {
    console.error(`[billing-pdf] Payload Pix excede a capacidade do QR Code. length=${byteLength}`);
    throw new Error('Payload Pix excede a capacidade do QR Code');
  }

  let matrix: Matrix;
  try {
    matrix = encodeQrCode(payload);
  } catch (error) {
    console.error('[billing-pdf] Erro ao gerar QR Code Pix.', error);
    throw new Error('Erro ao gerar QR Code Pix');
  }

  const quiet = 4;
  const moduleSize = size / (matrix.length + quiet * 2);
  const parts = [drawRect(x, y, size, size, '1 1 1'), drawStrokeRect(x, y, size, size, '0.85 0.85 0.85')];

  matrix.forEach((row, rowIndex) => {
    row.forEach((dark, columnIndex) => {
      if (dark) {
        parts.push(drawRect(x + (columnIndex + quiet) * moduleSize, y + size - (rowIndex + quiet + 1) * moduleSize, moduleSize, moduleSize));
      }
    });
  });

  return parts;
}

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

export function createBoletoPdfBuffer(input: BoletoPdfInput) {
  const pixPayload =
    extractPixPayload(input.pixPayload) ??
    extractPixPayload(input.pixCopiaCola) ??
    extractPixPayload(input.pixQrCode) ??
    null;
  const pixFallbackUrl = isHttpUrlText(input.pixUrl) ? input.pixUrl!.trim() : null;
  const pixUnavailableText = pixFallbackUrl
    ? `Pix indisponivel. Utilize boleto. Link Itau: ${pixFallbackUrl}`
    : 'Pix indisponivel. Utilize boleto.';
  const pixCopyPasteLabel = pixPayload ? 'PIX COPIA E COLA' : pixFallbackUrl ? 'LINK PIX ITAU' : 'PIX INDISPONIVEL';
  const pixCopyPasteText =
    pixPayload ?? pixUnavailableText;

  logInvalidPixPayload('pixPayload', input.pixPayload);
  logInvalidPixPayload('pixCopiaCola', input.pixCopiaCola);
  logInvalidPixPayload('pixQrCode', input.pixQrCode);
  if (!pixPayload) {
    console.warn('[billing-pdf] Payload Pix EMV nao encontrado. QR Pix nao sera gerado.');
  }

  const companyCnpj = input.companyCnpj || process.env.SOLARA_CNPJ || process.env.COMPANY_CNPJ || null;
  const companyAddress = input.companyAddress || process.env.SOLARA_ADDRESS || process.env.COMPANY_ADDRESS || null;
  const supportEmail = input.supportEmail || process.env.BILLING_SUPPORT_EMAIL || 'financeiro@solaraenergia.com.br';
  const supportWhatsapp = input.supportWhatsapp || process.env.BILLING_SUPPORT_WHATSAPP || process.env.NEXT_PUBLIC_WHATSAPP || 'Atendimento Solara';
  const siteUrl = input.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'solaraenergia.com.br';
  const siteDisplay = siteUrl.replace(/^https?:\/\//, '');
  const issueDate = input.issueDate ? formatDateBR(input.issueDate) : formatDateBR(new Date());
  const dueDate = formatDateBR(input.dueDate);
  const status = clean(input.status || 'gerado').toUpperCase();
  const description = input.description || 'Servicos de Energia Solar / Faturamento Mensal';
  const installationAddress = clean(input.installationAddress || input.clientAddress);
  const statusLabel = status === 'PAGO' ? 'PAGO' : 'AGUARDANDO';

  // ── Palette ─────────────────────────────────────────────────────────────
  const brandYellow  = '0.98 0.80 0.08';
  const brandOrange  = '1 0.68 0.20';
  const brandGreen   = '0.05 0.50 0.35';
  const slate950     = '0.01 0.02 0.06';
  const slate800     = '0.12 0.16 0.24';
  const slate600     = '0.35 0.40 0.48';
  const slate400     = '0.60 0.65 0.72';
  const slate100     = '0.96 0.97 0.98';
  const white        = '1 1 1';
  const borderColor  = '0.90 0.92 0.94';
  const softYellow   = '1 0.98 0.90';
  const softGreen    = '0.92 0.98 0.95';
  
  const badgeFill = status === 'PAGO' ? softGreen : softYellow;
  const badgeTextColor = status === 'PAGO' ? brandGreen : '0.50 0.35 0.02';

  const M = 45; // wider margins for a premium feel
  const W = 595 - M * 2; // 505

  const parts: string[] = [];

  // ── Helpers ─────────────────────────────────────────────────────────────

  function sectionLabel(x: number, y: number, text: string) {
    parts.push(drawRect(x, y - 1, 1.5, 9, brandOrange));
    parts.push(drawText(x + 6, y, text.toUpperCase(), 7, slate400, 'F2'));
  }

  function addLabelValue(x: number, y: number, label: string, value: string, maxLength = 36) {
    parts.push(drawText(x, y, label.toUpperCase(), 6, slate400, 'F2'));
    wrap(clean(value), maxLength).slice(0, 2).forEach((line, index) => {
      parts.push(drawText(x, y - 12 - index * 10, line, 9, slate800));
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  // PAGE BACKGROUND
  // ════════════════════════════════════════════════════════════════════════
  parts.push(drawRect(0, 0, 595, 842, white));

  // ════════════════════════════════════════════════════════════════════════
  // MINIMALIST HEADER
  // ════════════════════════════════════════════════════════════════════════
  // Subtle top border
  parts.push(drawRect(0, 836, 595, 6, slate950));
  parts.push(drawRect(0, 834, 595, 2, brandOrange));

  // Logo (Dark version for white background)
  parts.push(...drawSolaraLogo(M, 792, 0.9, false));

  // Meta info on the right
  const rightX = 595 - M - 160;
  parts.push(drawText(rightX, 810, 'RESUMO DE FATURAMENTO', 9, slate950, 'F2'));
  parts.push(drawText(rightX, 798, `ID: ${clean(input.faturamentoId).toUpperCase()}`, 7, slate400));
  parts.push(drawText(rightX, 788, `EMISSAO: ${issueDate}`, 7, slate400));
  
  parts.push(...drawChip(rightX + 110, 808, 50, statusLabel, badgeFill, badgeTextColor));

  parts.push(drawLine(M, 775, 595 - M, 775, borderColor, 0.5));

  // ════════════════════════════════════════════════════════════════════════
  // MAIN VALUE AREA (Hero Section)
  // ════════════════════════════════════════════════════════════════════════
  parts.push(drawText(M, 745, 'VALOR TOTAL', 7, slate600, 'F2'));
  parts.push(drawText(M, 715, formatCurrencyBRL(input.amount), 28, slate950, 'F2'));
  
  parts.push(drawText(M + 180, 745, 'VENCIMENTO', 7, slate600, 'F2'));
  parts.push(drawText(M + 180, 715, dueDate, 20, brandOrange, 'F2'));

  // Company details integrated into header flow
  const companyX = 595 - M - 150;
  parts.push(drawText(companyX, 745, 'BENEFICIARIO', 6.5, slate400, 'F2'));
  parts.push(drawText(companyX, 732, 'Solara Energia Ltda', 8, slate800, 'F2'));
  parts.push(drawText(companyX, 722, companyCnpj ? `CNPJ ${maskCpfCnpj(companyCnpj)}` : '', 7, slate600));
  if (companyAddress) {
    const addrLines = wrap(companyAddress, 32);
    parts.push(drawText(companyX, 712, addrLines[0] || '', 7, slate600));
    if (addrLines[1]) parts.push(drawText(companyX, 702, addrLines[1], 7, slate600));
  }

  parts.push(drawLine(M, 690, 595 - M, 690, borderColor, 0.5));

  // ════════════════════════════════════════════════════════════════════════
  // CLIENT & INSTALLATION
  // ════════════════════════════════════════════════════════════════════════
  const clientY = 665;
  sectionLabel(M, clientY, 'Dados do Cliente');
  addLabelValue(M, clientY - 20, 'Nome / Razao Social', input.clientName, 45);
  addLabelValue(M, clientY - 45, 'Documento', maskCpfCnpj(input.clientDocument), 45);

  const instX = M + 260;
  sectionLabel(instX, clientY, 'Unidade Consumidora');
  const addrLines = wrap(installationAddress, 38).slice(0, 3);
  addrLines.forEach((line, i) => {
    parts.push(drawText(instX, clientY - 20 - i * 10, line, 8.5, slate800));
  });

  parts.push(drawLine(M, 605, 595 - M, 605, borderColor, 0.5));

  // ════════════════════════════════════════════════════════════════════════
  // DESCRIPTION
  // ════════════════════════════════════════════════════════════════════════
  const descY = 585;
  sectionLabel(M, descY, 'Detalhamento dos Servicos');
  parts.push(drawText(M, descY - 20, description, 9, slate800));
  parts.push(drawText(M, descY - 32, 'Servico de compensacao de credito de energia solar.', 7.5, slate600));

  // ════════════════════════════════════════════════════════════════════════
  // PAYMENT AREA (Unified Card)
  // ════════════════════════════════════════════════════════════════════════
  const payY = 250;
  const payH = 260;
  parts.push(...drawShadowedRoundRect(M, payY, W, payH, 12, white, borderColor));
  
  // Payment header
  parts.push(drawRect(M + 12, payY + payH - 32, 100, 16, slate950));
  parts.push(drawText(M + 22, payY + payH - 26, 'PAGAMENTO', 8, white, 'F2'));
  parts.push(drawText(M + 120, payY + payH - 26, 'Escolha uma das opcoes abaixo para liquidar sua fatura', 7.5, slate600));

  const innerPayY = payY + payH - 55;

  // PIX COLUMN
  const pixX = M + 20;
  parts.push(drawText(pixX, innerPayY, 'OPCAO 1: PIX INSTANTANEO', 8, slate950, 'F2'));
  parts.push(drawText(pixX, innerPayY - 12, 'Compensacao imediata e segura', 7, brandGreen, 'F2'));

  const qrSize = 110;
  if (pixPayload) {
    try {
      parts.push(...drawQrCode(pixPayload, pixX, innerPayY - 135, qrSize));
    } catch (error) {
      parts.push(...drawUnavailablePixQrCode(pixX, innerPayY - 135, qrSize));
    }
  } else {
    parts.push(...drawUnavailablePixQrCode(pixX, innerPayY - 135, qrSize));
  }
  
  parts.push(drawText(pixX, innerPayY - 150, 'Aponte a camera do seu banco', 6.5, slate600));

  // PIX COPY/PASTE
  const cpX = pixX + qrSize + 25;
  parts.push(drawText(cpX, innerPayY - 30, pixCopyPasteLabel, 7, slate600, 'F2'));
  wrap(pixCopyPasteText, 45).slice(0, 4).forEach((line, i) => {
    parts.push(drawText(cpX, innerPayY - 45 - i * 9, line, 6.5, slate800));
  });

  parts.push(drawLine(M + 15, payY + 85, 595 - M - 15, payY + 85, borderColor, 0.4));

  // BOLETO AREA
  const bolY = payY + 20;
  parts.push(drawText(M + 20, bolY + 48, 'OPCAO 2: BOLETO BANCARIO', 8, slate950, 'F2'));
  parts.push(drawText(M + 20, bolY + 36, clean(input.linhaDigitavel), 8, slate800));
  
  parts.push(...drawBarcode(input.codigoBarras, M + 20, bolY - 5, W - 40, 35));
  parts.push(drawText(M + 20, bolY - 15, `Cod. Barras: ${clean(input.codigoBarras)}`, 6, slate400));

  // ════════════════════════════════════════════════════════════════════════
  // NOTICE
  // ════════════════════════════════════════════════════════════════════════
  parts.push(drawRoundRect(M, 180, W, 45, 8, slate100, borderColor));
  parts.push(drawText(M + 15, 205, 'NOTAS IMPORTANTES', 7, slate800, 'F2'));
  parts.push(drawText(M + 15, 193, '• Pagamentos via Pix sao confirmados na hora. Boletos podem levar ate 72h.', 7.5, slate600));
  parts.push(drawText(M + 15, 183, '• Mantenha seus dados sempre atualizados em nosso portal.', 7.5, slate600));

  // ════════════════════════════════════════════════════════════════════════
  // MINIMALIST FOOTER
  // ════════════════════════════════════════════════════════════════════════
  parts.push(drawLine(M, 100, 595 - M, 100, slate950, 1));
  
  const footerY = 75;
  parts.push(drawText(M, footerY, 'SUPORTE AO CLIENTE', 6.5, slate400, 'F2'));
  parts.push(drawText(M, footerY - 12, supportEmail, 8, slate800, 'F2'));
  parts.push(drawText(M, footerY - 22, supportWhatsapp, 8, slate800));

  parts.push(drawText(M + 180, footerY, 'PORTAL DO CLIENTE', 6.5, slate400, 'F2'));
  parts.push(drawText(M + 180, footerY - 12, siteDisplay, 8, slate800, 'F2'));
  parts.push(drawText(M + 180, footerY - 22, 'Siga-nos nas redes sociais @solaraenergia', 7, slate600));

  parts.push(...drawSolaraLogo(595 - M - 90, footerY - 15, 0.6, false));
  
  parts.push(drawText(M, 25, 'Solara Energia - Transformando o sol in economia para o seu negocio.', 7, slate400));
  parts.push(drawText(595 - M - 60, 25, 'PAGINA 01/01', 7, slate400, 'F2'));

  // ════════════════════════════════════════════════════════════════════════
  // BUILD PDF BYTES  (unchanged)
  // ════════════════════════════════════════════════════════════════════════
  const content = parts.join('\n');
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
