export interface VideoFile {
  id: string;
  file: File;
  name: string;
  url: string;
  duration?: string;
}

export enum PlaybackSpeed {
  Slow = 0.5,
  Normal = 1.0,
  Fast = 1.25,
  VeryFast = 1.5,
  Double = 2.0
}

export enum LoopMode {
  None = 'none',
  All = 'all',
  Single = 'single'
}

export interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}