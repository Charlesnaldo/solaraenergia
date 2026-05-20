export function money(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
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

function drawText(x: number, y: number, text: string, size = 10, color = '0 0 0') {
  return `BT ${color} rg /F1 ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td (${escapePdfText(text)}) Tj ET`;
}

function drawRect(x: number, y: number, width: number, height: number, color = '0 0 0') {
  return `${color} rg ${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re f`;
}

function drawStrokeRect(x: number, y: number, width: number, height: number, color = '0 0 0') {
  return `${color} RG ${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re S`;
}

function drawBarcode(codigoBarras: string | null | undefined, x: number, y: number, maxWidth: number, height: number) {
  const digits = codigoBarras?.replace(/\D/g, '') ?? '';
  if (digits.length < 2) return [drawText(x, y + 18, 'Codigo de barras nao informado', 9, '0.5 0.5 0.5')];

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
  const unit = Math.min(1.4, maxWidth / total);
  const parts: string[] = [];
  let cursor = x;

  for (const segment of segments) {
    const segmentWidth = segment.width * unit;
    if (segment.black) {
      parts.push(drawRect(cursor, y, segmentWidth, height));
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
  for (let version = 1; version <= 20; version += 1) {
    const dataCapacity = getNumRawDataCodewords(version) - ECC_CODEWORDS_PER_BLOCK[version][0] * NUM_ERROR_CORRECTION_BLOCKS[version][0];
    const countBits = version <= 9 ? 8 : 16;
    const usedBits = 4 + countBits + byteLength * 8;
    if (Math.ceil(usedBits / 8) <= dataCapacity) return version;
  }

  return 20;
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

function drawQrCode(value: string | null | undefined, x: number, y: number, size: number) {
  const text = value?.trim();
  if (!text) {
    return [drawStrokeRect(x, y, size, size, '0.7 0.7 0.7'), drawText(x + 15, y + size / 2, 'QR Pix nao informado', 8, '0.5 0.5 0.5')];
  }

  const matrix = encodeQrCode(text);
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

export function createBoletoPdfBuffer(input: {
  clientName: string;
  clientDocument: string;
  amount: number;
  dueDate: string;
  boletoUrl?: string | null;
  linhaDigitavel?: string | null;
  codigoBarras?: string | null;
  pixUrl?: string | null;
  pixQrCode?: string | null;
}) {
  const qrValue = input.pixQrCode || input.pixUrl;
  const parts: string[] = [
    drawRect(0, 0, 595, 842, '1 1 1'),
    drawText(72, 780, 'Solara Energia', 20),
    drawText(72, 758, 'Boleto de cobranca', 12, '0.3 0.3 0.3'),
    drawStrokeRect(72, 705, 451, 42, '0.8 0.8 0.8'),
    drawText(84, 730, `Valor: ${money(input.amount)}`, 13),
    drawText(260, 730, `Vencimento: ${input.dueDate}`, 13),
    drawText(84, 714, `Documento: ${input.clientDocument}`, 9, '0.3 0.3 0.3'),
    drawText(72, 680, 'Pagador', 12),
    drawText(72, 663, input.clientName, 10),
    drawText(72, 625, 'Linha digitavel', 12),
  ];

  wrap(clean(input.linhaDigitavel), 62).slice(0, 2).forEach((line, index) => {
    parts.push(drawText(72, 607 - index * 14, line, 10));
  });

  parts.push(drawText(72, 558, 'Pix copia e cola / URL', 12));
  wrap(clean(qrValue), 58).slice(0, 4).forEach((line, index) => {
    parts.push(drawText(72, 540 - index * 13, line, 8));
  });

  parts.push(drawText(395, 625, 'QR Code Pix', 12));
  parts.push(...drawQrCode(qrValue, 395, 450, 128));

  parts.push(drawText(72, 155, 'Codigo de barras', 12));
  parts.push(...drawBarcode(input.codigoBarras, 72, 88, 450, 50));
  parts.push(drawText(72, 68, clean(input.codigoBarras), 8, '0.25 0.25 0.25'));
  parts.push(drawText(72, 42, `Boleto URL: ${clean(input.boletoUrl)}`, 8, '0.35 0.35 0.35'));

  const content = parts.join('\n');
  const objects = [
    '%PDF-1.4\n',
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj\n',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n',
    `5 0 obj << /Length ${Buffer.byteLength(content, 'utf8')} >> stream\n${content}\nendstream endobj\n`,
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
    '0 6\n',
    '0000000000 65535 f \n',
    ...offsets.slice(1).map((off) => `${String(off).padStart(10, '0')} 00000 n \n`),
    'trailer << /Size 6 /Root 1 0 R >>\n',
    `startxref\n${xrefStart}\n%%EOF`,
  ].join('');

  chunks.push(Buffer.from(xrefLines, 'utf8'));
  return Buffer.concat(chunks);
}
