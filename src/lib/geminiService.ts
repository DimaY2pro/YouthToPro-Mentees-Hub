import { GoogleGenAI, Type } from '@google/genai';
import { FeedbackData } from './mockInterviewTypes';

function getKey(): string {
  return (import.meta as any).env?.VITE_GOOGLE_API_KEY || '';
}

const getClient = () => new GoogleGenAI({ apiKey: getKey() });

const fileToGenerativePart = async (
  file: File,
): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve({ inlineData: { data: base64Data, mimeType: file.type } });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const extractTextFromDocument = async (file: File): Promise<string> => {
  if (
    file.type === 'text/plain' ||
    file.type === 'text/markdown' ||
    file.name.endsWith('.txt') ||
    file.name.endsWith('.md')
  ) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  const key = getKey();
  if (!key) throw new Error('No Google API key. Add VITE_GOOGLE_API_KEY to your .env file and restart the dev server.');

  const ai = getClient();
  const filePart = await fileToGenerativePart(file);

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: {
      parts: [
        filePart,
        { text: 'Extract all text content from this document for an interview system. Output raw text only.' },
      ],
    },
  });

  return response.text || '';
};

export const generateFeedback = async (
  transcript: string,
  jd: string,
  cv: string,
  snapshots: string[],
  roleName: string,
  candidateName: string,
): Promise<FeedbackData> => {
  const key = getKey();
  if (!key) throw new Error('No Google API key. Add VITE_GOOGLE_API_KEY to your .env file and restart the dev server.');

  const ai = getClient();
  const imageParts = snapshots.map((base64) => ({
    inlineData: { data: base64, mimeType: 'image/jpeg' },
  }));

  const promptText = `
    Analyze this interview performance for "Youth To Professionals".

    CRITICAL SCORING RULES:
    1. SCORING SCALE: For all rubric and visual intelligence dimensions, scores MUST be between 1 and 5 (1=Critical Failure, 2=Poor, 3=Average, 4=Good, 5=Excellent).
    2. ABSOLUTELY NO SCORES ABOVE 5. If you exceed 5, the report is invalid.
    3. BE RIGOROUS: We prioritize elite candidates.
    4. VERBAL INTELLIGENCE: Evaluate confidence (0-100), tone, engagement level, and filler frequency.
    5. VISUAL INTELLIGENCE: Evaluate Eye Contact (1-5), Posture (1-5), and Professional Presence (1-5) based on snapshots if available, or professional expectations for this role.

    Candidate Name: ${candidateName}
    Role Context: ${roleName}
    Job Description: ${jd}
    Resume/CV: ${cv}

    INTERVIEW TRANSCRIPT:
    ${transcript || '[NO TRANSCRIPT DATA - CANDIDATE DID NOT SPEAK]'}

    Provide a professional, data-driven assessment.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: {
      parts: [...imageParts, { text: promptText }],
    },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          candidateName: { type: Type.STRING },
          rubric: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                dimension: { type: Type.STRING },
                score: { type: Type.INTEGER, description: 'Integer 1-5' },
                justification: { type: Type.STRING },
              },
              required: ['dimension', 'score', 'justification'],
            },
          },
          outcome: { type: Type.STRING },
          sentiment: {
            type: Type.OBJECT,
            properties: {
              tone: { type: Type.STRING },
              confidenceScore: { type: Type.NUMBER },
              engagementLevel: { type: Type.STRING },
              fillerWordFrequency: { type: Type.STRING },
              nervousnessLevel: { type: Type.STRING },
            },
            required: ['tone', 'confidenceScore', 'engagementLevel', 'fillerWordFrequency', 'nervousnessLevel'],
          },
          visualIntelligence: {
            type: Type.OBJECT,
            properties: {
              eyeContactScore: { type: Type.INTEGER, description: '1-5' },
              postureScore: { type: Type.INTEGER, description: '1-5' },
              professionalPresence: { type: Type.INTEGER, description: '1-5' },
              facialExpressions: { type: Type.STRING },
              overallVisualFeedback: { type: Type.STRING },
            },
            required: ['eyeContactScore', 'postureScore', 'professionalPresence', 'facialExpressions', 'overallVisualFeedback'],
          },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          improvements: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                topic: { type: Type.STRING },
                feedback: { type: Type.STRING },
                actionableStep: { type: Type.STRING },
              },
              required: ['topic', 'feedback', 'actionableStep'],
            },
          },
          bodyLanguage: {
            type: Type.OBJECT,
            properties: {
              feedback: { type: Type.STRING },
              isFocused: { type: Type.BOOLEAN },
              eyeContact: { type: Type.STRING },
              posture: { type: Type.STRING },
            },
            required: ['feedback', 'isFocused', 'eyeContact', 'posture'],
          },
          overallScore: { type: Type.NUMBER, description: '0-100' },
          summary: { type: Type.STRING },
        },
        required: [
          'candidateName', 'rubric', 'outcome', 'sentiment', 'visualIntelligence',
          'strengths', 'improvements', 'bodyLanguage', 'overallScore', 'summary',
        ],
      },
    },
  });

  try {
    const data = JSON.parse(response.text || '{}');
    if (data.rubric) {
      data.rubric = data.rubric.map((r: any) => ({ ...r, score: Math.min(5, Math.max(1, r.score)) }));
    }
    if (data.visualIntelligence) {
      data.visualIntelligence.eyeContactScore = Math.min(5, Math.max(1, data.visualIntelligence.eyeContactScore));
      data.visualIntelligence.postureScore = Math.min(5, Math.max(1, data.visualIntelligence.postureScore));
      data.visualIntelligence.professionalPresence = Math.min(5, Math.max(1, data.visualIntelligence.professionalPresence));
    }
    return data as FeedbackData;
  } catch (e) {
    console.error('Parse Error', e);
    throw new Error('Failed to generate assessment.');
  }
};
