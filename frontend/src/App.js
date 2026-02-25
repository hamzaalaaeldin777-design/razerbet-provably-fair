import { useState, useEffect, useCallback } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import { Toaster, toast } from "sonner";
import { 
  ShieldCheck, 
  Dices, 
  History, 
  Terminal, 
  ChevronDown, 
  ExternalLink,
  Copy,
  Check,
  Coins,
  TrendingUp,
  Grid3X3,
  Layers,
  CircleDot,
  Sparkles,
  Rocket,
  Lock,
  Eye,
  Hash,
  RefreshCw
} from "lucide-react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./components/ui/accordion";
import { ScrollArea } from "./components/ui/scroll-area";
import { Badge } from "./components/ui/badge";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

const GAME_ICONS = {
  coinflip: <Coins className="w-4 h-4" />,
  crash: <TrendingUp className="w-4 h-4" />,
  mines: <Grid3X3 className="w-4 h-4" />,
  tower: <Layers className="w-4 h-4" />,
  blackjack: <Sparkles className="w-4 h-4" />,
  dices_war: <Dices className="w-4 h-4" />,
  match: <CircleDot className="w-4 h-4" />
};

const GAME_LABELS = {
  coinflip: "Coinflip",
  crash: "Crash",
  mines: "Mines",
  tower: "Tower",
  blackjack: "Blackjack",
  dices_war: "Dices War",
  match: "Match"
};

// Discord Icon SVG
const DiscordIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

// Hero Section
const Hero = () => {
  return (
    <section className="hero-bg grid-pattern relative min-h-[90vh] flex flex-col items-center justify-center px-4 py-20">
      <div className="max-w-4xl mx-auto text-center space-y-8 stagger-children">
        {/* Logo */}
        <div className="animate-fade-in opacity-0" style={{ animationDelay: '0.1s' }}>
          <img 
            src="/logo.jpeg" 
            alt="RazerBet Logo" 
            className="w-32 h-32 mx-auto logo-glow animate-float"
            data-testid="hero-logo"
          />
        </div>
        
        {/* Title */}
        <h1 
          className="text-5xl md:text-7xl font-black tracking-tighter uppercase animate-fade-in opacity-0"
          style={{ animationDelay: '0.2s' }}
          data-testid="hero-title"
        >
          <span className="gradient-text">Provably Fair</span>
          <br />
          <span className="text-white">Verification</span>
        </h1>
        
        {/* Subtitle */}
        <p 
          className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto animate-fade-in opacity-0"
          style={{ animationDelay: '0.3s' }}
          data-testid="hero-subtitle"
        >
          Don't trust. <span className="text-white font-semibold">Verify.</span> Validate every game outcome on RazerBet with cryptographic certainty.
        </p>
        
        {/* CTAs */}
        <div 
          className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in opacity-0"
          style={{ animationDelay: '0.4s' }}
        >
          <Button 
            className="btn-primary px-8 py-6 text-lg font-bold rounded-lg"
            onClick={() => document.getElementById('verify-section')?.scrollIntoView({ behavior: 'smooth' })}
            data-testid="verify-now-btn"
          >
            <ShieldCheck className="w-5 h-5 mr-2" />
            Verify Now
          </Button>
          <a 
            href="https://discord.gg/razerbet" 
            target="_blank" 
            rel="noopener noreferrer"
            data-testid="discord-btn"
          >
            <Button className="discord-btn px-8 py-6 text-lg font-bold rounded-lg text-white">
              <DiscordIcon />
              <span className="ml-2">Join Discord</span>
            </Button>
          </a>
        </div>
        
        {/* Stats */}
        <div 
          className="flex flex-wrap justify-center gap-8 pt-8 animate-fade-in opacity-0"
          style={{ animationDelay: '0.5s' }}
        >
          <div className="text-center">
            <div className="text-3xl font-bold gradient-text">100%</div>
            <div className="text-sm text-zinc-500 uppercase tracking-wider">Verifiable</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white">HMAC-SHA256</div>
            <div className="text-sm text-zinc-500 uppercase tracking-wider">Encryption</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold gradient-text">7</div>
            <div className="text-sm text-zinc-500 uppercase tracking-wider">Games</div>
          </div>
        </div>
      </div>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="w-8 h-8 text-zinc-600" />
      </div>
    </section>
  );
};

// Verification Tool
const VerificationTool = () => {
  const [gameType, setGameType] = useState("coinflip");
  const [serverSeed, setServerSeed] = useState("");
  const [clientSeed, setClientSeed] = useState("");
  const [nonce, setNonce] = useState("0");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleVerify = async () => {
    if (!serverSeed || !clientSeed) {
      toast.error("Please enter both server seed and client seed");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/verify`, {
        server_seed: serverSeed,
        client_seed: clientSeed,
        nonce: parseInt(nonce) || 0,
        game_type: gameType
      });
      setResult(response.data);
      toast.success("Verification complete!");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Verification failed");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const copyResult = () => {
    if (result) {
      navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const clearForm = () => {
    setServerSeed("");
    setClientSeed("");
    setNonce("0");
    setResult(null);
  };

  return (
    <section id="verify-section" className="py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4" data-testid="verify-section-title">
            <Terminal className="inline-block w-10 h-10 mr-3 text-orange-500" />
            Verification Tool
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto">
            Enter your game data to verify the outcome was fair and untampered.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Input Panel */}
          <div className="lg:col-span-5">
            <Card className="glass border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Lock className="w-5 h-5 text-orange-500" />
                  Input Seeds
                </CardTitle>
                <CardDescription>Enter your game verification data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Game Type */}
                <div className="space-y-2">
                  <Label className="text-zinc-300">Game Type</Label>
                  <Select value={gameType} onValueChange={setGameType}>
                    <SelectTrigger className="bg-black/40 border-white/10 h-12" data-testid="game-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10">
                      {Object.entries(GAME_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key} className="text-white hover:bg-white/10">
                          <span className="flex items-center gap-2">
                            {GAME_ICONS[key]}
                            {label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Server Seed */}
                <div className="space-y-2">
                  <Label className="text-zinc-300">Server Seed</Label>
                  <Input
                    value={serverSeed}
                    onChange={(e) => setServerSeed(e.target.value)}
                    placeholder="Enter revealed server seed..."
                    className="bg-black/40 border-white/10 h-12 font-mono text-sm"
                    data-testid="server-seed-input"
                  />
                </div>

                {/* Client Seed */}
                <div className="space-y-2">
                  <Label className="text-zinc-300">Client Seed</Label>
                  <Input
                    value={clientSeed}
                    onChange={(e) => setClientSeed(e.target.value)}
                    placeholder="Enter your client seed..."
                    className="bg-black/40 border-white/10 h-12 font-mono text-sm"
                    data-testid="client-seed-input"
                  />
                </div>

                {/* Nonce */}
                <div className="space-y-2">
                  <Label className="text-zinc-300">Nonce</Label>
                  <Input
                    type="number"
                    value={nonce}
                    onChange={(e) => setNonce(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="bg-black/40 border-white/10 h-12 font-mono"
                    data-testid="nonce-input"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={handleVerify}
                    disabled={loading}
                    className="flex-1 btn-primary h-12 font-bold"
                    data-testid="verify-btn"
                  >
                    {loading ? (
                      <div className="spinner mr-2" />
                    ) : (
                      <ShieldCheck className="w-5 h-5 mr-2" />
                    )}
                    {loading ? "Verifying..." : "Verify"}
                  </Button>
                  <Button 
                    onClick={clearForm}
                    variant="outline"
                    className="h-12 border-white/10 hover:bg-white/5"
                    data-testid="clear-btn"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Terminal Output */}
          <div className="lg:col-span-7">
            <div className="terminal h-full min-h-[500px] flex flex-col">
              <div className="terminal-header">
                <div className="terminal-dot red" />
                <div className="terminal-dot yellow" />
                <div className="terminal-dot green" />
                <span className="text-xs text-zinc-500 ml-2 font-mono">verification_output.log</span>
                {result && (
                  <button 
                    onClick={copyResult}
                    className="ml-auto text-zinc-400 hover:text-white transition-colors"
                    data-testid="copy-result-btn"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>
              <ScrollArea className="flex-1 p-4">
                {result ? (
                  <div className="space-y-4 font-mono text-sm" data-testid="verification-result">
                    {/* Status */}
                    <div className={`p-4 rounded-lg ${result.is_valid ? 'verification-success' : 'verification-error'}`}>
                      <div className="flex items-center gap-2">
                        {result.is_valid ? (
                          <Check className="w-5 h-5 text-green-500" />
                        ) : (
                          <span className="text-red-500">✗</span>
                        )}
                        <span className={result.is_valid ? 'text-green-400' : 'text-red-400'}>
                          {result.is_valid ? 'VERIFICATION PASSED' : 'VERIFICATION FAILED'}
                        </span>
                      </div>
                    </div>

                    {/* Steps */}
                    <div className="space-y-2">
                      <div className="text-orange-400 text-xs uppercase tracking-wider mb-2">Calculation Steps</div>
                      {result.calculation_steps.map((step, idx) => (
                        <div key={idx} className="code-line text-zinc-300 pl-4 border-l-2 border-orange-500/30">
                          <span className="text-zinc-500">{`>`}</span> {step}
                        </div>
                      ))}
                    </div>

                    {/* Result */}
                    <div className="space-y-2 pt-4 border-t border-white/5">
                      <div className="text-orange-400 text-xs uppercase tracking-wider mb-2">Game Result</div>
                      <div className="bg-black/50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`game-badge ${gameType}`}>
                            {GAME_ICONS[gameType]}
                            {GAME_LABELS[gameType]}
                          </span>
                        </div>
                        <pre className="text-green-400 whitespace-pre-wrap text-xs">
                          {JSON.stringify(result.result, null, 2)}
                        </pre>
                      </div>
                    </div>

                    {/* Hash */}
                    <div className="space-y-2 pt-4 border-t border-white/5">
                      <div className="text-orange-400 text-xs uppercase tracking-wider mb-2">Server Seed Hash</div>
                      <div className="bg-black/50 p-3 rounded-lg break-all text-xs text-zinc-400">
                        {result.server_seed_hash}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-600 py-20">
                    <Terminal className="w-16 h-16 mb-4 opacity-30" />
                    <p className="text-sm">Enter seeds and click verify to see results</p>
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Live Feed Section
const LiveFeed = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [userStats, setUserStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("feed");

  const fetchGames = useCallback(async () => {
    try {
      const params = selectedGame !== "all" ? `?game_type=${selectedGame}` : "";
      const response = await axios.get(`${API}/history${params}`);
      setGames(response.data.games || []);
    } catch (error) {
      console.error("Failed to fetch games:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedGame]);

  useEffect(() => {
    fetchGames();
    const interval = setInterval(fetchGames, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [fetchGames]);

  const searchUser = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a Discord User ID or username");
      return;
    }
    
    setStatsLoading(true);
    setUserStats(null);
    
    try {
      const response = await axios.get(`${API}/user/${encodeURIComponent(searchQuery.trim())}/stats`);
      setUserStats(response.data);
      setActiveTab("stats");
      toast.success(`Found ${response.data.total_games} games for user`);
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error("User not found or has no games");
      } else {
        toast.error("Failed to fetch user stats");
      }
    } finally {
      setStatsLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <section className="py-24 px-4 bg-[#0a0a0b]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight flex items-center gap-3" data-testid="live-feed-title">
              <div className="live-pulse" />
              Live Verification Feed
            </h2>
            <p className="text-zinc-400 mt-2">Real-time game verifications from Discord</p>
          </div>
        </div>

        {/* Search User Section */}
        <Card className="glass border-white/10 mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label className="text-zinc-300 mb-2 block">Search by Discord User ID or Username</Label>
                <div className="flex gap-2">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter Discord User ID (e.g., 123456789) or username..."
                    className="bg-black/40 border-white/10 h-12 font-mono text-sm flex-1"
                    data-testid="user-search-input"
                    onKeyPress={(e) => e.key === 'Enter' && searchUser()}
                  />
                  <Button 
                    onClick={searchUser}
                    disabled={statsLoading}
                    className="btn-primary h-12 px-6 font-bold"
                    data-testid="user-search-btn"
                  >
                    {statsLoading ? (
                      <div className="spinner" />
                    ) : (
                      <>
                        <History className="w-4 h-4 mr-2" />
                        Search
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Feed / User Stats */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-black/40 border border-white/10 mb-4">
            <TabsTrigger value="feed" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">
              <History className="w-4 h-4 mr-2" />
              Live Feed
            </TabsTrigger>
            <TabsTrigger 
              value="stats" 
              className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400"
              disabled={!userStats}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              User Stats {userStats && `(${userStats.user_id})`}
            </TabsTrigger>
          </TabsList>

          {/* Live Feed Tab */}
          <TabsContent value="feed">
            <div className="flex items-center gap-4 mb-4">
              <Select value={selectedGame} onValueChange={setSelectedGame}>
                <SelectTrigger className="w-40 bg-black/40 border-white/10" data-testid="feed-filter-select">
                  <SelectValue placeholder="All Games" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10">
                  <SelectItem value="all" className="text-white">All Games</SelectItem>
                  {Object.entries(GAME_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key} className="text-white">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={fetchGames}
                className="border-white/10 hover:bg-white/5"
                data-testid="refresh-feed-btn"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>

            <Card className="glass border-white/10 overflow-hidden">
              <ScrollArea className="h-[500px]">
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="spinner" />
                  </div>
                ) : games.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                    <History className="w-16 h-16 mb-4 opacity-30" />
                    <p>No games recorded yet</p>
                    <p className="text-sm mt-2">Games from Discord will appear here</p>
                  </div>
                ) : (
                  <table className="history-table" data-testid="games-table">
                    <thead>
                      <tr>
                        <th>Game</th>
                        <th>User</th>
                        <th>Bet</th>
                        <th>Multiplier</th>
                        <th>Payout</th>
                        <th>Status</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {games.map((game, idx) => (
                        <tr key={game.id || idx} className="feed-item">
                          <td>
                            <span className={`game-badge ${game.game_type}`}>
                              {GAME_ICONS[game.game_type]}
                              {GAME_LABELS[game.game_type]}
                            </span>
                          </td>
                          <td className="font-mono text-sm text-zinc-400">{game.username}</td>
                          <td className="font-mono">{game.bet_amount} {game.currency}</td>
                          <td className="font-mono text-orange-400">{game.multiplier}x</td>
                          <td className="font-mono">{game.payout} {game.currency}</td>
                          <td>
                            <span className={game.won ? 'status-won' : 'status-lost'}>
                              {game.won ? 'WON' : 'LOST'}
                            </span>
                          </td>
                          <td className="text-zinc-500 text-sm">{formatTime(game.timestamp)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </ScrollArea>
            </Card>
          </TabsContent>

          {/* User Stats Tab */}
          <TabsContent value="stats">
            {userStats && (
              <div className="space-y-6">
                {/* Stats Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="glass border-white/10">
                    <CardContent className="pt-6 text-center">
                      <div className="text-3xl font-bold text-white">{userStats.total_games}</div>
                      <div className="text-sm text-zinc-500 uppercase tracking-wider">Total Games</div>
                    </CardContent>
                  </Card>
                  <Card className="glass border-white/10">
                    <CardContent className="pt-6 text-center">
                      <div className="text-3xl font-bold text-green-500">{userStats.win_rate}%</div>
                      <div className="text-sm text-zinc-500 uppercase tracking-wider">Win Rate</div>
                    </CardContent>
                  </Card>
                  <Card className="glass border-white/10">
                    <CardContent className="pt-6 text-center">
                      <div className="text-3xl font-bold gradient-text">{userStats.total_wagered}</div>
                      <div className="text-sm text-zinc-500 uppercase tracking-wider">Total Wagered</div>
                    </CardContent>
                  </Card>
                  <Card className="glass border-white/10">
                    <CardContent className="pt-6 text-center">
                      <div className={`text-3xl font-bold ${userStats.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {userStats.profit >= 0 ? '+' : ''}{userStats.profit}
                      </div>
                      <div className="text-sm text-zinc-500 uppercase tracking-wider">Profit</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Win/Loss Breakdown */}
                <Card className="glass border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-orange-500" />
                      Performance Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-500">{userStats.wins}</div>
                        <div className="text-sm text-green-400">Wins</div>
                      </div>
                      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
                        <div className="text-2xl font-bold text-red-500">{userStats.losses}</div>
                        <div className="text-sm text-red-400">Losses</div>
                      </div>
                      <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg text-center col-span-2 md:col-span-1">
                        <div className="text-2xl font-bold text-orange-500">{userStats.total_payout}</div>
                        <div className="text-sm text-orange-400">Total Payout</div>
                      </div>
                    </div>

                    {/* Games by Type */}
                    {Object.keys(userStats.games_by_type).length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-sm text-zinc-400 mb-3 uppercase tracking-wider">Games by Type</h4>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(userStats.games_by_type).map(([type, count]) => (
                            <span key={type} className={`game-badge ${type}`}>
                              {GAME_ICONS[type]}
                              {GAME_LABELS[type]}: {count}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Games */}
                <Card className="glass border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <History className="w-5 h-5 text-orange-500" />
                      Recent Games (Last 10)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px]">
                      <table className="history-table" data-testid="user-games-table">
                        <thead>
                          <tr>
                            <th>Game</th>
                            <th>Bet</th>
                            <th>Multiplier</th>
                            <th>Payout</th>
                            <th>Status</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userStats.recent_games.map((game, idx) => (
                            <tr key={game.id || idx} className="feed-item">
                              <td>
                                <span className={`game-badge ${game.game_type}`}>
                                  {GAME_ICONS[game.game_type]}
                                  {GAME_LABELS[game.game_type]}
                                </span>
                              </td>
                              <td className="font-mono">{game.bet_amount} {game.currency}</td>
                              <td className="font-mono text-orange-400">{game.multiplier}x</td>
                              <td className="font-mono">{game.payout} {game.currency}</td>
                              <td>
                                <span className={game.won ? 'status-won' : 'status-lost'}>
                                  {game.won ? 'WON' : 'LOST'}
                                </span>
                              </td>
                              <td className="text-zinc-500 text-sm">{formatDate(game.timestamp)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

// How It Works Section
const HowItWorks = () => {
  const steps = [
    {
      number: "1",
      icon: <Lock className="w-6 h-6" />,
      title: "The Result is Locked In",
      description: "Before your bet, our system generates the outcome using a hidden Server Seed. We show you a hash (tamper-proof fingerprint) immediately. Changing the result later would expose us instantly."
    },
    {
      number: "2",
      icon: <Dices className="w-6 h-6" />,
      title: "You Play Normally",
      description: "Place your bet. The outcome is already committed and cryptographically sealed. The hash would break if we tried to change anything."
    },
    {
      number: "3",
      icon: <Eye className="w-6 h-6" />,
      title: "You Verify It",
      description: "After the round, we reveal the Server Seed. You can verify that the seed produces your result AND matches the hash we showed before the game."
    }
  ];

  return (
    <section className="py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4" data-testid="how-it-works-title">
            How <span className="gradient-text">Provably Fair</span> Works
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            We lock the result before you play and give you tools to prove we didn't touch anything.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {steps.map((step, idx) => (
            <Card 
              key={idx} 
              className="glass border-white/10 card-hover relative overflow-hidden"
              data-testid={`step-card-${idx + 1}`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <CardContent className="pt-8 relative">
                <div className="step-number mb-6">{step.number}</div>
                <div className="text-orange-500 mb-4">{step.icon}</div>
                <h3 className="text-xl font-bold mb-3 text-white">{step.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Technical Details Accordion */}
        <Card className="glass border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Hash className="w-5 h-5 text-orange-500" />
              Technical Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="seeds" className="border-white/10">
                <AccordionTrigger className="text-white hover:text-orange-400">
                  What are Server and Client Seeds?
                </AccordionTrigger>
                <AccordionContent className="text-zinc-400">
                  <p className="mb-2"><strong className="text-white">Server Seed:</strong> A secret random string generated by our system. It's hashed and shown to you BEFORE the game, but the actual seed remains hidden until the game ends.</p>
                  <p><strong className="text-white">Client Seed:</strong> A random string you can set yourself. This ensures that even we cannot predict the final outcome, as your seed influences the result.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="nonce" className="border-white/10">
                <AccordionTrigger className="text-white hover:text-orange-400">
                  What is a Nonce?
                </AccordionTrigger>
                <AccordionContent className="text-zinc-400">
                  The nonce is a counter that increments with each bet. Combined with the seeds, it ensures each game has a unique, verifiable outcome even with the same seed pair. This allows multiple games without rotating seeds.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="hmac" className="border-white/10">
                <AccordionTrigger className="text-white hover:text-orange-400">
                  How does HMAC-SHA256 work?
                </AccordionTrigger>
                <AccordionContent className="text-zinc-400">
                  <p className="mb-2">HMAC-SHA256 is a cryptographic function that combines:</p>
                  <code className="block bg-black/50 p-3 rounded text-sm font-mono text-green-400 my-2">
                    HMAC(server_seed, "client_seed:nonce") = result_hash
                  </code>
                  <p>The first 8 characters of this hash are converted to a number between 0 and 1, which determines the game outcome. This process is deterministic - the same inputs always produce the same output.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="verify" className="border-white/10">
                <AccordionTrigger className="text-white hover:text-orange-400">
                  How do I verify a game?
                </AccordionTrigger>
                <AccordionContent className="text-zinc-400">
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Get your Server Seed (revealed after game), Client Seed, and Nonce from the bot</li>
                    <li>Enter them in the verification tool above</li>
                    <li>Check that the Server Seed Hash matches what was shown before the game</li>
                    <li>Verify that the calculated result matches your game outcome</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

// Games Section
const GamesList = () => {
  const games = [
    { key: "coinflip", name: "Coinflip", desc: "50/50 heads or tails" },
    { key: "crash", name: "Crash", desc: "Cash out before crash" },
    { key: "mines", name: "Mines", desc: "Avoid the mines" },
    { key: "tower", name: "Tower", desc: "Climb the tower" },
    { key: "blackjack", name: "Blackjack", desc: "Beat the dealer" },
    { key: "dices_war", name: "Dices War", desc: "Roll higher than house" },
    { key: "match", name: "Match", desc: "Match to win" }
  ];

  return (
    <section className="py-24 px-4 bg-[#0a0a0b]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4" data-testid="games-section-title">
            Supported <span className="gradient-text">Games</span>
          </h2>
          <p className="text-zinc-400">All games use the same provably fair algorithm</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {games.map((game) => (
            <Card 
              key={game.key} 
              className="glass border-white/10 card-hover text-center"
              data-testid={`game-card-${game.key}`}
            >
              <CardContent className="pt-6">
                <div className={`game-badge ${game.key} mx-auto mb-3 justify-center`}>
                  {GAME_ICONS[game.key]}
                </div>
                <h3 className="font-bold text-white mb-1">{game.name}</h3>
                <p className="text-xs text-zinc-500">{game.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

// Footer
const Footer = () => {
  return (
    <footer className="py-16 px-4 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-4">
            <img 
              src="/logo.jpeg" 
              alt="RazerBet" 
              className="w-12 h-12"
            />
            <div>
              <h3 className="font-bold text-white">RazerBet</h3>
              <p className="text-sm text-zinc-500">Provably Fair Gaming</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <a 
              href="https://discord.gg/razerbet" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
              data-testid="footer-discord-link"
            >
              <DiscordIcon />
              <span>discord.gg/razerbet</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
        
        <div className="section-divider my-8" />
        
        <div className="text-center text-sm text-zinc-600">
          <p>© 2024 RazerBet. All games are provably fair and verifiable.</p>
        </div>
      </div>
    </footer>
  );
};

// Main Home Component
const Home = () => {
  return (
    <div className="min-h-screen bg-[#050505]">
      <Hero />
      <VerificationTool />
      <LiveFeed />
      <HowItWorks />
      <GamesList />
      <Footer />
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <Toaster 
        position="top-right" 
        theme="dark"
        toastOptions={{
          style: {
            background: '#18181B',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff'
          }
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
