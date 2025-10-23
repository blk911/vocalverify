# Prompt Packs v1

AI prompt templates for relationship-based conversations.

## Structure

Each prompt pack contains:
- `relationship`: The relationship type (e.g., "mom_son", "parent_child")
- `version`: Pack version
- `domains`: Conversation domains with seeds and refine prompts
- `nonce_words`: Random words for security/verification

## Usage

```typescript
import { loadPromptPack } from '@amihuman/prompt-packs';

const pack = await loadPromptPack('mom_son', '1');
const cookingSeeds = pack.domains.find(d => d.name === 'cooking')?.seeds;
```

## Available Packs

- `mom_son.json` - Mother-son relationship prompts
- `parent_child.json` - Generic parent-child prompts
