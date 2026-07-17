import { AnimatePresence, motion } from "framer-motion";
import { Check, Clipboard, Code2, GitBranch, Shield, X } from "lucide-react";
import { useState } from "react";

const CODEX_COMMAND = "npm run simulate:codex -- --turns 4 --model gpt-5.6-sol --reasoning-effort medium";

export function ProtocolPanel({ open, onClose, runtimeMs }) {
  const [copied, setCopied] = useState(false);

  async function copyCommand() {
    await navigator.clipboard.writeText(CODEX_COMMAND);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="protocol-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
          <motion.section
            className="protocol-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="protocol-title"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="icon-button protocol-panel__close" type="button" onClick={onClose} aria-label="Close protocol panel"><X /></button>
            <span className="eyebrow">PROTOCOL 1.0 · DEVELOPER TOOLS</span>
            <h2 id="protocol-title">One world. Six policies. No privileged state.</h2>
            <p className="protocol-panel__lead">100 Winters measures whether an agent can preserve continuity while complexity, extraction, disease, and climate pressure compound over time.</p>

            <div className="protocol-facts">
              <div><GitBranch /><strong>400 decisions</strong><span>Four seasons per year, one hundred completed winters.</span></div>
              <div><Shield /><strong>Shared shocks</strong><span>Every agent receives the same recorded scenario schedule.</span></div>
              <div><Code2 /><strong>Strict interface</strong><span>Public observations in; schema-valid actions out. Hidden state is rejected.</span></div>
            </div>

            <div className="protocol-method">
              <h3>Scoring</h3>
              <p>Continuity, adaptation, efficiency, complexity, robustness, sustainability, and safety are scored together. Collapse applies a terminal penalty; short-term extraction cannot win by hiding future damage.</p>
              <div className="weight-strip" aria-label="Score weights">
                <i style={{ width: "16%" }} title="Continuity 16%" />
                <i style={{ width: "15%" }} title="Adaptation 15%" />
                <i style={{ width: "12%" }} title="Efficiency 12%" />
                <i style={{ width: "13%" }} title="Complexity 13%" />
                <i style={{ width: "15%" }} title="Robustness 15%" />
                <i style={{ width: "17%" }} title="Sustainability 17%" />
                <i style={{ width: "12%" }} title="Safety 12%" />
              </div>
            </div>

            <div className="codex-command">
              <div><span className="eyebrow">RUN A REAL CODEX AGENT</span><strong>GPT-5.6 Sol · medium reasoning</strong></div>
              <code>{CODEX_COMMAND}</code>
              <button type="button" onClick={copyCommand}>{copied ? <Check size={16} /> : <Clipboard size={16} />}{copied ? "Copied" : "Copy command"}</button>
            </div>

            <div className="protocol-proof">
              <span>Browser protocol runtime</span><strong>{runtimeMs} ms</strong>
              <span>Rebuild required</span><strong>No</strong>
              <span>API key required</span><strong>No</strong>
              <span>Replay leaks hidden state</span><strong>No</strong>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
