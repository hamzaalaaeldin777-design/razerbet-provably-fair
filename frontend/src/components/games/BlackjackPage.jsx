import { useState } from "react";
import { toast } from "sonner";
import { GameNavbar, GameHero, SeedInput, HashCard, LogicBox, GameFooter } from "./SharedLayout";
import { hmacSha256, getStandardDeck, shuffleDeck, getSuitColor } from "@/lib/gameUtils";

const CardDisplay = ({ card, index }) => {
  const suitColor = getSuitColor(card.suit);
  return (
    <div className="inline-flex flex-col items-center justify-between bg-zinc-800 border border-white/10 rounded-lg w-10 h-14 text-xs font-bold p-1 select-none shadow-md">
      <span className={`${suitColor} text-xs leading-none`}>{card.rank}</span>
      <span className={`${suitColor} text-base leading-none`}>{card.suit}</span>
    </div>
  );
};

const DeckDisplay = ({ deck }) => {
  if (!deck) return (
    <div className="bg-zinc-900/50 border border-white/8 rounded-2xl p-10 text-center">
      <p className="text-5xl mb-4">🃏</p>
      <p className="text-zinc-600 text-sm italic">Enter seeds to view deck order</p>
    </div>
  );

  const drawOrder = [...deck].reverse();

  return (
    <div className="bg-zinc-900/50 border border-white/8 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs uppercase tracking-widest text-zinc-500">Shuffled Deck</p>
        <p className="text-xs text-zinc-600">Deal order: 52 → 51 → 50...</p>
      </div>

      <div className="bg-black/40 rounded-xl p-4 mb-4">
        <p className="text-xs text-zinc-500 mb-3 font-semibold">First 5 cards dealt:</p>
        <div className="flex gap-2 flex-wrap">
          {drawOrder.slice(0, 5).map((card, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <CardDisplay card={card} index={i} />
              <span className="text-xs text-zinc-600">#{i + 1}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-1 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
        {drawOrder.map((card, i) => (
          <div key={i} className="flex items-center gap-3 py-1.5 border-b border-white/5">
            <span className="text-xs text-zinc-600 w-6 text-right flex-shrink-0">#{i + 1}</span>
            <CardDisplay card={card} />
            <span className={`text-xs font-mono font-bold ${getSuitColor(card.suit)}`}>
              {card.rank}{card.suit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function BlackjackPage() {
  const [serverSeed, setServerSeed] = useState("");
  const [clientSeed, setClientSeed] = useState("");
  const [hash, setHash] = useState(null);
  const [deck, setDeck] = useState(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    if (!serverSeed || !clientSeed) {
      toast.error("Enter both seeds first");
      return;
    }
    setLoading(true);
    try {
      const h = await hmacSha256(serverSeed, clientSeed);
      const standardDeck = getStandardDeck();
      const shuffled = shuffleDeck(standardDeck, h);
      setHash(h);
      setDeck(shuffled);
      toast.success("Deck shuffled!");
    } catch {
      toast.error("Calculation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      <GameNavbar gameName="Blackjack" gameEmoji="🃏" />
      <GameHero
        emoji="🃏"
        title="Blackjack Verifier"
        description="Verify the deck shuffle and deal order using Fisher-Yates algorithm seeded by HMAC-SHA256."
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
              note="Check if this matches the Game Hash provided before play."
            />
            <LogicBox lines={[
              "hash = HMAC_SHA256(ServerSeed, ClientSeed)",
              "Perform Fisher-Yates shuffle on 52-card deck:",
              "  Seeded random from first 16 hex chars of hash",
              "  For i = 51 down to 1:",
              "    j = LCG(seed) % (i+1)",
              "    swap(deck[i], deck[j])",
              "Game draws from end: card 52, 51, 50...",
            ]} />
          </div>

          <div>
            <DeckDisplay deck={deck} />
          </div>
        </div>
      </main>

      <GameFooter />
    </div>
  );
}
