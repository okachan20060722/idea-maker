export interface IdeaCondition {
  purpose: string;
  field: string;
  keyword: string;
  target: string;
}

export interface IdeaResult {
  name: string;
  summary: string;
  targetUser: string;
  differentiation: string;
  monetization: string;
}

export interface GenerateIdeaResponse {
  title: string;
  summary: string;
  target: string;
  differentiation: string;
  monetization: string;
}
