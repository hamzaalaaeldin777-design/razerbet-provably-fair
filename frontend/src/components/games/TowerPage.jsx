import { useState } from "react";
import { toast } from "sonner";
import { GameNavbar, GameHero, SeedInput, HashCard, LogicBox, GameFooter } from "./SharedLayout";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { hmacSha256, getTowerRows, TOWER_CONFIGS } from "@/lib/gameUtils";

const TowerGrid = ({ rows, difficulty }) => {
  const config = TOWER_CONFIGS[difficulty] || TOWER_CONFIGS.medium;

  if (!rows) return (
    <div className="bg-zinc-900/50 border border-white/8 rounded-2xl p-10 text-center">
      <p className="text-5xl mb-4">🗼</p>
      <p className="text-zinc-600 text-sm italic">Enter seeds to generate tower</p>
    </div>
  );

  return (
    <div className="bg-zinc-900/50 border border-white/8 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs uppercase tracking-widest text-zinc-500">Tower Layout</p>
        <div className="flex gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-red-400"><span className="w-2.5 h-2.5 rounded bg-red-500/40 border border-red-500/60 inline-block" />Bomb</span>
          <span className="flex items-center gap-1.5 text-green-400"><span className="w-2.5 h-2.5 rounded bg-green-500/20 border border-green-500/40 inline-block" />Safe</span>
        </div>
      </div>

      <div className="space-y-1.5">
        {[...rows].reverse().map((row, revIdx) => {
          const rowIdx = rows.length - 1 - revIdx;
          return (
            <div key={rowIdx} className="flex items-center gap-1.5">
              <span className="text-xs text-zinc-600 w-6 text-right flex-shrink-0">{rowIdx + 1}</span>
              <div className={`flex-1 grid gap-1.5`} style={{ gridTemplateColumns: `repeat(${row.tiles}, 1fr)` }}>
                {Array.from({ length: row.tiles }, (_, tileIdx) => {
                  const isBomb = row.bombs.includes(tileIdx);
                  return (
                    <div
                      key={tileIdx}
                      className={`h-10 rounded-lg flex items-center justify-center text-sm border transition-all ${
                        isBomb
                          ? 'bg-red-500/20 border-red-500/50 shadow-sm shadow-red-500/10'
                          : 'bg-green-500/10 border-green-500/25'
                      }`}
                    >
                      {isBomb ? '💣' : '✓'}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-xs text-zinc-600 text-center">
        {config.tiles} tiles · {config.bombs} bomb{config.bombs > 1 ? 's' : ''} per row · {rows.length} rows
      </div>
    </div>
  );
};

export default function TowerPage() {
  const [serverSeed, setServerSeed] = useState("");
  const [clientSeed, setClientSeed] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [hash, setHash] = useState(null);
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    if (!serverSeed || !clientSeed) {
      toast.error("Enter both seeds first");
      return;
    }
    setLoading(true);
    try {
      const mainHash = await hmacSha256(serverSeed, clientSeed);
      const towerRows = await getTowerRows(serverSeed, clientSeed, difficulty);
      setHash(mainHash);
      setRows(towerRows);
      toast.success("Tower generated!");
    } catch {
      toast.error("Calculation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      <GameNavbar gameName="Tower" gameEmoji="🗼" />
      <GameHero
        emoji="🗼"
        title="Tower Verifier"
        description="Verify bomb positions and the safe path through each row of the tower using HMAC-SHA256."
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
                <div className="space-y-2">
                  <Label className="text-zinc-500 text-xs uppercase tracking-widest">Difficulty</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger className="bg-black/50 border-white/8 h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10">
                      {Object.entries(TOWER_CONFIGS).map(([key, cfg]) => (
                        <SelectItem key={key} value={key} className="text-white hover:bg-white/10">
                          {cfg.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              }
            />
            <HashCard
              hash={hash}
              note="Compare with the hash shown before game start."
            />
            <LogicBox lines={[
              "For each row:",
              "  hash = HMAC_SHA256(ServerSeed, ClientSeed + rowIndex)",
              "  Extract bomb positions from hash chunks",
              "  val = parseInt(chunk, 16) % tilesPerRow",
              "Difficulty changes tiles & bombs per row",
            ]} />
          </div>

          <div>
            <TowerGrid rows={rows} difficulty={difficulty} />
          </div>
        </div>
      </main>

      <GameFooter />
    </div>
  );
}
