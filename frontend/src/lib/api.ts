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

export const healthCheck = async (): Promise<{ status: string }> => {
  const response = await api.get("/health");
  return response.data;
};

export default api;