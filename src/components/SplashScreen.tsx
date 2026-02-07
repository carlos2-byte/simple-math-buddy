import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 100);   // pig fade-in
    const t2 = setTimeout(() => setPhase(2), 500);   // graph line + coins
    const t3 = setTimeout(() => setPhase(3), 1200);  // text appears
    const t4 = setTimeout(onComplete, 2200);          // done

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden select-none"
      style={{
        background: 'linear-gradient(180deg, #0a1628 0%, #0f2035 30%, #124a2e 70%, #1a6b3c 100%)',
      }}
    >
      {/* Central content */}
      <div className="relative flex flex-col items-center">
        {/* Pig + Graph container */}
        <div className="relative w-64 h-48 flex items-center justify-center">
          {/* Pig */}
          <svg
            viewBox="0 0 120 110"
            className="w-32 h-28 transition-all duration-700 ease-out"
            style={{
              opacity: phase >= 1 ? 1 : 0,
              transform: phase >= 1 ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(20px)',
            }}
          >
            {/* Body */}
            <ellipse cx="60" cy="60" rx="38" ry="30" fill="white" opacity="0.95" />
            {/* Head */}
            <circle cx="88" cy="48" r="20" fill="white" opacity="0.95" />
            {/* Snout */}
            <ellipse cx="103" cy="50" rx="9" ry="7" fill="rgba(255,255,255,0.7)" stroke="white" strokeWidth="1.5" />
            {/* Nostrils */}
            <circle cx="100" cy="49" r="1.8" fill="rgba(10,22,40,0.4)" />
            <circle cx="106" cy="49" r="1.8" fill="rgba(10,22,40,0.4)" />
            {/* Ears */}
            <ellipse cx="76" cy="30" rx="8" ry="12" fill="white" opacity="0.9" />
            <ellipse cx="92" cy="28" rx="7" ry="11" fill="white" opacity="0.9" />
            <ellipse cx="76" cy="30" rx="5" ry="7" fill="rgba(255,255,255,0.5)" />
            <ellipse cx="92" cy="28" rx="4" ry="6" fill="rgba(255,255,255,0.5)" />
            {/* Eyes */}
            <circle cx="82" cy="44" r="2.5" fill="rgba(10,22,40,0.6)" />
            <circle cx="94" cy="42" r="2.5" fill="rgba(10,22,40,0.6)" />
            <circle cx="83" cy="43" r="0.8" fill="white" />
            <circle cx="95" cy="41" r="0.8" fill="white" />
            {/* Smile */}
            <path d="M 96 56 Q 101 60 106 56" stroke="rgba(10,22,40,0.3)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            {/* Legs */}
            <rect x="32" y="82" width="10" height="14" rx="5" fill="white" opacity="0.9" />
            <rect x="48" y="82" width="10" height="14" rx="5" fill="white" opacity="0.9" />
            <rect x="64" y="82" width="10" height="14" rx="5" fill="white" opacity="0.9" />
            <rect x="80" y="82" width="10" height="14" rx="5" fill="white" opacity="0.9" />
            {/* Tail */}
            <path d="M 22 55 Q 12 48 16 58 Q 20 68 12 62" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.9" />
            {/* Coin slot on top */}
            <rect x="50" y="28" width="20" height="3" rx="1.5" fill="rgba(10,22,40,0.15)" />
          </svg>

          {/* Curved 3D orange arrow through the pig */}
          <svg
            className="absolute inset-0 w-full h-full transition-all duration-700 ease-out"
            viewBox="0 0 260 200"
            style={{
              opacity: phase >= 2 ? 1 : 0,
            }}
          >
            <defs>
              <linearGradient id="arrowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#E8870A" />
                <stop offset="40%" stopColor="#F6C544" />
                <stop offset="70%" stopColor="#FFDA44" />
                <stop offset="100%" stopColor="#F0A030" />
              </linearGradient>
              <linearGradient id="arrowEdge" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFDA44" />
                <stop offset="100%" stopColor="#D4850A" />
              </linearGradient>
            </defs>
            {/* Shadow */}
            <path
              d="M 30 185 Q 20 150 60 120 Q 100 85 140 70 Q 180 55 210 40"
              fill="none"
              stroke="rgba(0,0,0,0.2)"
              strokeWidth="16"
              strokeLinecap="round"
              strokeDasharray="300"
              strokeDashoffset={phase >= 2 ? '0' : '300'}
              style={{ transition: 'stroke-dashoffset 0.8s ease-out', filter: 'blur(4px)' }}
            />
            {/* Main thick curved arrow body - outer edge */}
            <path
              d="M 25 180 Q 15 140 55 110 Q 95 75 135 60 Q 175 45 205 32"
              fill="none"
              stroke="url(#arrowEdge)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray="300"
              strokeDashoffset={phase >= 2 ? '0' : '300'}
              style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
            />
            {/* Main thick curved arrow body - highlight */}
            <path
              d="M 25 180 Q 15 140 55 110 Q 95 75 135 60 Q 175 45 205 32"
              fill="none"
              stroke="url(#arrowGrad)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray="300"
              strokeDashoffset={phase >= 2 ? '0' : '300'}
              style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
            />
            {/* Inner highlight for 3D effect */}
            <path
              d="M 27 176 Q 18 140 56 112 Q 96 78 136 63 Q 174 48 203 36"
              fill="none"
              stroke="rgba(255,230,130,0.5)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="290"
              strokeDashoffset={phase >= 2 ? '0' : '290'}
              style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
            />
            {/* Arrowhead */}
            <polygon
              points="200,42 220,18 225,48 200,42"
              fill="url(#arrowEdge)"
              stroke="#D4850A"
              strokeWidth="1"
              style={{
                opacity: phase >= 2 ? 1 : 0,
                transition: 'opacity 0.3s ease-out 0.7s',
              }}
            />
            {/* Arrowhead highlight */}
            <polygon
              points="203,41 218,22 221,44 203,41"
              fill="url(#arrowGrad)"
              style={{
                opacity: phase >= 2 ? 1 : 0,
                transition: 'opacity 0.3s ease-out 0.7s',
              }}
            />
          </svg>

          {/* Falling coins */}
          {phase >= 2 && (
            <>
              <div className="absolute top-0 left-1/2 -translate-x-2" style={{ animation: 'coinFall1 0.8s ease-in forwards' }}>
                <svg width="16" height="16" viewBox="0 0 16 16">
                  <circle cx="8" cy="8" r="7" fill="#F6C544" stroke="#D4A22A" strokeWidth="1" />
                  <text x="8" y="11" textAnchor="middle" fontSize="8" fill="#A67C1A" fontWeight="bold">$</text>
                </svg>
              </div>
              <div className="absolute top-0 left-1/2 translate-x-2" style={{ animation: 'coinFall2 0.9s ease-in 0.15s forwards' }}>
                <svg width="14" height="14" viewBox="0 0 16 16">
                  <circle cx="8" cy="8" r="7" fill="#F6C544" stroke="#D4A22A" strokeWidth="1" />
                  <text x="8" y="11" textAnchor="middle" fontSize="8" fill="#A67C1A" fontWeight="bold">$</text>
                </svg>
              </div>
              <div className="absolute top-0 left-1/2 -translate-x-4" style={{ animation: 'coinFall3 1s ease-in 0.3s forwards' }}>
                <svg width="12" height="12" viewBox="0 0 16 16">
                  <circle cx="8" cy="8" r="7" fill="#F6C544" stroke="#D4A22A" strokeWidth="1" />
                  <text x="8" y="11" textAnchor="middle" fontSize="8" fill="#A67C1A" fontWeight="bold">$</text>
                </svg>
              </div>
            </>
          )}
        </div>

        {/* Text */}
        <div
          className="mt-6 text-center transition-all duration-700 ease-out"
          style={{
            opacity: phase >= 3 ? 1 : 0,
            transform: phase >= 3 ? 'translateY(0)' : 'translateY(15px)',
          }}
        >
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'rgba(255,255,255,0.95)' }}>
            Controle$
          </h1>
          <p className="mt-2 text-sm tracking-wide" style={{ color: 'rgba(74,222,128,0.8)' }}>
            Contas, gastos e investimentos
          </p>
        </div>
      </div>

      <style>{`
        @keyframes coinFall1 {
          0% { transform: translateY(-10px); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translateY(55px); opacity: 0; }
        }
        @keyframes coinFall2 {
          0% { transform: translateY(-10px); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translateY(60px); opacity: 0; }
        }
        @keyframes coinFall3 {
          0% { transform: translateY(-10px); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translateY(50px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
