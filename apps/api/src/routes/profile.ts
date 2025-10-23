import { Router } from "express";
const router = Router();
const AIS = process.env.AIS_BASE_URL ?? "http://localhost:8001";

// anticipate packs/domains
router.get("/profile/anticipate", async (_req, res) => {
  const r = await fetch(`${AIS}/ais/anticipate-packs`);
  res.status(r.status).send(await r.text());
});

// start a session
router.post("/profile/session", async (req, res) => {
  const r = await fetch(`${AIS}/ais/profile/session`, {
    method: "POST", headers: {"content-type":"application/json"}, body: JSON.stringify(req.body)
  });
  res.status(r.status).send(await r.text());
});

// submit answer → get refine OR preview
router.post("/profile/extract", async (req, res) => {
  const r = await fetch(`${AIS}/ais/profile/extract`, {
    method: "POST", headers: {"content-type":"application/json"}, body: JSON.stringify(req.body)
  });
  res.status(r.status).send(await r.text());
});

// save artifacts (DB write; for now echo)
router.post("/profile/artifacts", async (req, res) => {
  // TODO: persist to your DB; for stub return ok
  res.json({ ok: true, stored: req.body.preview });
});

export default router;
