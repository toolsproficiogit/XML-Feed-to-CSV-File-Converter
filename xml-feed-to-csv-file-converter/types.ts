export interface XmlField {
  path: string; // e.g., "g:id" or "g:shipping > g:price"
  example: string;
  count: number;
}

export interface ProcessingStats {
  totalBytes: number;
  processedBytes: number;
  itemsFound: number;
  startTime: number;
}

export type AppState = 
  | 'IDLE' 
  | 'ANALYZING' 
  | 'SELECTION' 
  | 'PROCESSING' 
  | 'COMPLETED' 
  | 'ERROR';

export type FilterCondition = 'contains' | 'equals' | 'gt' | 'lt';

export interface Filter {
  id: string;
  path: string;
  condition: FilterCondition;
  value: string;
}

export interface CustomColumn {
  id: string;
  header: string;
  value: string;
}

export type CalculationOperator = '+' | '-' | '*' | '/';

export interface Calculation {
  id: string;
  resultHeader: string;
  operand1: string;
  isPercentageOp1?: boolean;
  operator: CalculationOperator;
  operand2: string;
  isPercentageOp2?: boolean;
}

export interface MergeColumn {
  id: string;
  header: string;
  operand1: string;
  operand2: string;
}