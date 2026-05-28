const SYSTEM_PROMPT = `You are a helpful writing assistant for YouthToPro, a youth mentorship program. A student is writing a Letter of Intent to their mentor. The student has basic English proficiency. Your job is to improve their writing to be clear, warm, and professional but keep it simple — use short sentences, common everyday words, and a friendly tone. Do NOT make it sound overly formal or corporate. Keep the student's original meaning and personality intact. Do not add any information the student did not provide. Return ONLY the improved text with no explanation, no preamble, and no quotation marks.`;

const POLISH_SYSTEM_PROMPT = `You are a professional writing assistant for YouthToPro, a youth mentorship program. A student has written a Letter of Intent to their mentor. The student has basic English proficiency.

Please review and lightly polish the entire letter to make it:
- Clear and easy to read
- Warm and personal in tone
- Professional but not overly formal
- Free of grammar and spelling errors
- Written in simple, everyday English

IMPORTANT: Do NOT change the structure, add new sections, invent information, or make it sound corporate. Preserve the student's voice and all the specific details they provided.

Return ONLY the complete polished letter with no explanation, no preamble, and no extra commentary.`;

function getKey(): string {
  return (import.meta as any).env?.VITE_ANTHROPIC_API_KEY || '';
}

async function streamClaude(
  systemPrompt: string,
  userPrompt: string,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (msg: string) => void,
) {
  const key = getKey();
  if (!key) {
    onError('No Anthropic API key found. Add ANTHROPIC_API_KEY=sk-... to your .env file and restart the dev server.');
    return;
  }
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        stream: true,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      onError((err as any)?.error?.message || `API error ${res.status}`);
      return;
    }
    const reader = res.body?.getReader();
    if (!reader) { onError('No response body'); return; }
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split('\n')) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;
        try {
          const json = JSON.parse(data);
          const text = json?.delta?.text || '';
          if (text) onChunk(text);
        } catch {}
      }
    }
    onDone();
  } catch (e: any) {
    onError(e.message || 'AI request failed');
  }
}

async function callClaude(systemPrompt: string, userPrompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let result = '';
    streamClaude(
      systemPrompt,
      userPrompt,
      (chunk) => { result += chunk; },
      () => resolve(result),
      (msg) => reject(new Error(msg)),
    );
  });
}

export async function improveField(fieldValue: string, fieldLabel: string): Promise<string> {
  const userPrompt = `Please improve this text written by a student for their Letter of Intent:\n\n"${fieldValue}"\n\nContext: This text is for the section "${fieldLabel}" in their letter.`;
  return callClaude(SYSTEM_PROMPT, userPrompt);
}

export async function streamImproveField(
  fieldValue: string,
  fieldLabel: string,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (msg: string) => void,
) {
  const userPrompt = `Please improve this text written by a student for their Letter of Intent:\n\n"${fieldValue}"\n\nContext: This text is for the section "${fieldLabel}" in their letter.`;
  streamClaude(SYSTEM_PROMPT, userPrompt, onChunk, onDone, onError);
}

export async function improveBullets(
  challenges: string[],
  expectations: string[],
): Promise<{ challenges: string[]; expectations: string[] }> {
  const userPrompt = `A student has written bullet points for their Letter of Intent. Please improve each bullet point to be clear and specific but keep simple language. Return ONLY a JSON object with two arrays.

Challenges bullets:
${challenges.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Expectations bullets:
${expectations.map((e, i) => `${i + 1}. ${e}`).join('\n')}

Return exactly this JSON format (no extra text):
{"challenges":["..."],"expectations":["..."]}`;

  const result = await callClaude(SYSTEM_PROMPT, userPrompt);
  const match = result.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Could not parse AI response');
  return JSON.parse(match[0]);
}

export async function streamPolishLetter(
  letterText: string,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (msg: string) => void,
) {
  const userPrompt = `Please polish this Letter of Intent:\n\n${letterText}`;
  streamClaude(POLISH_SYSTEM_PROMPT, userPrompt, onChunk, onDone, onError);
}

// ── Career Path AI functions ──────────────────────────────────────────────────

const CP_ROADMAP_SYSTEM = `You are a career development expert for YouthToPro, a mentorship program for university students primarily in the Middle East and emerging markets. You help students build realistic, practical career roadmaps. Use simple language. Be specific and actionable. Return ONLY valid JSON — no explanation, no markdown, no preamble.`;

const CP_EXPLORER_SYSTEM = `You are a career guidance counsellor for YouthToPro, a mentorship program for university students in the Middle East and emerging markets. Give practical, realistic career suggestions suited to their region and background. Use simple, encouraging language. Return ONLY valid JSON.`;

const CP_VISION_SYSTEM = `You are a career counsellor helping a student write a Career Vision Statement. Use simple, personal language. Make it specific to their career and region. Return ONLY the vision statement, 1-2 sentences, no preamble.`;

export async function generateCareerRoadmap(
  careerTitle: string,
  degree: string,
  university: string,
  region: string = 'Middle East/GCC',
): Promise<any> {
  const userPrompt = `Build a complete 4-stage career roadmap for:
- Career Title: ${careerTitle}
- Degree & Major: ${degree}
- University: ${university}
- Region: ${region}

Return ONLY this JSON (no extra text):
{
  "stages": [
    {
      "stage": "entry",
      "roleTitle": "Job title",
      "roleDescription": "2-3 sentence description of day-to-day work",
      "milestones": ["milestone 1", "milestone 2", "milestone 3", "milestone 4"],
      "skills": ["skill 1", "skill 2", "skill 3", "skill 4", "skill 5"],
      "certifications": ["cert 1", "cert 2", "cert 3"],
      "communities": ["community 1", "community 2"],
      "targetCompanies": ["company 1", "company 2", "company 3"]
    },
    { "stage": "emerging", "roleTitle": "...", "roleDescription": "...", "milestones": [], "skills": [], "certifications": [], "communities": [], "targetCompanies": [] },
    { "stage": "experienced", "roleTitle": "...", "roleDescription": "...", "milestones": [], "skills": [], "certifications": [], "communities": [], "targetCompanies": [] },
    { "stage": "leadership", "roleTitle": "...", "roleDescription": "...", "milestones": [], "skills": [], "certifications": [], "communities": [], "targetCompanies": [] }
  ],
  "networkSuggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}`;
  const raw = await callClaude(CP_ROADMAP_SYSTEM, userPrompt);
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Could not parse AI response');
  return JSON.parse(match[0]);
}

export async function exploreCareerOptions(
  degree: string,
  interests: string,
  skills: string,
  workStyle: string,
  region: string,
): Promise<any[]> {
  const userPrompt = `Student profile:
- Degree/Major: ${degree}
- Interests: ${interests}
- Skills they enjoy: ${skills}
- Work style: ${workStyle}
- Region: ${region}

Suggest 3–5 career paths. Return ONLY a JSON array:
[
  {
    "title": "Career Title",
    "matchLevel": "strong",
    "whySuitable": "2-3 sentences",
    "entryRole": "First job title",
    "industries": ["Industry 1"],
    "avgSalaryRange": "AED 8,000–15,000/month",
    "icon": "material_symbol_name"
  }
]
matchLevel must be one of: "strong", "good", "exploring"`;
  const raw = await callClaude(CP_EXPLORER_SYSTEM, userPrompt);
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('Could not parse AI response');
  return JSON.parse(match[0]);
}

export async function generateVisionStatement(
  careerTitle: string,
  region: string,
  existingText: string,
): Promise<string> {
  const userPrompt = `Career Title: ${careerTitle}\nRegion: ${region || 'Middle East/GCC'}\nDraft vision: ${existingText || 'none'}\n\nWrite an inspiring, specific 1-2 sentence career vision statement.`;
  return callClaude(CP_VISION_SYSTEM, userPrompt);
}

export async function improveStageField(
  fieldValue: string,
  fieldLabel: string,
  stageLabel: string,
  careerTitle: string,
): Promise<string> {
  const sys = `You are helping a student improve their career roadmap for the ${stageLabel} stage of a career in ${careerTitle}. Use simple, practical language. Be specific. Keep bullet points short. Return ONLY the improved text. No explanation.`;
  return callClaude(sys, `Improve this "${fieldLabel}" content:\n\n${fieldValue}`);
}

// ── SWOT AI function ──────────────────────────────────────────────────────────

export interface SwotQuestion { question: string; sampleAnswer: string; }
export interface SwotStructure {
  strengths: SwotQuestion[];
  weaknesses: SwotQuestion[];
  opportunities: SwotQuestion[];
  threats: SwotQuestion[];
}

export async function generateSwotStructure(careerGoal: string): Promise<SwotStructure> {
  const sys = `You are an expert career development coach specializing in personalized SWOT analysis for university students in the Middle East and GCC region. Generate structured SWOT questions tailored to the user's career goal. Use simple, encouraging language. Return ONLY valid JSON.`;
  const userPrompt = `Career Goal: "${careerGoal}"

Generate exactly 4 questions per SWOT category, each with a concise 1-2 sentence sample answer tailored to this career goal.

Return ONLY this JSON:
{
  "strengths": [
    { "question": "Question about a strength relevant to the career goal?", "sampleAnswer": "Example answer." },
    { "question": "...", "sampleAnswer": "..." },
    { "question": "...", "sampleAnswer": "..." },
    { "question": "...", "sampleAnswer": "..." }
  ],
  "weaknesses": [ { "question": "...", "sampleAnswer": "..." }, { "question": "...", "sampleAnswer": "..." }, { "question": "...", "sampleAnswer": "..." }, { "question": "...", "sampleAnswer": "..." } ],
  "opportunities": [ { "question": "...", "sampleAnswer": "..." }, { "question": "...", "sampleAnswer": "..." }, { "question": "...", "sampleAnswer": "..." }, { "question": "...", "sampleAnswer": "..." } ],
  "threats": [ { "question": "...", "sampleAnswer": "..." }, { "question": "...", "sampleAnswer": "..." }, { "question": "...", "sampleAnswer": "..." }, { "question": "...", "sampleAnswer": "..." } ]
}`;
  const raw = await callClaude(sys, userPrompt);
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Could not parse SWOT structure');
  const parsed = JSON.parse(match[0]);
  if (!parsed.strengths || !parsed.weaknesses || !parsed.opportunities || !parsed.threats) {
    throw new Error('Invalid SWOT structure from AI');
  }
  return parsed as SwotStructure;
}

export async function reviewCareerRoadmap(roadmapText: string, careerTitle: string): Promise<any[]> {
  const sys = `You are a career counsellor reviewing a student's career roadmap. Give practical, kind, specific feedback. Keep it simple. Return ONLY valid JSON array.`;
  const userPrompt = `Review this career roadmap for a student pursuing ${careerTitle}:\n\n${roadmapText}\n\nReturn up to 5 suggestions:\n[\n  { "section": "Section name", "icon": "material_symbol_name", "suggestion": "1-2 sentence suggestion" }\n]`;
  const raw = await callClaude(sys, userPrompt);
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('Could not parse AI response');
  return JSON.parse(match[0]);
}
