import { Braces, Eye, EyeOff, Fingerprint, LockKeyhole } from "lucide-react";

import { formatEventType } from "../format.js";

export function AuditTrail({ observation, events, turn, selectedAgent }) {
  const publicObservation = observation?.observation;
  const visiblePayload = publicObservation ? {
    turn: publicObservation.turn,
    public_time: publicObservation.public_time,
    civilization: publicObservation.civilization,
    signals: publicObservation.signals,
    budgets: publicObservation.budgets
  } : null;

  return (
    <section className="audit-trail" aria-labelledby="audit-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">FAIL-CLOSED OBSERVATION BOUNDARY</span>
          <h2 id="audit-title">What the agent actually knew</h2>
        </div>
        <p>Every decision is tied to an archived public observation. Hidden pressure and future shocks never enter the prompt.</p>
      </div>

      <div className="audit-layout">
        <div className="audit-payload">
          <div className="code-heading">
            <span><Braces size={15} /> observation.turn.{publicObservation?.turn ?? turn}</span>
            <span>public</span>
          </div>
          <pre>{JSON.stringify(visiblePayload, null, 2)}</pre>
        </div>

        <div className="audit-inspector">
          <div className="hash-line">
            <Fingerprint size={17} />
            <div>
              <span className="eyebrow">OBSERVATION SHA-256</span>
              <code>{observation?.payload_hash ?? "No observation at this turn"}</code>
            </div>
          </div>

          <div className="boundary-diagram" aria-label="Benchmark trust boundary">
            <div><Eye size={18} /><span>Public state</span><small>map · risks · budget · history</small></div>
            <i><span>strict schema</span></i>
            <div><LockKeyhole size={18} /><span>{selectedAgent.label}</span><small>action envelope · ≤12 effort</small></div>
            <i><span>validated</span></i>
            <div className="boundary-diagram__hidden"><EyeOff size={18} /><span>Hidden judge</span><small>future shocks · anti-cheat · truth</small></div>
          </div>

          <div className="event-stream">
            <div className="code-heading"><span>Visible event stream</span><span>{events.length} recent</span></div>
            {events.length ? events.map((event) => (
              <div className="event-stream__row" key={event.id}>
                <span>{String(event.turn).padStart(3, "0")}</span>
                <div><strong>{formatEventType(event.type)}</strong><p>{event.summary}</p></div>
              </div>
            )) : <p className="empty-copy">No public world event has fired yet.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
