import type { ReactNode } from 'react';

export type AIMessageRole = 'user' | 'assistant';

export type AITone = 'purple' | 'green' | 'blue' | 'amber';

export interface AIMessageTableColumn {
  key: string;
  label: ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface AIMessageTableRow {
  id: string;
  cells: ReactNode[];
}

export interface AIMessageGraphPoint {
  label: string;
  value: number;
}

export interface AIMessageGraphDrilldown {
  label: string;
  prompt: string;
}

export interface AIMessageGraphPayload {
  kind: 'graph';
  title: string;
  chartType: 'bar' | 'line' | 'pie' | 'donut' | 'area';
  xAxis: string;
  yAxis: string;
  seriesLabel: string;
  categories: string[];
  values: number[];
  points: AIMessageGraphPoint[];
  drilldowns?: AIMessageGraphDrilldown[];
  total?: number;
}

export type AIMessageBlock =
  | {
      type: 'text';
      paragraphs: string[];
    }
  | {
      type: 'card';
      title?: string;
      cards: Array<{
        label: string;
        value: string;
        tone?: AITone;
      }>;
    }
  | {
      type: 'table';
      title?: string;
      columns: AIMessageTableColumn[];
      rows: AIMessageTableRow[];
    }
  | {
      type: 'summary';
      title?: string;
      cards: Array<{
        label: string;
        value: string;
        tone?: AITone;
      }>;
    }
  | {
      type: 'chart';
      title: string;
      description: string;
    }
  | {
      type: 'graph';
      payload: AIMessageGraphPayload;
    }
  | {
      type: 'download';
      title?: string;
      items: Array<{
        label: string;
        type: 'pdf' | 'excel';
      }>;
    };

export interface AIMessage {
  id: string;
  role: AIMessageRole;
  content: string;
  createdAt: string;
  blocks?: AIMessageBlock[];
}

export interface SuggestedQuestion {
  label: string;
  prompt: string;
}
