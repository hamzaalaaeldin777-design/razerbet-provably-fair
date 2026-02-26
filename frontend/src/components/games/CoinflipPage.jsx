import { useState } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { GameNavbar, GameHero, HashCard, LogicBox, GameFooter } from "./SharedLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { sha256 } from "@/lib/gameUtils";

function genHex(len) {
  return Array.from(crypto.getRandomValues(new Uint8Array(len / 2)))
    .map(b => b.toString(16).padStart(2, '0')).join('');
}

const CoinDisplay = ({ result }) => {
  if (!result) return (
    <div className="bg-zinc-900/50 border border-white/8 rounded-2xl p-10 text-center">
      <div className="text-7xl mb-4">🪙</div>
      <p className="text-zinc-600 text-sm italic">Enter Message ID to verify</p>
    </div>
  );

  const isHeads = result.outcome === "heads";
  return (
    <div className={`bg-zinc-900/50 border rounded-2xl p-8 text-center ${isHeads ? 'border-orange-500/40' : 'border-zinc-400/30'}`}>
      <p className="text-xs uppercase tracking-widest text-zinc-500 mb-5">Outcome</p>
      <div className="text-8xl mb-5 animate-bounce">{isHeads ? '🟠' : '⚪'}</div>
      <div className={`text-4xl font-black tracking-wider mb-4 ${isHeads ? 'gradient-text' : 'text-zinc-300'}`}>
        {result.outcome.toUpperCase()}
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 text-left">
        <div className="bg-black/40 rounded-xl p-3">
          <p className="text-xs text-zinc-500 mb-1">Last Hash Char</p>
          <code className="text-2xl text-orange-400 font-mono font-bold">{result.lastChar}</code>
        </div>
        <div className="bg-black/40 rounded-xl p-3">
          <p className="text-xs text-zinc-500 mb-1">Type</p>
          <code className="text-sm text-orange-400 font-mono">{result.isEven ? 'Even → HEADS' : 'Odd → TAILS'}</code>
        </div>
      </div>
    </div>
  );
};

export default function CoinflipPage() {
  const [clientSeed, setClientSeed] = useState("");
  const [hash, setHash] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    if (!clientSeed) {
      toast.error("Enter a Message ID or Client Seed first");
      return;
    }
    setLoading(true);
    try {
      const h = await sha256(clientSeed);
      const lastChar = h[h.length - 1];
      const evenChars = new Set(['0', '2', '4', '6', '8', 'a', 'c', 'e']);
      const isEven = evenChars.has(lastChar);
      setHash(h);
      setResult({ outcome: isEven ? 'heads' : 'tails', lastChar, isEven });
      toast.success("Result calculated!");
    } catch {
      toast.error("Calculation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      <GameNavbar gameName="Coinflip" gameEmoji="🪙" />
      <GameHero
        emoji="🪙"
        title="Coinflip Verifier"
        description="Verify the flip result using SHA-256. Only your Message ID is needed — no server seed required."
      />

      <main className="flex-1 py-12 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-zinc-900/50 border border-white/8 rounded-2xl p-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-zinc-500 text-xs uppercase tracking-widest">Client Seed (Message ID)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={clientSeed}
                    onChange={e => setClientSeed(e.target.value)}
                    placeholder="Enter your Discord Message ID..."
                    className="bg-black/50 border-white/8 font-mono text-sm h-11 flex-1"
                  />
                  <button
                    onClick={() => setClientSeed(genHex(16))}
                    title="Generate random"
                    className="p-2.5 rounded-lg border border-white/8 bg-black/40 text-zinc-500 hover:text-white hover:border-orange-500/40 transition-all flex-shrink-0"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <Button onClick={calculate} disabled={loading} className="w-full btn-primary h-12 text-sm font-bold rounded-xl">
                {loading
                  ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Calculating...</>
                  : <><Shield className="w-4 h-4 mr-2" />Calculate Result</>
                }
              </Button>
            </div>

            <HashCard hash={hash} label="Computed SHA-256 Hash" />

            <LogicBox lines={[
              "hash = SHA256(MessageID)",
              "lastChar = hash[last character]",
              "Even (0,2,4,6,8,a,c,e) → HEADS",
              "Odd  (1,3,5,7,9,b,d,f) → TAILS",
            ]} />
          </div>

          <div>
            <CoinDisplay result={result} />
          </div>
        </div>
      </main>

      <GameFooter />
    </div>
  );
}
