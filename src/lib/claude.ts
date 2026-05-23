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
  return process.env.ANTHROPIC_API_KEY || '';
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
        model: 'claude-sonnet-4-20250514',
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
