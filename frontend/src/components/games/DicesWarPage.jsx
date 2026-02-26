import { useState } from "react";
import { toast } from "sonner";
import { RefreshCw, Shield } from "lucide-react";
import { GameNavbar, GameHero, LogicBox, GameFooter } from "./SharedLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getDiceWarResult } from "@/lib/gameUtils";

const DieFace = ({ value, label, winner, isWinner }) => {
  const dots = {
    1: [[50, 50]],
    2: [[25, 25], [75, 75]],
    3: [[25, 25], [50, 50], [75, 75]],
    4: [[25, 25], [75, 25], [25, 75], [75, 75]],
    5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
    6: [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]],
  };

  return (
    <div className="text-center">
      <p className="text-xs uppercase tracking-widest text-zinc-500 mb-3">{label}</p>
      <div className={`relative w-28 h-28 mx-auto rounded-2xl border-2 transition-all ${
        value === null
          ? 'bg-zinc-900/50 border-white/10'
          : isWinner
            ? 'bg-gradient-to-br from-orange-500/20 to-red-600/20 border-orange-500/60 shadow-lg shadow-orange-500/20'
            : 'bg-zinc-900/80 border-white/15'
      }`}>
        {value ? (
          <svg viewBox="0 0 100 100" className="w-full h-full p-2">
            {(dots[value] || []).map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r="8" fill={isWinner ? '#f97316' : '#a1a1aa'} />
            ))}
          </svg>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-sm">?</div>
        )}
      </div>
      {value && (
        <div className={`mt-3 text-2xl font-black ${isWinner ? 'gradient-text' : 'text-zinc-400'}`}>{value}</div>
      )}
      {isWinner && winner !== 'tie' && (
        <div className="mt-1 text-xs text-orange-400 font-bold uppercase tracking-wide">Winner!</div>
      )}
    </div>
  );
};

const DiceResult = ({ result }) => {
  if (!result) return (
    <div className="bg-zinc-900/50 border border-white/8 rounded-2xl p-10 text-center">
      <p className="text-7xl mb-4">🎲</p>
      <p className="text-zinc-600 text-sm italic">Enter Message ID to verify</p>
    </div>
  );

  const { userDie, botDie, winner, reversed, fallback } = result;

  return (
    <div className={`bg-zinc-900/50 border rounded-2xl p-8 ${fallback ? 'border-yellow-500/30' : 'border-white/8'}`}>
      <p className="text-xs uppercase tracking-widest text-zinc-500 mb-6 text-center">Game Result</p>

      <div className="flex items-center justify-around gap-4 mb-8">
        <DieFace value={userDie} label="You" winner={winner} isWinner={winner === 'user'} />
        <div className="text-center">
          <div className="text-2xl font-black text-zinc-600">VS</div>
          {winner && winner !== 'tie' && (
            <div className={`mt-2 text-xs font-bold ${winner === 'user' ? 'text-green-400' : 'text-red-400'}`}>
              {winner === 'user' ? 'YOU WIN' : 'YOU LOSE'}
            </div>
          )}
          {winner === 'tie' && <div className="mt-2 text-xs font-bold text-yellow-400">TIE</div>}
        </div>
        <DieFace value={botDie} label="Bot" winner={winner} isWinner={winner === 'bot'} />
      </div>

      <div className="bg-black/40 rounded-xl p-4">
        <p className="text-xs text-zinc-500 mb-2">Reversed Message ID</p>
        <code className="text-xs text-orange-400 font-mono break-all">{reversed}</code>
      </div>

      {fallback && (
        <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <p className="text-xs text-yellow-400 font-bold">⚠️ Warning</p>
          <p className="text-xs text-yellow-300/80 mt-1">This Message ID didn't contain enough valid digits (1–6). One or both dice fell back to randomness and cannot be deterministically verified.</p>
        </div>
      )}
    </div>
  );
};

export default function DicesWarPage() {
  const [messageId, setMessageId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const calculate = () => {
    if (!messageId.trim()) {
      toast.error("Enter a Message ID first");
      return;
    }
    setLoading(true);
    try {
      const res = getDiceWarResult(messageId.trim());
      setResult(res);
      if (res.fallback) {
        toast.warning("Message ID doesn't have enough valid digits — result may be random");
      } else {
        toast.success("Dice result verified!");
      }
    } catch {
      toast.error("Calculation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      <GameNavbar gameName="Dice War" gameEmoji="🎲" />
      <GameHero
        emoji="🎲"
        title="Dice War Verifier"
        description="Verify dice rolls directly from the Discord Message ID. The ID itself determines the dice outcome."
      />

      <main className="flex-1 py-12 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-zinc-900/50 border border-white/8 rounded-2xl p-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-zinc-500 text-xs uppercase tracking-widest">Message ID</Label>
                <p className="text-xs text-zinc-600">The Discord Message ID from the game — no server seed needed.</p>
                <Input
                  value={messageId}
                  onChange={e => setMessageId(e.target.value)}
                  placeholder="e.g. 1234567890123456789"
                  className="bg-black/50 border-white/8 font-mono text-sm h-11"
                />
              </div>
              <Button onClick={calculate} disabled={loading} className="w-full btn-primary h-12 text-sm font-bold rounded-xl">
                {loading
                  ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Calculating...</>
                  : <><Shield className="w-4 h-4 mr-2" />Verify Result</>
                }
              </Button>
            </div>

            <LogicBox lines={[
              "reversed = reverse(MessageID digits)",
              "Scan reversed for digits 1–6:",
              "  1st digit found → User die",
              "  2nd digit found → Bot die",
              "Higher roll wins. Tie = house wins.",
            ]} />
          </div>

          <div>
            <DiceResult result={result} />
          </div>
        </div>
      </main>

      <GameFooter />
    </div>
  );
}
