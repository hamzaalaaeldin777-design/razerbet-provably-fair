import { useState } from "react";
import { toast } from "sonner";
import { GameNavbar, GameHero, SeedInput, HashCard, LogicBox, GameFooter } from "./SharedLayout";
import { hmacSha256, getMatchBoard } from "@/lib/gameUtils";

const MultiplierBadge = ({ value }) => {
  const isHigh = value >= 25;
  const isMid = value >= 5;
  const isLow = value < 1;
  return (
    <div className={`rounded-xl border flex items-center justify-center text-sm font-black aspect-square transition-all ${
      isHigh
        ? 'bg-orange-500/25 border-orange-500/60 text-orange-400 shadow-sm shadow-orange-500/20'
        : isMid
          ? 'bg-yellow-500/15 border-yellow-500/40 text-yellow-400'
          : isLow
            ? 'bg-red-500/10 border-red-500/25 text-red-400'
            : 'bg-zinc-800/80 border-white/10 text-zinc-300'
    }`}>
      {value}x
    </div>
  );
};

const MatchBoard = ({ board }) => {
  if (!board) return (
    <div className="bg-zinc-900/50 border border-white/8 rounded-2xl p-10 text-center">
      <p className="text-5xl mb-4">🎯</p>
      <p className="text-zinc-600 text-sm italic">Enter seeds to generate board</p>
    </div>
  );

  return (
    <div className="bg-zinc-900/50 border border-white/8 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs uppercase tracking-widest text-zinc-500">Generated Board</p>
        <p className="text-xs text-zinc-600">{board.length} multipliers shuffled</p>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {board.map((val, i) => (
          <MultiplierBadge key={i} value={val} />
        ))}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 text-center text-xs">
        {[
          { label: 'Highest', value: Math.max(...board) + 'x', color: 'text-orange-400' },
          { label: 'Lowest', value: Math.min(...board) + 'x', color: 'text-zinc-400' },
          { label: 'Count', value: board.length + ' tiles', color: 'text-zinc-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-black/40 rounded-xl p-3">
            <p className="text-zinc-600 mb-1">{stat.label}</p>
            <p className={`font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function MatchPage() {
  const [serverSeed, setServerSeed] = useState("");
  const [clientSeed, setClientSeed] = useState("");
  const [hash, setHash] = useState(null);
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    if (!serverSeed || !clientSeed) {
      toast.error("Enter both seeds first");
      return;
    }
    setLoading(true);
    try {
      const h = await hmacSha256(serverSeed, clientSeed);
      const matchBoard = getMatchBoard(h);
      setHash(h);
      setBoard(matchBoard);
      toast.success("Board generated!");
    } catch {
      toast.error("Calculation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      <GameNavbar gameName="Match" gameEmoji="🎯" />
      <GameHero
        emoji="🎯"
        title="Match Verifier"
        description="Verify the multiplier board layout using HMAC-SHA256. Every tile position is cryptographically determined."
      />

      <main className="flex-1 py-12 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <SeedInput
              serverSeed={serverSeed} setServerSeed={setServerSeed}
              clientSeed={clientSeed} setClientSeed={setClientSeed}
              clientSeedLabel="Client Seed (Message ID)"
              clientSeedPlaceholder="Enter client seed..."
              onCalculate={calculate}
              loading={loading}
            />
            <HashCard
              hash={hash}
              note="Matches hash shown before game start."
            />
            <LogicBox lines={[
              "hash = HMAC_SHA256(ServerSeed, ClientSeed)",
              "Start with 20 fixed multipliers",
              "Shuffle using LCG seeded from hash:",
              "  For i = 19 down to 1:",
              "    j = LCG(seed) % (i+1)",
              "    swap(board[i], board[j])",
            ]} />
          </div>

          <div>
            <MatchBoard board={board} />
          </div>
        </div>
      </main>

      <GameFooter />
    </div>
  );
}
