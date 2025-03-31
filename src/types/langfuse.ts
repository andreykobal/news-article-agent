export interface LangfuseTraceUpdate {
  name: string;
  status: 'success' | 'error';
  metadata?: Record<string, unknown>;
}

export interface LangfuseSpanUpdate {
  statusMessage?: string;
  level?: 'DEBUG' | 'DEFAULT' | 'WARNING' | 'ERROR';
  metadata?: Record<string, unknown>;
} 