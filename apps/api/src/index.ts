import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import profile from './routes/profile';
import agents from './routes/agents';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use(profile);
app.use(agents);            // <-- adds /agents/health and /agents/run/profile-extract

// Mock AIS responses
const mockAIS = {
  anticipate: {
    predicted_user: "Ashlyn Wendt",
    risk_tier: "low",
    confidence: 0.85,
    reasoning: "Voice pattern matches known user profile"
  },
  nonce: {
    nonce: "pinecone-marigold-driftwood",
    ttl: 120000,
    challenge_type: "voice_nonce"
  },
  name: {
    detected_name: "Ashlyn",
    confidence: 0.92,
    alternatives: ["Ash", "Ashlyn Wendt"]
  },
  challenge: {
    decision: "accept",
    confidence: 0.88,
    reasoning: "Challenge response matches expected pattern"
  }
};

// Routes
app.post('/anticipate', (req, res) => {
  console.log('🔮 [API] Anticipate request:', req.body);
  
  // Mock delay
  setTimeout(() => {
    res.json({
      predicted_user: "spencer_wendt",
      risk_tier: "L2",
      ready_voicewave: true,
      tb_candidates: ["TB_spencer_ash"],
      prebaked_challenges: [{
        tb_id: "TB_spencer_ash",
        challenge_id: "c-91a",
        facet: "milestone_count",
        prompt: "Which kid did you drive to college, and how many times?",
        nonce_word: "pinecone",
        ttl_ms: 120000
      }]
    });
  }, 500);
});

app.post('/voice/nonce', (req, res) => {
  console.log('🎤 [API] Voice nonce request:', req.body);
  
  setTimeout(() => {
    res.json({ 
      voice_bio: 0.91, 
      liveness: 0.99, 
      ok: true 
    });
  }, 300);
});

app.post('/voice/name', (req, res) => {
  console.log('👤 [API] Voice name request:', req.body);
  
  setTimeout(() => {
    res.json({ 
      voice_bio: 0.93, 
      name_match: 0.88, 
      ok: true 
    });
  }, 400);
});

app.post('/challenge/prebaked', (req, res) => {
  console.log('🎯 [API] Challenge prebaked request:', req.body);
  
  setTimeout(() => {
    res.json({
      challenge_id: "c-91a",
      prompt_shape: "milestone_count",
      nonce: "pinecone"
    });
  }, 200);
});

app.post('/challenge/answer', (req, res) => {
  console.log('✅ [API] Challenge answer request:', req.body);
  
  setTimeout(() => {
    res.json({
      decision: "allow",
      scores: { voice: 0.92, semantics: 0.81, count: "exact" },
      reason: "TB facet match + voice high"
    });
  }, 600);
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'amihuman-api',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ [API] Error:', err);
  res.status(500).json({
    ok: false,
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 [API] Server running on port ${PORT}`);
  console.log(`📡 [API] Health check: http://localhost:${PORT}/health`);
  console.log(`🔮 [API] Anticipate: POST http://localhost:${PORT}/anticipate`);
  console.log(`🎤 [API] Voice nonce: POST http://localhost:${PORT}/voice/nonce`);
  console.log(`👤 [API] Voice name: POST http://localhost:${PORT}/voice/name`);
  console.log(`🎯 [API] Challenge prebaked: POST http://localhost:${PORT}/challenge/prebaked`);
  console.log(`✅ [API] Challenge answer: POST http://localhost:${PORT}/challenge/answer`);
});
