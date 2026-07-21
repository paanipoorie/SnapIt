import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

export interface Commit {
  hash: string;
  author: string;
  email: string;
  message: string;
  date: string;
}

export interface TimelineResponse extends Array<Commit> {}

export interface LoadRepositoryRequest {
  url: string;
}

export interface LoadRepositoryResponse {
  repositoryId: string;
  totalCommits: number;
}

export interface RepositoryInfo {
  repositoryId: string;
  url: string;
  totalCommits: number;
  createdAt: string;
}

export interface ErrorResponse {
  error: string;
}

export interface CommitStats {
  additions: number;
  deletions: number;
  files: number;
}

export interface CommitDetailResponse {
  hash: string;
  author: string;
  email: string;
  date: string;
  message: string;
  parents: string[];
  stats: CommitStats;
}

export interface TreeEntry {
  type: string;
  name: string;
  path: string;
  children?: TreeEntry[];
}

export interface FileResponse {
  path: string;
  size: number;
  language: string;
  content: string;
  binary: boolean;
}

export interface DiffFile {
  path: string;
  oldPath?: string;
  additions: number;
  deletions: number;
  isBinary: boolean;
  isRenamed: boolean;
  patch: string;
}

export interface DiffResponse {
  files: DiffFile[];
}

export const loadRepository = async (
  url: string
): Promise<LoadRepositoryResponse> => {
  const response = await api.post<LoadRepositoryResponse>("/repositories", { url });
  return response.data;
};

export const getTimeline = async (repositoryId: string): Promise<TimelineResponse> => {
  const response = await api.get<TimelineResponse>(`/repositories/${repositoryId}/timeline`);
  return response.data;
};

export const getRepository = async (repositoryId: string): Promise<RepositoryInfo> => {
  const response = await api.get<RepositoryInfo>(`/repositories/${repositoryId}`);
  return response.data;
};

export const getCommitDetail = async (
  repositoryId: string,
  hash: string
): Promise<CommitDetailResponse> => {
  const response = await api.get<CommitDetailResponse>(`/repositories/${repositoryId}/commits/${hash}`);
  return response.data;
};

export const getCommitTree = async (
  repositoryId: string,
  hash: string
): Promise<TreeEntry[]> => {
  const response = await api.get<TreeEntry[]>(`/repositories/${repositoryId}/commits/${hash}/tree`);
  return response.data;
};

export const getFileContent = async (
  repositoryId: string,
  hash: string,
  filePath: string
): Promise<FileResponse> => {
  const response = await api.get<FileResponse>(`/repositories/${repositoryId}/commits/${hash}/file`, {
    params: { path: filePath },
  });
  return response.data;
};

export const getCommitDiff = async (
  repositoryId: string,
  hash: string
): Promise<DiffResponse> => {
  const response = await api.get<DiffResponse>(`/repositories/${repositoryId}/commits/${hash}/diff`);
  return response.data;
};

export const healthCheck = async (): Promise<{ status: string }> => {
  const response = await api.get("/health");
  return response.data;
};

export default api;