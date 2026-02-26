import { useState } from "react";
import { toast } from "sonner";
import { Bomb } from "lucide-react";
import { GameNavbar, GameHero, SeedInput, HashCard, LogicBox, GameFooter } from "./SharedLayout";
import { Label } from "@/components/ui/label";
import { hmacSha256, getMinePositions } from "@/lib/gameUtils";

const MinesGrid = ({ minePositions, totalMines }) => {
  if (!minePositions) return (
    <div className="bg-zinc-900/50 border border-white/8 rounded-2xl p-10 text-center">
      <p className="text-5xl mb-4">💣</p>
      <p className="text-zinc-600 text-sm italic">Enter seeds to reveal grid</p>
    </div>
  );

  return (
    <div className="bg-zinc-900/50 border border-white/8 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs uppercase tracking-widest text-zinc-500">Grid Result</p>
        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-red-400"><span className="w-3 h-3 rounded bg-red-500/30 border border-red-500/50 inline-block" />Mine ({totalMines})</span>
          <span className="flex items-center gap-1.5 text-green-400"><span className="w-3 h-3 rounded bg-green-500/20 border border-green-500/30 inline-block" />Safe ({25 - totalMines})</span>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: 25 }, (_, i) => {
          const isMine = minePositions.includes(i);
          return (
            <div
              key={i}
              className={`aspect-square rounded-xl flex items-center justify-center text-lg border transition-all ${
                isMine
                  ? 'bg-red-500/20 border-red-500/50 shadow-sm shadow-red-500/20'
                  : 'bg-green-500/10 border-green-500/20'
              }`}
            >
              {isMine ? <Bomb className="w-5 h-5 text-red-400" /> : <span className="text-green-400 text-xs font-bold">✓</span>}
            </div>
          );
        })}
      </div>
      <div className="mt-4 bg-black/40 rounded-xl p-3">
        <p className="text-xs text-zinc-500 mb-1">Mine Positions (0-based index)</p>
        <code className="text-xs text-orange-400 font-mono">[{minePositions.join(', ')}]</code>
      </div>
    </div>
  );
};

export default function MinesPage() {
  const [serverSeed, setServerSeed] = useState("");
  const [clientSeed, setClientSeed] = useState("");
  const [mineCount, setMineCount] = useState(3);
  const [hash, setHash] = useState(null);
  const [minePositions, setMinePositions] = useState(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    if (!serverSeed || !clientSeed) {
      toast.error("Enter both seeds first");
      return;
    }
    setLoading(true);
    try {
      const h = await hmacSha256(serverSeed, clientSeed);
      const positions = getMinePositions(h, mineCount);
      setHash(h);
      setMinePositions(positions);
      toast.success("Grid revealed!");
    } catch {
      toast.error("Calculation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      <GameNavbar gameName="Mines" gameEmoji="💣" />
      <GameHero
        emoji="💣"
        title="Mines Verifier"
        description="Verify the mine positions on the grid using HMAC-SHA256. See exactly where every bomb was placed."
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
              extraFields={
                <div className="space-y-3">
                  <Label className="text-zinc-500 text-xs uppercase tracking-widest">
                    Number of Mines: <span className="text-orange-400 font-bold">{mineCount}</span>
                  </Label>
                  <input
                    type="range"
                    min={1} max={24} value={mineCount}
                    onChange={e => setMineCount(Number(e.target.value))}
                    className="w-full accent-orange-500 h-1.5"
                  />
                  <div className="flex justify-between text-xs text-zinc-600">
                    <span>1</span><span>5</span><span>10</span><span>15</span><span>20</span><span>24</span>
                  </div>
                </div>
              }
            />
            <HashCard
              hash={hash}
              note="Compare with the hash shown before game start."
            />
            <LogicBox lines={[
              "hash = HMAC_SHA256(ServerSeed, ClientSeed)",
              "Scan hash in 8-char chunks:",
              "  val = parseInt(chunk, 16) % 25",
              "  if val not already picked → add as mine",
              `Repeat until ${mineCount} mine(s) placed (5×5 grid)`,
            ]} />
          </div>

          <div>
            <MinesGrid minePositions={minePositions} totalMines={mineCount} />
          </div>
        </div>
      </main>

      <GameFooter />
    </div>
  );
}
