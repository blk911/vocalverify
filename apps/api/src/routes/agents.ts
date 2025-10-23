import { Router } from "express";

const router = Router();

// Health
router.get("/agents/health", (_req, res) => {
  res.json({ ok: true });
});

// Toggle: use synthetic preview until the real Agent is wired
const USE_AGENT = process.env.USE_AGENT === "1";

// POST /agents/run/profile-extract
router.post("/agents/run/profile-extract", async (req, res) => {
  try {
    const { domain, prompt, answer } = req.body || {};
    if (typeof domain !== "string" || typeof prompt !== "string" || typeof answer !== "string") {
      return res.status(400).json({ error: "bad_request" });
    }

    if (!USE_AGENT) {
      // Synthetic path (default)
      console.log("[agents] profile-extract → synthetic");
      return res.json({
        ok: true,
        preview: {
          summary: "Mother taught by example; first copied biscuits.",
          anchors: ["Cooking", "Biscuits", "Observation"],
          confidence: 0.92,
        },
      });
    }

    console.log("[agents] profile-extract → agent(stub)");
    // TODO: call your OpenAI Workflow / Agent here.
    // For now, return the same shape so the web contract is stable.
    return res.json({
      ok: true,
      preview: {
        summary: "Mother taught by example; first copied biscuits.",
        anchors: ["Cooking", "Biscuits", "Observation"],
        confidence: 0.92,
      },
    });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: "server_error" });
  }
});

export default router;
