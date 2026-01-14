export interface PageFilters {
  invert: boolean;
  grayscale: boolean;
  whiteness: number; // 0-100, effectively brightness/gamma
  blackness: number; // 0-100, effectively contrast/threshold
}

export interface PageItem {
  id: string; // Unique ID for DnD
  fileId: string;
  originalPageIndex: number; // 0-based index in the original PDF
  thumbnailDataUrl: string; // Base64 image of the page
  width: number;
  height: number;
  isSelected: boolean;
  filters: PageFilters;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  pageCount: number;
  data: ArrayBuffer; // Raw PDF data
}

export interface LayoutSettings {
  nUp: 1 | 2 | 4; // 1, 2, or 4 slides per page
  showBorders: boolean;
}

export enum AppStep {
  UPLOAD = 1,
  WORKSHOP = 2,
  LAYOUT = 3,
  DOWNLOAD = 4,
}