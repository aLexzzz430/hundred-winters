import { AnimatePresence, motion } from "framer-motion";
import { Download, FileSearch, Gauge, Info, Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { WORLD_PROFILES } from "../world/world-profiles.js";
import { AgentLedger } from "./components/AgentLedger.jsx";
import { AuditTrail } from "./components/AuditTrail.jsx";
import { MetricRail } from "./components/MetricRail.jsx";
import { ProtocolPanel } from "./components/ProtocolPanel.jsx";
import { ScoreField } from "./components/ScoreField.jsx";
import { WorldCanvas } from "./components/WorldCanvas.jsx";
import {
  PROTOCOL_TURNS,
  downloadProtocolReport,
  getCurrentDecision,
  getFrameAt,
  getObservationAt,
  getVisibleEventsAt,
  runProtocol
} from "./experiment.js";
import { formatScore, winterForTurn } from "./format.js";

const VIEWS = [
  { id: "arena", label: "Arena", icon: Gauge },
  { id: "compare", label: "Compare", icon: FileSearch },
  { id: "audit", label: "Audit", icon: Info }
];

export function App() {
  const [profileId, setProfileId] = useState("river_basin");
  const experiment = useMemo(() => runProtocol(profileId), [profileId]);
  const [selectedId, setSelectedId] = useState(experiment.agent_results[0].agent_id);
  const [turn, setTurn] = useState(PROTOCOL_TURNS);
  const [playing, setPlaying] = useState(false);
  const [view, setView] = useState("arena");
  const [protocolOpen, setProtocolOpen] = useState(false);

  const selectedResult = experiment.agent_results.find((result) => result.agent_id === selectedId) ?? experiment.agent_results[0];
  const snapshot = getFrameAt(selectedResult, turn);
  const observation = getObservationAt(selectedResult, turn);
  const events = getVisibleEventsAt(selectedResult, turn);
  const decision = getCurrentDecision(selectedResult, turn);

  useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => {
      setTurn((current) => {
        const next = current + 4;
        if (next >= PROTOCOL_TURNS) {
          window.clearInterval(timer);
          setPlaying(false);
          return PROTOCOL_TURNS;
        }
        return next;
      });
    }, 72);
    return () => window.clearInterval(timer);
  }, [playing]);

  function changeProfile(nextProfile) {
    const nextExperiment = runProtocol(nextProfile);
    setProfileId(nextProfile);
    setSelectedId(nextExperiment.agent_results[0].agent_id);
    setTurn(PROTOCOL_TURNS);
    setPlaying(false);
  }

  function toggleReplay() {
    if (turn >= PROTOCOL_TURNS) setTurn(4);
    setPlaying((value) => !value);
  }

  function restartReplay() {
    setTurn(4);
    setPlaying(true);
  }

  const winner = experiment.agent_results[0];
  const collapsed = experiment.agent_results.filter((result) => result.outcome.status === "collapsed");
  const extraction = experiment.agent_results.find((result) => result.agent_id === "greedy_resource_agent");

  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="brand" href="#top" aria-label="100 Winters home">
          <span className="brand__mark">100</span>
          <span><strong>WINTERS</strong><small>LONG-HORIZON AGENT BENCHMARK</small></span>
        </a>
        <nav className="view-nav" aria-label="Benchmark views">
          {VIEWS.map(({ id, label, icon: Icon }) => (
            <button type="button" key={id} onClick={() => setView(id)} aria-pressed={view === id} className={view === id ? "is-active" : ""}>
              <Icon size={15} />{label}
            </button>
          ))}
        </nav>
        <button className="method-button" type="button" onClick={() => setProtocolOpen(true)}><Info size={15} />Protocol 1.0</button>
      </header>

      <main id="top">
        <div className="run-bar">
          <label className="profile-select">
            <span>WORLD PROFILE</span>
            <select value={profileId} onChange={(event) => changeProfile(event.target.value)}>
              {WORLD_PROFILES.map((profile) => <option key={profile.id} value={profile.id}>{profile.name} — {profile.descriptor}</option>)}
            </select>
          </label>
          <div className="run-meta">
            <span><i className="status-dot" /> deterministic run</span>
            <span>{experiment.benchmark_runtime_ms} ms</span>
            <span>6 policies</span>
            <span>400 decisions each</span>
          </div>
          <div className="run-actions">
            <button type="button" className="quiet-button" onClick={() => downloadProtocolReport(experiment)}><Download size={15} />Report</button>
            <button type="button" className="icon-button" onClick={restartReplay} aria-label="Restart replay"><RotateCcw size={17} /></button>
            <button type="button" className="primary-button" onClick={toggleReplay}>
              {playing ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
              {playing ? "Pause" : turn >= PROTOCOL_TURNS ? "Replay 100 winters" : "Continue replay"}
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {view === "arena" && (
            <motion.div key="arena" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}>
              <div className="arena-grid">
                <WorldCanvas snapshot={snapshot} turn={turn} selectedAgent={selectedResult} />
                <MetricRail snapshot={snapshot} result={selectedResult} decision={decision} currentEvent={events[0]} />
              </div>
              <ScoreField results={experiment.agent_results} selectedId={selectedId} turn={turn} onTurnChange={(next) => { setTurn(next); setPlaying(false); }} maxTurns={PROTOCOL_TURNS} />
              <AgentLedger results={experiment.agent_results} selectedId={selectedId} onSelect={setSelectedId} />
            </motion.div>
          )}

          {view === "compare" && (
            <motion.div className="compare-view" key="compare" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}>
              <div className="compare-intro">
                <span className="eyebrow">THE NEXT TURN IS NOT THE TEST</span>
                <h1>Policy differences become visible after the easy decisions are over.</h1>
                <p>All six agents begin with the same people, resources, observation contract, and shock schedule. Their long-run score is the accumulated consequence of what they prioritize.</p>
              </div>
              <div className="outcome-strip">
                <div><span>WINNING POLICY</span><strong>{winner.label}</strong><small>{formatScore(winner.final_score.total)} points · {winner.survived_winters} winters</small></div>
                <div><span>TERMINAL FAILURES</span><strong>{collapsed.length}</strong><small>{collapsed.length ? collapsed.map((result) => `${result.label} at W${result.survived_winters}`).join(" · ") : "All policies remained continuous"}</small></div>
                <div><span>EXTRACTION DEBT</span><strong>{Math.round((1 - extraction.final_score.sustainability) * 100)}%</strong><small>ecological sustainability lost</small></div>
              </div>
              <ScoreField results={experiment.agent_results} selectedId={selectedId} turn={turn} onTurnChange={(next) => { setTurn(next); setPlaying(false); }} maxTurns={PROTOCOL_TURNS} />
              <AgentLedger results={experiment.agent_results} selectedId={selectedId} onSelect={setSelectedId} />
            </motion.div>
          )}

          {view === "audit" && (
            <motion.div className="audit-view" key="audit" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}>
              <div className="audit-toolbar">
                <div><span className="eyebrow">SELECTED REPLAY</span><strong>{selectedResult.label} · Winter {winterForTurn(turn)}</strong></div>
                <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} aria-label="Select agent replay">
                  {experiment.agent_results.map((result) => <option value={result.agent_id} key={result.agent_id}>{result.label}</option>)}
                </select>
              </div>
              <AuditTrail observation={observation} events={events} turn={turn} selectedAgent={selectedResult} />
              <ScoreField results={experiment.agent_results} selectedId={selectedId} turn={turn} onTurnChange={(next) => { setTurn(next); setPlaying(false); }} maxTurns={PROTOCOL_TURNS} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="app-footer">
        <span>100 WINTERS · HUNDRED-WINTERS-V1</span>
        <span>Public replay only · SHA-256 observation archive · MIT</span>
        <button type="button" onClick={() => setProtocolOpen(true)}>Run with GPT-5.6 Sol ↗</button>
      </footer>

      <ProtocolPanel open={protocolOpen} onClose={() => setProtocolOpen(false)} runtimeMs={experiment.benchmark_runtime_ms} />
    </div>
  );
}
