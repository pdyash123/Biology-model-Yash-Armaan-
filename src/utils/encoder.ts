import {
  MolecularStateDefinition,
  MolecularStateSymbol,
  MolecularSymbolItem,
  EncodedMolecularPayload,
  RetrievedResult,
} from '../types';

export const MOLECULAR_STATES: Record<MolecularStateSymbol, MolecularStateDefinition> = {
  A: {
    symbol: 'A',
    bitPair: '00',
    name: 'Alanine Analog (Ala / A)',
    analogName: 'L-Alanine (Ala)',
    aminoAcidCode: 'Ala',
    sideChainFormula: '-CH₃',
    property: 'Non-polar / Methyl branch',
    color: '#10b981', // Emerald
    hexColor: 0x10b981,
    description: 'Ground energetic state (00) simulated monomer (Ala analog)',
  },
  B: {
    symbol: 'B',
    bitPair: '01',
    name: 'Serine Analog (Ser / B)',
    analogName: 'L-Serine (Ser)',
    aminoAcidCode: 'Ser',
    sideChainFormula: '-CH₂-OH',
    property: 'Polar neutral / Hydroxyl group',
    color: '#06b6d4', // Cyan
    hexColor: 0x06b6d4,
    description: 'Polar-shifted state (01) simulated monomer (Ser analog)',
  },
  C: {
    symbol: 'C',
    bitPair: '10',
    name: 'Glutamate Analog (Glu / C)',
    analogName: 'L-Glutamate (Glu)',
    aminoAcidCode: 'Glu',
    sideChainFormula: '-(CH₂)₂-COO⁻',
    property: 'Acidic resonance / Carboxylate anion',
    color: '#f59e0b', // Amber
    hexColor: 0xf59e0b,
    description: 'Resonance state (10) simulated monomer (Glu analog)',
  },
  D: {
    symbol: 'D',
    bitPair: '11',
    name: 'Lysine Analog (Lys / D)',
    analogName: 'L-Lysine (Lys)',
    aminoAcidCode: 'Lys',
    sideChainFormula: '-(CH₂)₄-NH₃⁺',
    property: 'Basic positive / Amino terminal cation',
    color: '#f43f5e', // Rose
    hexColor: 0xf43f5e,
    description: 'High-enthalpy state (11) simulated monomer (Lys analog)',
  },
};

export const BIT_PAIR_MAP: Record<string, MolecularStateSymbol> = {
  '00': 'A',
  '01': 'B',
  '10': 'C',
  '11': 'D',
};

export const SYMBOL_MAP: Record<MolecularStateSymbol, string> = {
  A: '00',
  B: '01',
  C: '10',
  D: '11',
};

/** Simple hash computation for integrity checksum display */
export function computeChecksum(str: string): string {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).toUpperCase().padStart(8, '0');
}

/**
 * Encodes arbitrary UTF-8 text into binary bit string and Uint8Array
 */
export function textToBinary(text: string): { binary: string; bytes: number[] } {
  const encoder = new TextEncoder();
  const uint8 = encoder.encode(text);
  const bytes = Array.from(uint8);

  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += bytes[i].toString(2).padStart(8, '0');
  }

  return { binary, bytes };
}

/**
 * Maps binary string into 4-state molecular code symbols
 */
export function binaryToMolecular(binary: string): {
  code: string;
  symbols: MolecularSymbolItem[];
} {
  const symbols: MolecularSymbolItem[] = [];
  let code = '';

  // Process in 2-bit chunks
  for (let i = 0; i < binary.length; i += 2) {
    const bitPair = binary.substring(i, i + 2);
    const symbol = BIT_PAIR_MAP[bitPair] ?? 'A';
    code += symbol;

    const byteIndex = Math.floor(i / 8);
    const bitOffset = i % 8;

    symbols.push({
      id: i / 2,
      symbol,
      bitPair,
      byteIndex,
      bitOffset,
      color: MOLECULAR_STATES[symbol].color,
    });
  }

  return { code, symbols };
}

/**
 * Reverses molecular code into raw binary string
 */
export function molecularToBinary(code: string): string {
  let binary = '';
  for (let i = 0; i < code.length; i++) {
    const sym = code[i].toUpperCase() as MolecularStateSymbol;
    if (SYMBOL_MAP[sym]) {
      binary += SYMBOL_MAP[sym];
    } else {
      binary += '00'; // fallback
    }
  }
  return binary;
}

/**
 * Reconstructs original UTF-8 text from reconstructed binary string
 */
export function binaryToText(binary: string): string {
  if (!binary || binary.length === 0) return '';
  const byteCount = Math.floor(binary.length / 8);
  const bytes = new Uint8Array(byteCount);

  for (let i = 0; i < byteCount; i++) {
    const byteStr = binary.substring(i * 8, (i + 1) * 8);
    bytes[i] = parseInt(byteStr, 2);
  }

  const decoder = new TextDecoder('utf-8', { fatal: false });
  return decoder.decode(bytes);
}

/**
 * Complete encoding pipeline
 */
export function encodePayload(text: string): EncodedMolecularPayload {
  const { binary, bytes } = textToBinary(text);
  const { code, symbols } = binaryToMolecular(binary);
  const checksum = computeChecksum(text);

  return {
    originalText: text,
    utf8Bytes: bytes,
    binaryString: binary,
    molecularCode: code,
    symbols,
    timestamp: Date.now(),
    checksum,
  };
}

/**
 * Complete decoding pipeline from raw molecular code
 */
export function decodePayload(code: string, originalText?: string): RetrievedResult {
  const recoveredBinary = molecularToBinary(code);
  const recoveredText = binaryToText(recoveredBinary);
  const isVerified = originalText !== undefined ? recoveredText === originalText : true;
  const bitExactMatch = originalText !== undefined ? textToBinary(recoveredText).binary === textToBinary(originalText).binary : true;

  return {
    recoveredBinary,
    recoveredText,
    isVerified,
    bitExactMatch,
    timestamp: Date.now(),
  };
}

export const SAMPLE_TEXTS = [
  {
    label: 'Standard ASCII',
    text: 'Synthetic Biology Storage Protocol v4.2',
    desc: 'Alphanumeric payload with punctuation',
  },
  {
    label: 'Unicode Emojis',
    text: '🧬 BIO-VAULT 2026 🧪 ⚡ ✨',
    desc: 'Multi-byte UTF-8 emoji glyphs',
  },
  {
    label: 'Multilingual UTF-8',
    text: 'Molecular Data: ゲノム • جينات • 基因',
    desc: 'Japanese, Arabic & Chinese scripts',
  },
  {
    label: 'Compact Byte Test',
    text: 'Hello!',
    desc: 'Short 6-byte message (24 molecular units)',
  },
];
