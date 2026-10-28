import React, { useState, useEffect, useRef } from 'react';
import {
  Dna,
  BookOpen,
  X,
  FileCode,
  RotateCcw,
} from 'lucide-react';
import {
  EncodedMolecularPayload,
  RetrievedResult,
  MolecularSymbolItem,
  ChamberMode,
} from './types';
import {
  encodePayload,
  decodePayload,
  MOLECULAR_STATES,
} from './utils/encoder';
import { Chamber3D } from './components/Chamber3D';
import { DataPanels } from './components/DataPanels';
import { ControlDock } from './components/ControlDock';
import { DisclaimerBanner } from './components/DisclaimerBanner';

const STORAGE_KEY = 'molecular_vault_saved_payload';

export default function App() {
  const [inputText, setInputText] = useState<string>(
    '🧬 Synthetic BioStorage Protocol 2026: UTF-8 to Simulated Molecular State'
  );
  const [encodedPayload, setEncodedPayload] = useState<EncodedMolecularPayload | null>(null);
  const [retrievedResult, setRetrievedResult] = useState<RetrievedResult | null>(null);

  // 3D Chamber States
  const [chamberMode, setChamberMode] = useState<ChamberMode>('idle');
  const [activeProgressIndex, setActiveProgressIndex] = useState<number>(-1);
  const [selectedSymbol, setSelectedSymbol] = useState<MolecularSymbolItem | null>(null);

  // Animation / Playback controls
  const [animationSpeed, setAnimationSpeed] = useState<'slow' | 'normal' | 'fast' | 'instant'>('normal');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Guide / Protocol Modal
  const [showProtocolModal, setShowProtocolModal] = useState<boolean>(false);

  // Animation timer ref for cancellation
  const animationTimerRef = useRef<number | null>(null);

  // Load persisted payload on initial mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as EncodedMolecularPayload;
        if (parsed && parsed.molecularCode && parsed.originalText) {
          setEncodedPayload(parsed);
          setInputText(parsed.originalText);
          setChamberMode('stored');
        }
      }
    } catch (e) {
      console.warn('Failed to parse localStorage data:', e);
    }
  }, []);

  // Save to localStorage whenever payload updates
  useEffect(() => {
    if (encodedPayload) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(encodedPayload));
      } catch (e) {
        console.warn('Failed to save to localStorage:', e);
      }
    }
  }, [encodedPayload]);

  // Clean up any running animation timer on unmount
  useEffect(() => {
    return () => {
      if (animationTimerRef.current) {
        clearInterval(animationTimerRef.current);
      }
    };
  }, []);

  // ─────────────────────────────────────────────────────────────
  // 1. ENCODING PIPELINE (Independent software logic + sync 3D)
  // ─────────────────────────────────────────────────────────────
  const handleEncode = () => {
    if (!inputText.trim()) return;

    if (animationTimerRef.current) {
      clearInterval(animationTimerRef.current);
      animationTimerRef.current = null;
    }

    // 1. Genuine deterministic software encoding
    const payload = encodePayload(inputText);
    setEncodedPayload(payload);
    setRetrievedResult(null); // Clear previous retrieval
    setSelectedSymbol(null);

    // 2. Synchronized 3D Chamber Animation
    if (animationSpeed === 'instant') {
      setActiveProgressIndex(payload.symbols.length - 1);
      setChamberMode('stored');
      setIsProcessing(false);
      return;
    }

    setIsProcessing(true);
    setChamberMode('encoding');
    setActiveProgressIndex(0);

    const stepDelay =
      animationSpeed === 'slow' ? 120 : animationSpeed === 'normal' ? 40 : 15;

    let currentIndex = 0;
    const maxIndex = payload.symbols.length - 1;

    animationTimerRef.current = window.setInterval(() => {
      currentIndex += 1;
      setActiveProgressIndex(currentIndex);

      if (currentIndex >= maxIndex) {
        if (animationTimerRef.current) {
          clearInterval(animationTimerRef.current);
          animationTimerRef.current = null;
        }
        setIsProcessing(false);
        setChamberMode('stored');
      }
    }, stepDelay);
  };

  // ─────────────────────────────────────────────────────────────
  // 2. RETRIEVAL & DECODING PIPELINE (Independent software logic)
  // ─────────────────────────────────────────────────────────────
  const handleRetrieve = () => {
    if (!encodedPayload) return;

    if (animationTimerRef.current) {
      clearInterval(animationTimerRef.current);
      animationTimerRef.current = null;
    }

    // 1. Perform deterministic reverse mapping
    const result = decodePayload(encodedPayload.molecularCode, encodedPayload.originalText);

    // 2. Synchronized 3D Scanning Animation
    if (animationSpeed === 'instant') {
      setRetrievedResult(result);
      setChamberMode(result.isVerified ? 'verified' : 'stored');
      setIsProcessing(false);
      return;
    }

    setIsProcessing(true);
    setChamberMode('retrieving');
    setActiveProgressIndex(0);

    const stepDelay =
      animationSpeed === 'slow' ? 100 : animationSpeed === 'normal' ? 35 : 12;

    let currentIndex = 0;
    const maxIndex = encodedPayload.symbols.length - 1;

    animationTimerRef.current = window.setInterval(() => {
      currentIndex += 1;
      setActiveProgressIndex(currentIndex);

      if (currentIndex >= maxIndex) {
        if (animationTimerRef.current) {
          clearInterval(animationTimerRef.current);
          animationTimerRef.current = null;
        }
        setRetrievedResult(result);
        setChamberMode(result.isVerified ? 'verified' : 'stored');
        setIsProcessing(false);
      }
    }, stepDelay);
  };

  // ─────────────────────────────────────────────────────────────
  // 3. RESET PIPELINE
  // ─────────────────────────────────────────────────────────────
  const handleReset = () => {
    if (animationTimerRef.current) {
      clearInterval(animationTimerRef.current);
      animationTimerRef.current = null;
    }

    setInputText('');
    setEncodedPayload(null);
    setRetrievedResult(null);
    setSelectedSymbol(null);
    setActiveProgressIndex(-1);
    setChamberMode('idle');
    setIsProcessing(false);

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear localStorage:', e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Prominent Scientific Notice */}
      <DisclaimerBanner />

      {/* App Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/95 sticky top-0 z-20 px-4 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-emerald-500 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-950">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Dna className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex flex-wrap items-baseline gap-x-2.5">
              <h1 className="font-bold text-lg sm:text-xl tracking-tight text-white">
                Protein Based Storage
              </h1>
              <span className="text-xs font-mono text-cyan-400 font-medium">
                Yash Prasad and Armaan Kumar
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono hidden sm:block">
              Functional 4-State Reversible Molecular Bit-Mapping & 3D Containment Chamber
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            disabled={isProcessing}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-rose-400 border border-slate-700 text-xs font-mono flex items-center gap-1.5 transition"
            title="Clear data and reset simulation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            onClick={() => setShowProtocolModal(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-mono flex items-center gap-1.5 transition"
            title="View protocol details"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Protocol Guide</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 pb-28 space-y-6">
        {/* 3D Protein Storage Chamber Hero Section */}
        <section aria-label="3D Storage Chamber">
          <Chamber3D
            symbols={encodedPayload ? encodedPayload.symbols : []}
            mode={chamberMode}
            activeProgressIndex={activeProgressIndex}
            onSelectSymbol={setSelectedSymbol}
            selectedSymbol={selectedSymbol}
            speed={animationSpeed}
            setSpeed={setAnimationSpeed}
          />
        </section>

        {/* 4 Separate Data Panels in 2x2 Grid */}
        <section aria-label="Data Panels">
          <DataPanels
            inputText={inputText}
            setInputText={setInputText}
            encodedPayload={encodedPayload}
            retrievedResult={retrievedResult}
            onEncode={handleEncode}
            onRetrieve={handleRetrieve}
            onReset={handleReset}
            isProcessing={isProcessing}
            selectedSymbol={selectedSymbol}
            onSelectSymbol={setSelectedSymbol}
          />
        </section>
      </main>

      {/* Sleek Collapsible Bottom Dock */}
      <ControlDock
        onEncode={handleEncode}
        onRetrieve={handleRetrieve}
        onReset={handleReset}
        canEncode={inputText.trim().length > 0}
        canRetrieve={Boolean(encodedPayload)}
        isProcessing={isProcessing}
        mode={chamberMode}
        speed={animationSpeed}
        setSpeed={setAnimationSpeed}
        hasStoredData={Boolean(encodedPayload)}
      />

      {/* Protocol / Theory Specification Modal */}
      {showProtocolModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-none flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowProtocolModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800">
                <FileCode className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  Protein Based Storage — Encoding Protocol
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  Developed by Yash Prasad and Armaan Kumar
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs text-slate-300 font-sans leading-relaxed">
              <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200">
                <span className="font-bold uppercase tracking-wide">Notice:</span> This is a
                theoretical software encoding model illustrating 4-state storage
                principles. It is NOT an actual physical wet-lab protein synthesis protocol.
              </div>

              <div>
                <h4 className="font-semibold text-slate-100 text-sm mb-1.5">
                  1. The 4-State Bit-Pair Mapping
                </h4>
                <p className="text-slate-400 mb-2">
                  Standard digital data is encoded in binary (base-2). We partition the continuous
                  binary stream into 2-bit dibits, mapping each pair to a symbolic molecular state:
                </p>
                <div className="grid grid-cols-2 gap-2 font-mono">
                  {(['A', 'B', 'C', 'D'] as const).map((sym) => {
                    const state = MOLECULAR_STATES[sym];
                    return (
                      <div
                        key={sym}
                        className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-5 h-5 rounded flex items-center justify-center font-bold text-slate-950 text-xs"
                            style={{ backgroundColor: state.color }}
                          >
                            {sym}
                          </span>
                          <span className="font-bold text-white">Bits: "{state.bitPair}"</span>
                        </div>
                        <span className="text-[10px] text-slate-400">{state.analogName}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-100 text-sm mb-1.5">
                  2. UTF-8 Reversible Pipeline
                </h4>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] space-y-1 text-slate-400">
                  <div>
                    <span className="text-cyan-400">Input String</span> → UTF-8 TextEncoder →
                    Uint8Array Bytes
                  </div>
                  <div>
                    <span className="text-indigo-400">Uint8Array</span> → 8-bit Padded Strings →
                    Raw Binary Bitstream
                  </div>
                  <div>
                    <span className="text-emerald-400">Binary Bitstream</span> → 2-bit Dibit Slices
                    → Molecular Symbols (A, B, C, D)
                  </div>
                  <div>
                    <span className="text-amber-400">Molecular String</span> → Stored in Chamber
                    State & localStorage
                  </div>
                  <div>
                    <span className="text-emerald-400">Reverse Retrieval</span> → Symbol Map →
                    Binary Bitstream → Uint8Array → TextDecoder UTF-8
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-100 text-sm mb-1.5">
                  3. Verification & Parity
                </h4>
                <p className="text-slate-400">
                  Because the mapping is bijective and deterministic, the recovered UTF-8 output
                  bit-stream is compared against the original input. "Data integrity verified" is
                  only output when the comparison is exact.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowProtocolModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition"
              >
                Close Protocol Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
