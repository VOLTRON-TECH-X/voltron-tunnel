export interface BannerStatus {
  success: boolean;
  enabled: boolean;
  banner_count: number;
  config_file: string;
  config_exists: boolean;
  timestamp: string;
}

export interface BannerActionResponse {
  success: boolean;
  message?: string;
  error?: string;
  details?: {
    success: boolean;
    users_configured?: number;
    error?: string;
  };
}