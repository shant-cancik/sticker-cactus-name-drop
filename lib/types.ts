export interface TextRegion {
  text: string;
  boundingBox: {
    x: number;      // 0-1 normalized
    y: number;      // 0-1 normalized
    width: number;   // 0-1 normalized
    height: number;  // 0-1 normalized
  };
  style: {
    fontFamily: string;
    fontSize: number;       // estimated px relative to image height
    fontWeight: string;
    fontStyle: string;
    color: string;          // hex color
    letterSpacing: number;  // estimated px
    textTransform: string;  // 'uppercase' | 'none' etc.
    rotation: number;       // degrees
    alignment: string;      // 'center' | 'left' | 'right'
    hasOutline: boolean;
    outlineColor: string;
    outlineWidth: number;
    hasShadow: boolean;
    curve: number;          // 0 = straight, positive = arc up, negative = arc down
  };
  confidence: number;
}

export interface AnalysisResult {
  textRegions: TextRegion[];
  imageWidth: number;
  imageHeight: number;
}

export interface StickerJob {
  id: string;
  originalImage: string;       // base64 data URL
  fileName: string;
  status: 'uploaded' | 'analyzing' | 'analyzed' | 'processing' | 'done' | 'error';
  analysis?: AnalysisResult;
  replacements: Record<string, string>;  // original text -> new text
  processedImage?: string;     // base64 data URL of result
  error?: string;
}
