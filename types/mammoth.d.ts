declare module 'mammoth' {
  interface ExtractRawTextOptions {
    arrayBuffer: ArrayBuffer;
  }

  interface ExtractRawTextResult {
    value: string;
    messages: any[];
  }

  export function extractRawText(options: ExtractRawTextOptions): Promise<ExtractRawTextResult>;
} 