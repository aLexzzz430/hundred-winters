import http from "node:http";

import { createDefaultWorldState, WorldCore } from "../world/world-core.js";

export function createApiServer() {
  const agents = new Map();
  const matches = new Map();
  let server;

  function getMatch(matchId) {
    if (!matches.has(matchId)) {
      matches.set(matchId, new WorldCore(createDefaultWorldState({ worldId: matchId })));
    }
    return matches.get(matchId);
  }

  async function handle(req, res) {
    try {
      const url = new URL(req.url, "http://127.0.0.1");
      if (req.method === "POST" && url.pathname === "/agents/register") {
        const payload = await readJson(req);
        const agentId = `agent_${agents.size + 1}_${slug(payload.agent_name ?? "anonymous")}`;
        agents.set(agentId, {
          agent_id: agentId,
          agent_name: payload.agent_name ?? "anonymous",
          agent_version: payload.agent_version ?? "unknown",
          capabilities: payload.capabilities ?? {}
        });
        return sendJson(res, 200, {
          agent_id: agentId,
          api_version: "2026-07-05",
          ruleset: "natural-civ-survival-v1",
          public_docs_url: "/docs/rules"
        });
      }

      const observationMatch = url.pathname.match(/^\/matches\/([^/]+)\/observation$/);
      if (req.method === "GET" && observationMatch) {
        const agentId = url.searchParams.get("agent_id");
        if (!agents.has(agentId)) {
          return sendJson(res, 404, { error: { code: "agent_not_registered", message: "Register agent before observing." } });
        }
        return sendJson(res, 200, getMatch(observationMatch[1]).observe(agentId));
      }

      const actionMatch = url.pathname.match(/^\/matches\/([^/]+)\/action$/);
      if (req.method === "POST" && actionMatch) {
        const payload = await readJson(req);
        if (!agents.has(payload.agent_id)) {
          return sendJson(res, 404, { error: { code: "agent_not_registered", message: "Register agent before acting." } });
        }
        const receipt = getMatch(actionMatch[1]).submitActions(payload);
        return sendJson(res, receipt.accepted ? 200 : 400, receipt);
      }

      const resultMatch = url.pathname.match(/^\/matches\/([^/]+)\/result$/);
      if (req.method === "GET" && resultMatch) {
        const agentId = url.searchParams.get("agent_id");
        if (!agents.has(agentId)) {
          return sendJson(res, 404, { error: { code: "agent_not_registered", message: "Register agent before reading results." } });
        }
        const snapshot = getMatch(resultMatch[1]).getPublicSnapshot();
        return sendJson(res, 200, {
          match_id: resultMatch[1],
          agent_id: agentId,
          status: "running",
          public_score: snapshot.score,
          era_reached: snapshot.civilization.era_label,
          collapse_reason: null,
          key_events: getMatch(resultMatch[1])
            .getEventLog()
            .filter((event) => event.public)
            .slice(-8)
        });
      }

      const replayMatch = url.pathname.match(/^\/matches\/([^/]+)\/replay$/);
      if (req.method === "GET" && replayMatch) {
        return sendJson(res, 200, getMatch(replayMatch[1]).createPublicReplay());
      }

      return sendJson(res, 404, { error: { code: "not_found", message: "Route not found." } });
    } catch (error) {
      return sendJson(res, 500, { error: { code: "internal_error", message: error.message } });
    }
  }

  return {
    get port() {
      return server?.address()?.port;
    },
    start(port = 8787) {
      server = http.createServer((req, res) => {
        void handle(req, res);
      });
      return new Promise((resolve) => {
        server.listen(port, "127.0.0.1", resolve);
      });
    },
    stop() {
      return new Promise((resolve, reject) => {
        if (!server) {
          resolve();
          return;
        }
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  };
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error(`Invalid JSON: ${error.message}`));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body)
  });
  res.end(body);
}

function slug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 32) || "anonymous";
}

