import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, RefreshCw, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function genHex(len) {
  return Array.from(crypto.getRandomValues(new Uint8Array(len / 2)))
    .map(b => b.toString(16).padStart(2, '0')).join('');
}

export const GameNavbar = ({ gameName, gameEmoji }) => {
  const navigate = useNavigate();
  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <img src="/logo.jpeg" alt="RazerBet" className="w-7 h-7 rounded" />
          <span className="text-sm font-medium hidden sm:block">RazerBet Fair</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xl">{gameEmoji}</span>
          <span className="font-bold text-white">{gameName}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 font-medium">
            PROVABLY FAIR
          </span>
        </div>
        <div className="flex items-center gap-2 text-zinc-500">
          <Shield className="w-4 h-4 text-orange-500" />
          <span className="text-xs hidden sm:block">HMAC-SHA256</span>
        </div>
      </div>
    </nav>
  );
};

export const GameHero = ({ emoji, title, description }) => (
  <div className="hero-bg grid-pattern relative py-14 px-4 text-center border-b border-white/5">
    <div className="max-w-2xl mx-auto">
      <div className="text-6xl mb-5">{emoji}</div>
      <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
        <span className="gradient-text">{title}</span>
      </h1>
      <p className="text-zinc-400 text-base md:text-lg">{description}</p>
    </div>
  </div>
);

export const SeedInput = ({
  serverSeed, setServerSeed,
  clientSeed, setClientSeed,
  clientSeedLabel = "Client Seed",
  clientSeedPlaceholder = "Enter client seed...",
  showServerSeed = true,
  extraFields,
  onCalculate,
  loading,
}) => {
  const [copied, setCopied] = useState(null);

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const CopyBtn = ({ value, id }) => (
    <button onClick={() => copy(value, id)} className="text-zinc-600 hover:text-zinc-300 transition-colors flex-shrink-0 p-1">
      {copied === id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );

  return (
    <div className="bg-zinc-900/50 border border-white/8 rounded-2xl p-6 space-y-5">
      {showServerSeed && (
        <div className="space-y-2">
          <Label className="text-zinc-500 text-xs uppercase tracking-widest">Server Seed (Secret)</Label>
          <div className="flex items-center gap-2">
            <Input
              value={serverSeed}
              onChange={e => setServerSeed(e.target.value)}
              placeholder="Enter revealed server seed..."
              className="bg-black/50 border-white/8 font-mono text-sm h-11 flex-1"
            />
            {serverSeed && <CopyBtn value={serverSeed} id="ss" />}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-zinc-500 text-xs uppercase tracking-widest">{clientSeedLabel}</Label>
        <div className="flex items-center gap-2">
          <Input
            value={clientSeed}
            onChange={e => setClientSeed(e.target.value)}
            placeholder={clientSeedPlaceholder}
            className="bg-black/50 border-white/8 font-mono text-sm h-11 flex-1"
          />
          <button
            onClick={() => setClientSeed(genHex(32))}
            title="Generate random"
            className="p-2.5 rounded-lg border border-white/8 bg-black/40 text-zinc-500 hover:text-white hover:border-orange-500/40 transition-all flex-shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {clientSeed && <CopyBtn value={clientSeed} id="cs" />}
        </div>
      </div>

      {extraFields}

      <Button
        onClick={onCalculate}
        disabled={loading}
        className="w-full btn-primary h-12 text-sm font-bold rounded-xl"
      >
        {loading
          ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Calculating...</>
          : <><Shield className="w-4 h-4 mr-2" />Calculate Result</>
        }
      </Button>
    </div>
  );
};

export const HashCard = ({ hash, label = "Computed Public Hash", note }) => {
  const [copied, setCopied] = useState(false);
  return (
    <div className="bg-zinc-900/50 border border-white/8 rounded-2xl p-5">
      <p className="text-xs uppercase tracking-widest text-zinc-500 mb-3">{label}</p>
      {hash ? (
        <>
          <div className="flex items-start gap-2">
            <code className="font-mono text-xs text-orange-400 break-all flex-1 leading-relaxed">{hash}</code>
            <button
              onClick={() => { navigator.clipboard.writeText(hash); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="text-zinc-600 hover:text-zinc-300 transition-colors flex-shrink-0 p-1 mt-0.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          {note && <p className="text-xs text-zinc-600 mt-2 italic">{note}</p>}
        </>
      ) : (
        <p className="text-zinc-600 text-sm italic">Waiting for seeds...</p>
      )}
    </div>
  );
};

export const LogicBox = ({ lines }) => (
  <div className="bg-black/50 border border-white/5 rounded-xl p-5 mt-2">
    <p className="text-xs uppercase tracking-widest text-zinc-600 mb-3">Logic</p>
    <div className="space-y-2">
      {lines.map((line, i) => (
        <p key={i} className="text-sm text-zinc-400 font-mono leading-relaxed">{line}</p>
      ))}
    </div>
  </div>
);

export const GameFooter = () => (
  <footer className="py-8 px-4 border-t border-white/5 mt-12">
    <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <img src="/logo.jpeg" alt="RazerBet" className="w-8 h-8 rounded" />
        <div>
          <p className="text-sm font-bold text-white">RazerBet</p>
          <p className="text-xs text-zinc-500">Provably Fair System</p>
        </div>
      </div>
      <p className="text-xs text-zinc-600">© 2024 RazerBet — All games are provably fair and verifiable.</p>
    </div>
  </footer>
);
