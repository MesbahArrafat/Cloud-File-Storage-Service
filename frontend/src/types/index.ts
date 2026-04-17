export interface User {
  id: string;
  username: string;
  email: string;
  storage_used: number;
  storage_limit: number;
  storage_used_mb: number;
  storage_limit_mb: number;
  avatar: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse extends AuthTokens {
  user: User;
}

export interface Folder {
  id: string;
  name: string;
  parent: string | null;
  user: string;
  subfolder_count: number;
  file_count: number;
  full_path: string;
  created_at: string;
  updated_at: string;
  subfolders?: Folder[];
}

export interface File {
  id: string;
  filename: string;
  original_filename: string;
  size: number;
  hash: string;
  folder: string | null;
  user: string;
  is_public: boolean;
  share_token: string;
  is_deleted: boolean;
  is_starred: boolean;
  mime_type: string;
  download_url: string;
  preview_url: string;
  created_at: string;
  updated_at: string;
}

export interface FilePermission {
  id: string;
  file: string;
  user: string;
  user_email: string;
  can_view: boolean;
  can_download: boolean;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user: string | null;
  user_email: string | null;
  file: string | null;
  filename: string | null;
  action: 'upload' | 'download' | 'delete' | 'restore' | 'share' | 'rename';
  timestamp: string;
  ip_address: string | null;
  extra_data: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ChunkUploadSession {
  upload_id: string;
  filename: string;
  total_chunks: number;
  created_at: string;
}

export interface ShareInfo {
  share_token: string;
  share_url: string;
  is_public: boolean;
}
