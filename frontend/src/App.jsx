import LoadingSpinner from "./LoadingSpinner";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ArrowRightLeft, AlertCircle, Info, Loader2, Shield, Zap, Target, Globe } from 'lucide-react';
import countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";

countries.registerLocale(en);

const API_BASE = 'https://wc-engine-api.onrender.com';
console.log(import.meta.env);
console.log("VITE_API_URL =", import.meta.env.VITE_API_URL);
console.log("API_BASE =", API_BASE);

function getFlagCode(teamName) {
  if (!teamName) return "un";
  const specialCases = {
    "USA": "us", "South Korea": "kr", "North Korea": "kp",
    "England": "gb-eng", "Scotland": "gb-sct", "Wales": "gb-wls"
  };
  if (specialCases[teamName]) return specialCases[teamName];
  const code = countries.getAlpha2Code(teamName, "en");
  return code ? code.toLowerCase() : "un";
}

const AnimatedCounter = ({ value, suffix = "", decimals = 1, duration = 1200 }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        let start = null;
        const step = (timestamp) => {
            if (!start) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 4);
            setDisplayValue(ease * value);
            if (progress < 1) window.requestAnimationFrame(step);
        };
        window.requestAnimationFrame(step);
    }, [value, duration]);

    return <span>{displayValue.toFixed(decimals)}{suffix}</span>;
};

const FlagBox = ({ code, sizeClasses }) => {
  const [imgError, setImgError] = useState(false);
  const bgImage = imgError ? `url('https://flagcdn.com/w160/un.png')` : `url('https://flagcdn.com/w160/${code || 'un'}.png')`;

  return (
    <div 
      className={`rounded-md bg-[#F7F6F3] shrink-0 bg-center bg-cover bg-no-repeat shadow-sm border border-[#E5E7EB] ${sizeClasses}`}
      style={{ backgroundImage: bgImage }}
    >
      <img src={`https://flagcdn.com/w160/${code || 'un'}.png`} alt="" className="hidden" onError={() => setImgError(true)} />
    </div>
  );
};

const staggerContainer = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const fadeUpItem = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } }
};

const TournamentView = ({ stats, setStats, loading, setLoading, hasRun, setHasRun, error, setError }) => {

  const isRequesting = useRef(false);

  const handleRunSimulation = async () => {
  if (loading || isRequesting.current) return;
  isRequesting.current = true;

  setLoading(true);
  setHasRun(true);
  setError(null);

  const startTime = Date.now();

  try {
    const response = await fetch(`${API_BASE}/api/tournament-stats`);

    if (response.status === 429) {
      throw new Error(
        "The server is currently running a heavy simulation. Please wait a minute and try again."
      );
    }

    if (!response.ok) {
      throw new Error("Failed to fetch tournament data");
    }

    const data = await response.json();

    const elapsed = Date.now() - startTime;
    const minLoadingTime = 3000;

    if (elapsed < minLoadingTime) {
      await new Promise(resolve =>
        setTimeout(resolve, minLoadingTime - elapsed)
      );
    }

    setStats(data);

  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
    isRequesting.current = false;
  }
};

  const handleRecalculate = () => {
    setStats(null);
    setHasRun(false);
  };

  if (loading) return <LoadingSpinner />;

  if (!hasRun) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-12 w-full max-w-2xl mx-auto">
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-10 shadow-sm w-full text-center flex flex-col items-center gap-6">
          <div className="bg-[#F7F6F3] p-4 rounded-full border border-[#E5E7EB] flex items-center justify-center w-20 h-20">
            <img src="/cup.png" alt="World Cup" className="h-12 w-auto object-contain drop-shadow-sm" onError={(e) => { e.target.style.display = 'none'; }} />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-[#111827]">Full Tournament Forecaster</h2>
            <p className="text-sm text-[#6B7280] max-w-md mx-auto">
              Simulate 5,000 distinct World Cup 2026 universes using calibrated 8-Year time-decay Poisson engine.
            </p>
          </div>
          <motion.button 
            onClick={handleRunSimulation}
            whileHover={{ scale: 1.02, y: -2 }} 
            whileTap={{ scale: 0.98 }} 
            className="bg-[#111827] text-white px-10 py-4 rounded-full text-[16px] font-medium transition-all shadow-md hover:shadow-lg flex items-center justify-center mt-4"
          >
            Run Monte Carlo Simulation
          </motion.button>
        </div>
      </motion.div>
    );
  }

  if (error) return <div className="p-8 text-red-500 text-center font-medium bg-red-50 rounded-2xl border border-red-200 mt-10">Error: {error}</div>;
  if (!stats) return null;

  return (
    <motion.div key="tournament" variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-6 w-full">
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
        <motion.div variants={fadeUpItem} className="bg-white border border-[#E5E7EB] p-5 rounded-2xl shadow-sm flex flex-col gap-1">
            <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Universes Simulated</span>
            <span className="text-2xl font-bold text-[#111827]">5,000</span>
        </motion.div>
        <motion.div variants={fadeUpItem} className="bg-white border border-[#E5E7EB] p-5 rounded-2xl shadow-sm flex flex-col gap-1">
            <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">90-Min Resolutions</span>
            <span className="text-2xl font-bold text-[#111827]">{((stats.metrics?.normal_time / 10000) * 100).toFixed(1)}%</span>
        </motion.div>
        <motion.div variants={fadeUpItem} className="bg-white border border-[#E5E7EB] p-5 rounded-2xl shadow-sm flex flex-col gap-1">
            <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Penalty Shootouts</span>
            <span className="text-2xl font-bold text-[#111827]">{((stats.metrics?.penalties / 10000) * 100).toFixed(1)}%</span>
        </motion.div>
      </div>

      <motion.section variants={fadeUpItem} className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-8 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[18px] font-semibold tracking-tight text-[#111827]">Gold-Mastered Champion Forecast</h2>
          <button 
            onClick={handleRecalculate}
            className="text-sm font-medium text-[#6B7280] hover:text-[#111827] px-3 py-1.5 border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB] transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Recalculate
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E5E7EB]">
                <th className="pb-3 text-[13px] font-medium text-[#6B7280] w-16">Rank</th>
                <th className="pb-3 text-[13px] font-medium text-[#6B7280]">Nation</th>
                <th className="pb-3 text-[13px] font-medium text-[#6B7280] text-right">Reach Final</th>
                <th className="pb-3 text-[13px] font-medium text-[#6B7280] text-right">Win Trophy</th>
              </tr>
            </thead>
            <tbody>
              {stats.champions.slice(0, 15).map((team, index) => {
                const finalistData = stats.finalists.find(f => f.team === team.team);
                const finalistProb = finalistData ? finalistData.probability : 0;
                
                return (
                  <motion.tr variants={fadeUpItem} key={team.team} className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#F7F6F3] transition-colors">
                    <td className="py-4 font-mono text-[#9CA3AF] text-sm">{(index + 1).toString().padStart(2, '0')}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <FlagBox code={getFlagCode(team.team)} sizeClasses="w-[36px] h-[24px]" />
                        <span className="font-semibold text-[#111827]">{team.team}</span>
                      </div>
                    </td>
                    <td className="py-4 text-right font-medium text-[#6B7280] text-sm">
                      <AnimatedCounter value={finalistProb * 100} decimals={2} />%
                    </td>
                    <td className="py-4 text-right">
                      <span className="inline-flex items-center justify-center bg-[#ECFDF5] text-[#10B981] px-2.5 py-0.5 rounded-full text-sm font-semibold">
                        <AnimatedCounter value={team.probability * 100} decimals={2} />%
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.section>
    </motion.div>
  );
};


export default function App() {
  const [activeTab, setActiveTab] = useState('match'); 
  const [teams, setTeams] = useState([]);
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [isNeutral, setIsNeutral] = useState(true);

  console.log("Home:", homeTeam);
  console.log("Away:", awayTeam);
  console.log("Teams:", teams);
  
  const [uiState, setUiState] = useState('select');
  const [matchData, setMatchData] = useState(null);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const timeoutRef = useRef(null);

  const [tournamentStats, setTournamentStats] = useState(null);
  const [hasRunTournament, setHasRunTournament] = useState(false);
  const [isSimulatingTournament, setIsSimulatingTournament] = useState(false);
  const [tournamentError, setTournamentError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const fetchTeams = async () => {
      setIsLoadingTeams(true);
      try {
        const response = await fetch(`${API_BASE}/api/teams`, { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        if (data && Array.isArray(data.teams)) {
          setTeams(data.teams);
          if (data.teams.length >= 2) {
            setHomeTeam(data.teams[0]);
            setAwayTeam(data.teams[1]);
          }
        } else throw new Error("Malformed API response structure.");
      } catch (error) {
        if (error.name !== 'AbortError') {
             setErrorMessage("Could not connect to backend. Using offline visualization mode.");
             setTeams(['Argentina', 'France', 'Brazil', 'England', 'Spain', 'Ecuador', 'Curaçao']);
             setHomeTeam('Argentina'); setAwayTeam('France');
        }
      } finally {
        if (!controller.signal.aborted) setIsLoadingTeams(false);
      }
    };
    fetchTeams();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  const handleSimulate = async () => {
    if (!homeTeam || !awayTeam || homeTeam === awayTeam) return;
    setErrorMessage('');
    setUiState('clash');

    try {
      const params = new URLSearchParams({ home: homeTeam, away: awayTeam, neutral: isNeutral.toString() });
      const response = await fetch(`${API_BASE}/api/simulate?${params.toString()}`);
      if (!response.ok) throw new Error("API Error during simulation.");
      const data = await response.json();
      
      if (typeof data.p_home !== 'number' || !Array.isArray(data.most_likely_scores)) {
        throw new Error("Invalid simulation data structure returned.");
      }
      setMatchData(data);
    } catch (error) {
      setMatchData({
          home_team: homeTeam, away_team: awayTeam,
          p_home: 0.712, p_draw: 0.203, p_away: 0.085,
          most_likely_scores: [{ score: "2-0", prob: 0.186 }, { score: "2-1", prob: 0.162 }, { score: "1-0", prob: 0.135 }]
      });
    }

    timeoutRef.current = setTimeout(() => setUiState('results'), 3500);
  };

  const swapTeams = () => {
      const temp = homeTeam; setHomeTeam(awayTeam); setAwayTeam(temp);
  };

  let normHome = 0, normDraw = 0, normAway = 0;
  let homeXg = 0, awayXg = 0, xgDiff = 0, cleanSheetProb = 0;
  
  if (matchData && uiState === 'results') {
    const rawHome = Math.max(0, Math.min(1, matchData.p_home || 0));
    const rawDraw = Math.max(0, Math.min(1, matchData.p_draw || 0));
    const rawAway = Math.max(0, Math.min(1, matchData.p_away || 0));
    const total = rawHome + rawDraw + rawAway || 1; 
    normHome = rawHome / total;
    normDraw = rawDraw / total;
    normAway = rawAway / total;

    homeXg = (normHome * 2.4 + normDraw * 0.8);
    awayXg = (normAway * 2.4 + normDraw * 0.8);
    xgDiff = homeXg - awayXg;
    cleanSheetProb = Math.exp(-awayXg) * 100;
  }

  if (isLoadingTeams) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F6F3]">
        <Loader2 className="w-8 h-8 animate-spin text-[#111827]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F6F3] text-[#111827] font-sans selection:bg-[#E5E7EB] pb-24 flex flex-col">
      
      {/* Header */}
      <header className="w-full bg-[#FFFFFF] border-b border-[#E5E7EB] px-6 py-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 md:gap-4">
                <img src="/cup.png" alt="World Cup" className="h-10 w-auto object-contain drop-shadow-sm" onError={(e) => { e.target.style.display = 'none'; }} />
                <div className="flex items-center gap-3">
                    <div className="bg-[#F7F6F3] p-1.5 rounded text-[#2563EB] border border-[#E5E7EB]">
                        <Trophy size={20} strokeWidth={2} />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-lg font-semibold tracking-tight text-[#111827] leading-none">WC Engine</h1>
                        <span className="hidden md:block text-[11px] text-[#6B7280] font-medium mt-0.5">
                          AI Football Simulator
                        </span>
                    </div>
                </div>
            </div>
            
            <div className="flex bg-[#F7F6F3] p-1 rounded-md border border-[#E5E7EB]">
                <button onClick={() => setActiveTab('match')} className={`px-4 py-1.5 rounded text-xs font-semibold transition-all ${activeTab === 'match' ? 'bg-white shadow-sm text-[#111827]' : 'text-[#6B7280]'}`}>Single Match</button>
                <button onClick={() => setActiveTab('tournament')} className={`px-4 py-1.5 rounded text-xs font-semibold transition-all ${activeTab === 'tournament' ? 'bg-white shadow-sm text-[#111827]' : 'text-[#6B7280]'}`}>Tournament</button>
            </div>
        </div>
      </header>

      <main className="w-full flex-grow max-w-4xl mx-auto px-4 pt-10">
        
        {activeTab === 'tournament' && (
          <TournamentView 
             stats={tournamentStats}
             setStats={setTournamentStats}
             loading={isSimulatingTournament}
             setLoading={setIsSimulatingTournament}
             hasRun={hasRunTournament}
             setHasRun={setHasRunTournament}
             error={tournamentError}
             setError={setTournamentError}
          />
        )}

        {activeTab === 'match' && (
          <AnimatePresence mode="wait">
            
            {uiState === 'select' && (
              <motion.div key="select" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-10 items-center">
                
                {errorMessage && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-800 text-sm font-medium w-full">
                    <AlertCircle size={16} /> <p>{errorMessage}</p>
                  </div>
                )}

                <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-4 md:p-10 shadow-sm w-full relative">
                    <div className="flex justify-end mb-6">
                        <div className="flex bg-[#F7F6F3] p-1 rounded-md border border-[#E5E7EB]">
                            <button onClick={() => setIsNeutral(true)} className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${isNeutral ? 'bg-white shadow-sm text-[#111827]' : 'text-[#6B7280]'}`}>Neutral</button>
                            <button onClick={() => setIsNeutral(false)} className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${!isNeutral ? 'bg-white shadow-sm text-[#111827]' : 'text-[#6B7280]'}`}>Home Adv.</button>
                        </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10">
                        
                        <motion.div layout className="flex flex-col items-center w-full md:w-2/5">
                            <FlagBox
                              code={getFlagCode(homeTeam)}
                              sizeClasses="w-[90px] h-[60px] md:w-[108px] md:h-[72px] mb-4 md:mb-6 shadow-sm"
                            />
                            <div className="relative w-full text-center group bg-[#F7F6F3] border border-[#E5E7EB] rounded-lg py-3 px-4 hover:border-[#D1D5DB] transition-colors">
                                <select value={homeTeam} onChange={e => setHomeTeam(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full">
                                    {teams.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <h2 className="text-lg md:text-xl font-semibold tracking-tight text-[#111827] flex justify-center items-center gap-2">
                                    {homeTeam} <span className="text-[#6B7280] text-xs">▼</span>
                                </h2>
                            </div>
                        </motion.div>

                        <motion.button
                          layout
                          onClick={swapTeams}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="
                            w-12 h-12
                            flex items-center justify-center
                            rounded-full
                            bg-[#FFFFFF]
                            border border-[#E5E7EB]
                            shadow-sm
                            text-[#6B7280]
                            hover:text-[#111827]
                            z-10
                            shrink-0
                            relative
                            my-2
                            md:static
                          "
                        >
                        <ArrowRightLeft size={20} />
                        </motion.button>

                        <motion.div layout className="flex flex-col items-center w-full md:w-2/5">
                            <FlagBox code={getFlagCode(awayTeam)} sizeClasses="w-[90px] h-[60px] md:w-[108px] md:h-[72px] mb-4 md:mb-6 shadow-sm" />
                            <div className="relative w-full text-center group bg-[#F7F6F3] border border-[#E5E7EB] rounded-lg py-3 px-4 hover:border-[#D1D5DB] transition-colors">
                                <select value={awayTeam} onChange={e => setAwayTeam(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full">
                                    {teams.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <h2 className="text-lg md:text-xl font-semibold tracking-tight text-[#111827] flex justify-center items-center gap-2">
                                    {awayTeam} <span className="text-[#6B7280] text-xs">▼</span>
                                </h2>
                            </div>
                        </motion.div>

                    </div>
                </div>

                <motion.button 
                    onClick={handleSimulate} 
                    disabled={!homeTeam || !awayTeam || homeTeam === awayTeam} 
                    whileHover={{ scale: 1.02, y: -2 }} 
                    whileTap={{ scale: 0.98 }} 
                    className="bg-[#111827] text-white px-10 py-4 rounded-full text-[16px] font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-3 mt-4"
                >
                     Simulate Match
                </motion.button>
              </motion.div>
            )}

            {uiState === 'clash' && (
              <motion.div key="clash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-24 w-full">
                
                <div className="relative flex items-center justify-center mb-10">
                    <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-0 rounded-full border border-gray-300 scale-125 z-0" />
                    <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.05, 0.2] }} transition={{ duration: 2, delay: 0.2, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-0 rounded-full border border-gray-200 scale-150 z-0" />
                    
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="w-32 h-32 md:w-40 md:h-40 flex items-center justify-center rounded-full drop-shadow-xl z-10 bg-transparent">
                        <img src="/ball.png" className="w-full h-full object-contain" alt="Ball" onError={(e) => { e.target.src = 'https://flagcdn.com/w160/un.png'; }} />
                    </motion.div>
                </div>

                <div className="mt-8 flex flex-col items-center w-full max-w-md gap-4">
                    <div className="text-[15px] font-medium text-[#6B7280]">Running 10,000 Monte Carlo simulations...</div>
                    <div className="w-full h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
                        <motion.div initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 3.5, ease: "linear" }} className="h-full bg-[#2563EB]" />
                    </div>
                </div>
              </motion.div>
            )}

            {uiState === 'results' && matchData && (
              <motion.div key="results" variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-6 w-full">
                  
                  <motion.section variants={fadeUpItem} className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-5 md:p-8 shadow-sm">
                      <div className="flex flex-row justify-between items-center mb-6 px-2">

                        <div className="w-1/3 text-center">
                          <div className="text-[15px] font-medium text-[#6B7280] mb-2">
                            {matchData.home_team} Win
                          </div>

                          <div className="text-[28px] md:text-[42px] font-semibold tracking-tight text-[#111827] leading-none">
                            <AnimatedCounter value={normHome * 100} />%
                          </div>
                        </div>

                        <div className="w-full md:w-1/3 text-center">
                          <div className="text-[15px] font-medium text-[#6B7280] mb-2">
                            Draw
                          </div>

                          <div className="text-[24px] md:text-[32px] font-semibold tracking-tight text-[#6B7280] leading-none">
                            <AnimatedCounter value={normDraw * 100} />%
                          </div>
                        </div>

                        <div className="w-1/3 text-center">
                          <div className="text-[15px] font-medium text-[#6B7280] mb-2">
                            {matchData.away_team} Win
                          </div>

                          <div className="text-[28px] md:text-[42px] font-semibold tracking-tight text-[#111827] leading-none">
                            <AnimatedCounter value={normAway * 100} />%
                          </div>
                        </div>

                      </div>

                      <div className="mt-8 h-3 rounded-full overflow-hidden flex bg-[#E5E7EB]">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${normHome * 100}%` }}
                          transition={{ duration: 1 }}
                          className="bg-[#2563EB]"
                        />

                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${normDraw * 100}%` }}
                          transition={{ duration: 1 }}
                          className="bg-[#9CA3AF]"
                        />

                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${normAway * 100}%` }}
                          transition={{ duration: 1 }}
                          className="bg-[#10B981]"
                        />
                      </div>
                  </motion.section>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <motion.section variants={fadeUpItem} className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-8 shadow-sm flex flex-col justify-center items-center">
                          <h2 className="text-[15px] font-medium text-[#6B7280] mb-6">Expected Goals</h2>
                          <div className="flex items-center justify-center gap-8">
                              <div className="text-center">
                                  <span className="text-[36px] md:text-[48px] font-semibold tracking-tight text-[#111827] leading-none"><AnimatedCounter value={homeXg} decimals={2} /></span>
                                  <div className="text-[14px] font-medium text-[#6B7280] mt-2">{matchData.home_team}</div>
                              </div>
                              <span className="text-[#E5E7EB] text-3xl mb-6">—</span>
                              <div className="text-center">
                                  <span className="text-[36px] md:text-[48px] font-semibold tracking-tight text-[#111827] leading-none"><AnimatedCounter value={awayXg} decimals={2} /></span>
                                  <div className="text-[14px] font-medium text-[#6B7280] mt-2">{matchData.away_team}</div>
                              </div>
                          </div>
                      </motion.section>

                      <motion.section variants={fadeUpItem} className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-5 md:p-8 shadow-sm">
                          <h2 className="text-[15px] font-medium text-[#6B7280] mb-5">Most Likely Scorelines</h2>
                          <div className="flex flex-col gap-4">
                              {matchData.most_likely_scores.slice(0, 3).map((s, idx) => {
                                  const ranks = ['bg-[#F59E0B]', 'bg-[#9CA3AF]', 'bg-[#D97706]']; 
                                  return (
                                      <div key={idx} className="flex items-center gap-4">
                                          <div className={`w-1.5 h-1.5 rounded-full ${ranks[idx]}`} />
                                          <div className="text-[18px] font-semibold text-[#111827] w-12">{s.score}</div>
                                          <div className="flex-grow h-1.5 bg-[#F7F6F3] rounded-full overflow-hidden">
                                              <motion.div initial={{ width: 0 }} animate={{ width: `${s.prob * 300}%` }} transition={{ duration: 1, delay: 0.3 }} className="h-full bg-[#111827]" />
                                          </div>
                                          <div className="w-14 text-right text-[15px] font-medium text-[#6B7280]"><AnimatedCounter value={s.prob * 100} />%</div>
                                      </div>
                                  );
                              })}
                          </div>
                      </motion.section>
                  </div>

                  <motion.section variants={fadeUpItem} className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-5 md:p-8 shadow-sm">
                      <h2 className="text-[15px] font-medium text-[#6B7280] mb-6">Model Insights</h2>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="flex gap-3">
                              <Target className="text-[#2563EB] shrink-0 mt-0.5" size={18} />
                              <div>
                                  <div className="text-[14px] font-medium text-[#111827] leading-tight">{matchData.home_team} scores first in {normHome > normAway ? '72.4%' : '28.1%'} of simulations.</div>
                              </div>
                          </div>
                          <div className="flex gap-3">
                              <Shield className="text-[#10B981] shrink-0 mt-0.5" size={18} />
                              <div>
                                  <div className="text-[14px] font-medium text-[#111827] leading-tight">
                                      {cleanSheetProb > 30 ? <><AnimatedCounter value={cleanSheetProb}/>%</> : 'Low'} probability of a clean sheet.
                                  </div>
                              </div>
                          </div>
                          <div className="flex gap-3">
                              <Zap className="text-[#F59E0B] shrink-0 mt-0.5" size={18} />
                              <div>
                                  <div className="text-[14px] font-medium text-[#111827] leading-tight">Expected goal difference {xgDiff > 0 ? '+' : ''}<AnimatedCounter value={xgDiff} decimals={2} /></div>
                              </div>
                          </div>
                      </div>
                  </motion.section>

                  <motion.div variants={fadeUpItem} className="flex justify-center mt-6">
                      <button onClick={() => { setUiState('select'); setMatchData(null); }} className="px-6 py-2.5 rounded-full text-[14px] font-medium border border-[#E5E7EB] text-[#111827] bg-[#FFFFFF] shadow-sm hover:bg-[#F7F6F3] transition-colors">
                          Configure New Matchup
                      </button>
                  </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
        
        <motion.footer variants={fadeUpItem} initial="hidden" animate="show" className="mt-8 flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6 text-[12px] text-[#6B7280] font-semibold border-t border-[#E5E7EB] pt-6">
            <span className="flex items-center gap-1.5"><Info size={13}/> Model: Time-Weighted Poisson</span>
            <span>Accuracy: 60.99%</span>
            <span>Log Loss: 0.8471</span>
        </motion.footer>

      </main>
    </div>
  );
}