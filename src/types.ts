export interface IdeaCondition {
  purpose: string;
  field: string;
  keywords: string[];
  target: string;
  grade?: string;
  purposeDetail?: string;
  fieldDetail?: string;
  advancedConditions?: string;
}

export interface IdeaResult {
  name: string;
  summary: string;
  targetUser: string;
  differentiation: string;
  monetization: string;
  keywords: string[];
  feasibilityScore?: number;
  feasibilityActionPlan?: string;
}

export interface GenerateIdeaResponse {
  title: string;
  summary: string;
  target: string;
  differentiation: string;
  monetization: string;
  keywords: string[];
  feasibilityScore?: number;
  feasibilityActionPlan?: string;
}
