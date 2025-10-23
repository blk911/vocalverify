export const runtime = "nodejs";
export async function GET() {
  // Mock response for now
  const mockResponse = {
    pack: {
      relationship: "mom_son",
      version: "1",
      domains: [
        {
          name: "cooking",
          seeds: [
            "Cooking: Tell me something that defines how cooking worked in your family.",
            "What dish instantly reminds you of mom and why?",
            "When you tried to help, what usually happened?"
          ],
          refine: [
            "Name the first dish you tried to copy, and how it went.",
            "Say the unspoken cooking rule at home in six words.",
            "Include one object from the kitchen that mattered."
          ]
        },
        {
          name: "milestones",
          seeds: [
            "Pick one trip or weekend that was *yours* with mom—what happened?",
            "Name a moment you knew she was proud of you.",
            "Describe a small disaster you still laugh about."
          ],
          refine: [
            "Say the place and the workaround you used.",
            "State the sequence in three steps (1–2–3).",
            "Include a code word or phrase you two use."
          ]
        }
      ],
      nonce_words: ["pinecone","marigold","driftwood","tumbleweed","sourdough","starlight"]
    }
  };
  
  return Response.json(mockResponse);
}
