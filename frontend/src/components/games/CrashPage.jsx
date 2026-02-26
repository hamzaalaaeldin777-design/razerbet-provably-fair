import { useState } from "react";
import { toast } from "sonner";
import { TrendingUp, TrendingDown } from "lucide-react";
import { GameNavbar, GameHero, SeedInput, HashCard, LogicBox, GameFooter } from "./SharedLayout";
import { hmacSha256, calculateCrashPoint } from "@/lib/gameUtils";

const CrashDisplay = ({ result }) => {
  if (!result) return (
    <div className="bg-zinc-900/50 border border-white/8 rounded-2xl p-10 text-center">
      <p className="text-zinc-600 text-sm italic">Enter seeds to calculate crash point</p>
    </div>
  );

  const { crashPoint, rawHex, rawValue } = result;
  const isInstant = crashPoint <= 1.01;
  const isHigh = crashPoint >= 10;

  return (
    <div className={`bg-zinc-900/50 border rounded-2xl p-8 text-center ${isInstant ? 'border-red-500/40' : isHigh ? 'border-green-500/40' : 'border-white/8'}`}>
      <p className="text-xs uppercase tracking-widest text-zinc-500 mb-4">Crash Point</p>
      <div className={`text-6xl md:text-8xl font-black mb-4 tracking-tighter ${isInstant ? 'text-red-500' : isHigh ? 'text-green-400' : 'gradient-text'}`}>
        {crashPoint}x
      </div>
      <div className="flex justify-center mb-4">
        {isInstant
          ? <><TrendingDown className="w-6 h-6 text-red-500 mr-2" /><span className="text-red-400 font-bold">INSTANT CRASH</span></>
          : <><TrendingUp className="w-6 h-6 text-orange-500 mr-2" /><span className="text-orange-400 font-bold">{isHigh ? 'HIGH MULTIPLIER' : 'NORMAL ROUND'}</span></>
        }
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 text-left">
        <div className="bg-black/40 rounded-xl p-3">
          <p className="text-xs text-zinc-500 mb-1">First 8 Hex Chars</p>
          <code className="text-xs text-orange-400 font-mono break-all">{rawHex}</code>
        </div>
        <div className="bg-black/40 rounded-xl p-3">
          <p className="text-xs text-zinc-500 mb-1">Raw Value</p>
          <code className="text-xs text-orange-400 font-mono">{rawValue.toFixed(8)}</code>
        </div>
      </div>
    </div>
  );
};

export default function CrashPage() {
  const [serverSeed, setServerSeed] = useState("");
  const [clientSeed, setClientSeed] = useState("");
  const [hash, setHash] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    if (!serverSeed || !clientSeed) {
      toast.error("Enter both seeds first");
      return;
    }
    setLoading(true);
    try {
      const h = await hmacSha256(serverSeed, clientSeed);
      const crashPoint = calculateCrashPoint(h);
      const rawHex = h.slice(0, 8);
      const rawValue = parseInt(rawHex, 16) / 0xFFFFFFFF;
      setHash(h);
      setResult({ crashPoint, rawHex, rawValue });
      toast.success("Crash point calculated!");
    } catch {
      toast.error("Calculation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      <GameNavbar gameName="Crash" gameEmoji="🚀" />
      <GameHero
        emoji="🚀"
        title="Crash Verifier"
        description="Verify the crash point multiplier using HMAC-SHA256. Prove the outcome was determined before your bet."
      />

      <main className="flex-1 py-12 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <SeedInput
              serverSeed={serverSeed} setServerSeed={setServerSeed}
              clientSeed={clientSeed} setClientSeed={setClientSeed}
              clientSeedLabel="Client Seed (Message ID)"
              clientSeedPlaceholder="Enter client seed or message ID..."
              onCalculate={calculate}
              loading={loading}
            />
            <HashCard
              hash={hash}
              note="This must match the hash posted by the bot before the game."
            />
            <LogicBox lines={[
              "hash = HMAC_SHA256(ServerSeed, ClientSeed)",
              "h = parseInt(hash[0..8], 16)  // first 8 hex chars",
              "raw = h / 0xFFFFFFFF",
              "1 in 33 games crash instantly (house edge)",
              "crashPoint = max(1.0, (1 - 0.01) / (1 - raw))",
            ]} />
          </div>

          <div>
            <CrashDisplay result={result} />
          </div>
        </div>
      </main>

      <GameFooter />
    </div>
  );
}
