import React, { useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Check,
  Binary,
  Dna,
  FileText,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import {
  EncodedMolecularPayload,
  RetrievedResult,
  MolecularSymbolItem,
} from '../types';
import { MOLECULAR_STATES, SAMPLE_TEXTS } from '../utils/encoder';

interface DataPanelsProps {
  inputText: string;
  setInputText: (text: string) => void;
  encodedPayload: EncodedMolecularPayload | null;
  retrievedResult: RetrievedResult | null;
  onEncode: () => void;
  onRetrieve: () => void;
  onReset: () => void;
  isProcessing: boolean;
  selectedSymbol: MolecularSymbolItem | null;
  onSelectSymbol: (symbol: MolecularSymbolItem | null) => void;
}

export const DataPanels: React.FC<DataPanelsProps> = ({
  inputText,
  setInputText,
  encodedPayload,
  retrievedResult,
  onEncode,
  onRetrieve,
  onReset,
  isProcessing,
  selectedSymbol,
  onSelectSymbol,
}) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 1800);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (validationError && e.target.value.trim().length > 0) {
      setValidationError(null);
    }
  };

  const handleEncodeClick = () => {
    if (!inputText.trim()) {
      setValidationError('Please enter some text or select an example before encoding.');
      return;
    }
    setValidationError(null);
    onEncode();
  };

  const utf8ByteLength = new TextEncoder().encode(inputText).length;
  const isInputEmpty = inputText.trim().length === 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      {/* ─────────────────────────────────────────────────────────────
          PANEL 1: ORIGINAL TEXT INPUT
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-800 text-cyan-400">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100 text-sm tracking-wide">
                  1. Original Text Input
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  Arbitrary Unicode (UTF-8 encoded)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                {inputText.length} chars
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300">
                {utf8ByteLength} bytes
              </span>
            </div>
          </div>

          {/* Quick presets */}
          <div className="mb-3">
            <div className="text-[11px] font-mono text-slate-400 mb-1.5 flex items-center justify-between">
              <span>Quick Test Payloads:</span>
              <span className="text-slate-500">Click to load</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_TEXTS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={isProcessing}
                  onClick={() => {
                    setInputText(sample.text);
                    setValidationError(null);
                  }}
                  className="px-2 py-1 text-xs rounded-md bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                  title={sample.desc}
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>

          {/* Text Area */}
          <textarea
            rows={4}
            value={inputText}
            onChange={handleTextChange}
            disabled={isProcessing}
            placeholder="Enter text to store in simulated molecular matrix (supports emojis 🧬, ASCII, Japanese, Arabic, symbols)..."
            className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono resize-none transition"
          />

          {validationError && (
            <div className="mt-2 p-2 rounded-lg bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{validationError}</span>
            </div>
          )}
        </div>

        {/* Encode Action Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <div className="text-[11px] font-mono text-slate-500">
            {encodedPayload ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Encoded & Stored in Memory
              </span>
            ) : (
              'Ready to convert to binary & molecular code'
            )}
          </div>

          <button
            onClick={handleEncodeClick}
            disabled={isProcessing || isInputEmpty}
            className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition shadow-lg ${
              isProcessing || isInputEmpty
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border border-cyan-400/40 shadow-cyan-900/30'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Encode & Store</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          PANEL 2: BINARY REPRESENTATION
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-950/80 border border-indigo-800 text-indigo-400">
                <Binary className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100 text-sm tracking-wide">
                  2. Binary Representation
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  8-bit UTF-8 octets (base-2)
                </p>
              </div>
            </div>

            {encodedPayload && (
              <button
                onClick={() => handleCopy(encodedPayload.binaryString, 'binary')}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-mono flex items-center gap-1 transition"
                title="Copy raw binary string"
              >
                {copiedSection === 'binary' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> Copy
                  </>
                )}
              </button>
            )}
          </div>

          {/* Binary Content Stream */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 min-h-[120px] max-h-[160px] overflow-y-auto font-mono text-xs">
            {encodedPayload ? (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {encodedPayload.utf8Bytes.map((byteVal, byteIdx) => {
                    const byteBinary = byteVal.toString(2).padStart(8, '0');
                    return (
                      <div
                        key={byteIdx}
                        className="p-1.5 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 flex flex-col items-center"
                      >
                        <span className="text-[9px] text-slate-500">Byte #{byteIdx}</span>
                        <div className="flex gap-1 mt-0.5">
                          {[0, 2, 4, 6].map((bitStart) => {
                            const pair = byteBinary.substring(bitStart, bitStart + 2);
                            const sym =
                              pair === '00' ? 'A' : pair === '01' ? 'B' : pair === '10' ? 'C' : 'D';
                            const stateColor = MOLECULAR_STATES[sym].color;
                            return (
                              <span
                                key={bitStart}
                                className="px-1 rounded text-[11px] font-bold"
                                style={{
                                  backgroundColor: `${stateColor}15`,
                                  color: stateColor,
                                  border: `1px solid ${stateColor}40`,
                                }}
                                title={`Pair ${pair} → Monomer ${sym}`}
                              >
                                {pair}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center py-6">
                <Binary className="w-6 h-6 mb-1 text-slate-700" />
                <span>Binary conversion will appear here upon encoding</span>
              </div>
            )}
          </div>
        </div>

        {/* Binary Footer Stats */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div>
            Total Bits:{' '}
            <span className="text-indigo-300 font-semibold">
              {encodedPayload ? encodedPayload.binaryString.length : 0}
            </span>
          </div>
          <div>
            Bit-Pairs (2-bit blocks):{' '}
            <span className="text-cyan-300 font-semibold">
              {encodedPayload ? encodedPayload.binaryString.length / 2 : 0}
            </span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          PANEL 3: SIMULATED MOLECULAR CODE
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-400">
                <Dna className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100 text-sm tracking-wide">
                  3. Simulated Molecular Code
                </h3>
                <p className="text-[11px] text-amber-400 font-mono">
                  [Simulated Scheme — Reversible 4-State Bit-Pair Mapping]
                </p>
              </div>
            </div>

            {encodedPayload && (
              <button
                onClick={() => handleCopy(encodedPayload.molecularCode, 'molecular')}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-mono flex items-center gap-1 transition"
                title="Copy molecular sequence string"
              >
                {copiedSection === 'molecular' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> Copy
                  </>
                )}
              </button>
            )}
          </div>

          {/* 4-State Mapping Legend with Amino Acid Analogs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            {(['A', 'B', 'C', 'D'] as const).map((sym) => {
              const info = MOLECULAR_STATES[sym];
              return (
                <div
                  key={sym}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-4 h-4 rounded flex items-center justify-center font-bold text-[11px] text-slate-950"
                        style={{ backgroundColor: info.color }}
                      >
                        {sym}
                      </span>
                      <span className="text-[11px] font-mono font-semibold text-slate-200">
                        {info.aminoAcidCode}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-cyan-400">
                      "{info.bitPair}"
                    </span>
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono mt-1 flex justify-between">
                    <span>{info.sideChainFormula}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Molecular Symbols Stream */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 min-h-[105px] max-h-[145px] overflow-y-auto font-mono text-xs">
            {encodedPayload ? (
              <div className="flex flex-wrap gap-1.5">
                {encodedPayload.symbols.map((item) => {
                  const isSelected = selectedSymbol?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectSymbol(isSelected ? null : item)}
                      className={`px-2 py-1 rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'ring-2 ring-white scale-110 shadow-lg'
                          : 'hover:brightness-125'
                      }`}
                      style={{
                        backgroundColor: `${item.color}25`,
                        color: item.color,
                        border: `1px solid ${item.color}60`,
                      }}
                      title={`Symbol ${item.symbol} = Bits "${item.bitPair}" (Monomer #${item.id + 1})`}
                    >
                      <span>{item.symbol}</span>
                      <span className="text-[9px] opacity-70 font-normal">({item.bitPair})</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center py-5">
                <Dna className="w-6 h-6 mb-1 text-slate-700" />
                <span>Simulated molecular monomers will appear here</span>
              </div>
            )}
          </div>
        </div>

        {/* Molecular Footer Stats */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div>
            Total Monomers:{' '}
            <span className="text-emerald-300 font-semibold">
              {encodedPayload ? encodedPayload.symbols.length : 0}
            </span>
          </div>
          <div>
            Code Density:{' '}
            <span className="text-slate-300">
              {encodedPayload ? `${(encodedPayload.binaryString.length / encodedPayload.symbols.length).toFixed(1)} bits/unit` : '0 bits/unit'}
            </span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          PANEL 4: RECOVERED OUTPUT & VERIFICATION
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100 text-sm tracking-wide">
                  4. Recovered Output & Verification
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  Reverse mapping & UTF-8 decode
                </p>
              </div>
            </div>

            {retrievedResult && (
              <button
                onClick={() => handleCopy(retrievedResult.recoveredText, 'recovered')}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-mono flex items-center gap-1 transition"
                title="Copy recovered text"
              >
                {copiedSection === 'recovered' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> Copy
                  </>
                )}
              </button>
            )}
          </div>

          {/* Verification Banner */}
          {retrievedResult ? (
            retrievedResult.isVerified ? (
              <div className="mb-3 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/70 text-emerald-200 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-2.5">
                  <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold tracking-wide uppercase text-emerald-300">
                      Data integrity verified
                    </div>
                    <div className="text-[11px] text-emerald-400/90 font-mono">
                      Decoded binary matches original UTF-8 bitstream with 0 bit errors.
                    </div>
                  </div>
                </div>
                <div className="px-2 py-1 rounded bg-emerald-900/80 border border-emerald-600 text-[10px] font-mono text-emerald-200">
                  100% PARITY
                </div>
              </div>
            ) : (
              <div className="mb-3 p-3 rounded-xl bg-rose-950/60 border border-rose-500/70 text-rose-200 flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <div className="text-xs">
                  <div className="font-bold uppercase text-rose-300">Verification Failure</div>
                  <div className="text-[11px] text-rose-400 font-mono">
                    Recovered data does not match original input.
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="mb-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 text-xs font-mono flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Awaiting retrieval pass to reconstruct binary and UTF-8 string.</span>
            </div>
          )}

          {/* Recovered Output Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 min-h-[100px] max-h-[140px] overflow-y-auto font-mono text-xs">
            {retrievedResult ? (
              <div>
                <div className="text-slate-200 whitespace-pre-wrap break-words leading-relaxed">
                  {retrievedResult.recoveredText}
                </div>
                <div className="mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 flex items-center justify-between">
                  <span>Reconstructed {retrievedResult.recoveredBinary.length} bits</span>
                  <span>{new TextEncoder().encode(retrievedResult.recoveredText).length} bytes</span>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center py-6">
                <ShieldCheck className="w-6 h-6 mb-1 text-slate-700" />
                <span>Recovered text will appear here after clicking "Retrieve Data"</span>
              </div>
            )}
          </div>
        </div>

        {/* Retrieve Action Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <div className="text-[11px] font-mono text-slate-500">
            {encodedPayload ? 'Stored payload available in chamber' : 'No stored payload in vault'}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRetrieve}
              disabled={isProcessing || !encodedPayload}
              className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition shadow-lg ${
                isProcessing || !encodedPayload
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border border-emerald-400/40 shadow-emerald-900/30'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Retrieve Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
