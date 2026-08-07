export type DecisionAnalysisType = 'pros_cons' | 'comparison_table' | 'swot' | 'weighted_criteria' | 'all';

export interface ProConItem {
  id: string;
  text: string;
  weight: number; // 1 to 5 scale
  category?: string; // e.g., Financial, Quality of Life, Career, Personal
}

export interface OptionProsCons {
  optionName: string;
  pros: ProConItem[];
  cons: ProConItem[];
  summary: string;
}

export interface ComparisonCriterion {
  id: string;
  name: string; // e.g. "Cost", "Long-term Value", "Risk"
  importance: number; // 1 to 5
  scores: Record<string, number>; // optionName -> score (1-10)
  notes: Record<string, string>; // optionName -> explanation
}

export interface SWOTQuad {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface OptionSWOT {
  optionName: string;
  swot: SWOTQuad;
}

export interface TiebreakerVerdict {
  winner: string; // Winning option or balanced conclusion
  confidenceScore: number; // 0 to 100
  verdictSummary: string;
  keyFactors: string[];
  whenToChooseWinner: string;
  whenToChooseAlternative: string;
  devilsAdvocatePoint: string;
  gutCheckQuestion: string;
}

export interface DecisionAnalysisResult {
  decisionTitle: string;
  context?: string;
  options: string[];
  prosCons: OptionProsCons[];
  comparisonCriteria: ComparisonCriterion[];
  swotAnalyses: OptionSWOT[];
  verdict: TiebreakerVerdict;
  createdAt: string;
}

export interface SavedDecision {
  id: string;
  title: string;
  context: string;
  options: string[];
  analysisType: DecisionAnalysisType;
  result: DecisionAnalysisResult;
  createdAt: string;
  updatedAt: string;
  isResolved?: boolean;
  chosenOption?: string;
  resolutionNotes?: string;
}

export interface DecisionPreset {
  id: string;
  title: string;
  context: string;
  options: string[];
  category: string;
  icon: string;
}
