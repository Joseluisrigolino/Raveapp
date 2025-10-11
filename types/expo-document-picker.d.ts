declare module "expo-document-picker" {
  export type DocumentPickerOptions = {
    type?: string | string[];
    multiple?: boolean;
    copyToCacheDirectory?: boolean;
  };
  export type DocumentResult =
    | { type: "success"; uri: string; name?: string; size?: number; mimeType?: string }
    | { type: "cancel" };

  export function getDocumentAsync(options?: DocumentPickerOptions): Promise<DocumentResult | { assets?: Array<{ uri: string; name?: string; size?: number; mimeType?: string }>; type?: string } >;
}
