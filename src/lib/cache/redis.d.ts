// Type declaration for optional redis module
declare module 'redis' {
  export function createClient(options?: { url?: string }): {
    connect(): Promise<void>;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, options?: { EX?: number }): Promise<void>;
    del(key: string): Promise<void>;
    keys(pattern: string): Promise<string[]>;
  };
}
