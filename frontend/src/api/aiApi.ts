import { apiClient } from './client';

export interface AIChatRequest {
  message: string;
  sessionId?: string;
}

export interface AIChatResponse {
  type: 'text' | 'table' | 'card' | 'download' | 'graph';
  title?: string;
  columns?: string[];
  rows?: string[][];
  message?: string;
  data?: Record<string, unknown>;
}

export const sendAIChatMessage = async (message: string, sessionId?: string): Promise<AIChatResponse> => {
  const payload: AIChatRequest = { message, sessionId };
  const response = await apiClient.post<AIChatResponse>('/ai/chat', payload);
  return response.data;
};
                                                                                                              