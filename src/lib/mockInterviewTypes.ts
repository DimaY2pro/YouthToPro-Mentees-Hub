export enum InterviewRole {
  HR = 'HR Manager',
  FUNCTIONAL = 'Technical/Functional Manager',
}

export enum Language {
  ENGLISH = 'English',
  ARABIC = 'Arabic',
}

export enum ArabicDialect {
  JORDANIAN = 'Jordanian (Simple Tone)',
  EGYPTIAN = 'Egyptian',
  LEBANESE = 'Lebanese',
  GULF = 'UAE/Gulf',
  NONE = '',
}

export interface InterviewSettings {
  candidateName: string;
  cvContent: string;
  jobDescription: string;
  role: InterviewRole;
  language: Language;
  dialect: ArabicDialect;
}

export interface RubricScores {
  dimension: string;
  score: number;
  justification: string;
}

export interface ImprovementArea {
  topic: string;
  feedback: string;
  actionableStep: string;
}

export interface DetailedSentiment {
  tone: string;
  confidenceScore: number;
  engagementLevel: string;
  fillerWordFrequency: string;
  nervousnessLevel: string;
}

export interface VisualIntelligence {
  eyeContactScore: number;
  postureScore: number;
  professionalPresence: number;
  facialExpressions: string;
  overallVisualFeedback: string;
}

export type OutcomeClassification =
  | 'Not Interview-Ready'
  | 'Developing'
  | 'Interview-Ready'
  | 'Strong Candidate'
  | 'High Potential';

export interface FeedbackData {
  candidateName: string;
  strengths: string[];
  improvements: ImprovementArea[];
  sentiment: DetailedSentiment;
  visualIntelligence: VisualIntelligence;
  bodyLanguage: {
    feedback: string;
    isFocused: boolean;
    eyeContact: string;
    posture: string;
  };
  rubric: RubricScores[];
  outcome: OutcomeClassification;
  overallScore: number;
  summary: string;
  recordingUrl?: string;
  snapshots?: string[];
  transcript?: string;
}

export type AppStep = 'SETUP' | 'INTERVIEW' | 'FEEDBACK';
