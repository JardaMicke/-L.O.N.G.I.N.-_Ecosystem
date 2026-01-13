export interface DatabaseConnector {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  query(sql: string, params?: any[]): Promise<any>; // Generic query
}
