export type MolecularStateSymbol = 'A' | 'B' | 'C' | 'D';

export interface MolecularStateDefinition {
  symbol: MolecularStateSymbol;
  bitPair: string;
  name: string;
  analogName: string;
  aminoAcidCode: string;
  sideChainFormula: string;
  property: string;
  color: string;
  hexColor: number;
  description: string;
}

export type SimulationViewMode = 'chamber' | 'amino_chain';

export interface MolecularSymbolItem {
  id: number;
  symbol: MolecularStateSymbol;
  bitPair: string;
  byteIndex: number;
  bitOffset: number;
  color: string;
}

export interface EncodedMolecularPayload {
  originalText: string;
  utf8Bytes: number[];
  binaryString: string;
  molecularCode: string;
  symbols: MolecularSymbolItem[];
  timestamp: number;
  checksum: string;
}

export interface RetrievedResult {
  recoveredBinary: string;
  recoveredText: string;
  isVerified: boolean;
  bitExactMatch: boolean;
  timestamp: number;
}

export type ChamberMode = 'idle' | 'encoding' | 'stored' | 'retrieving' | 'verified';
