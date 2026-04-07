import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { GeneratePaperRequest, GeneratedPaper, GeneratedQuestion } from "@shared/schema";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = { "Accept": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
};

export function usePapers() {
  return useQuery({
    queryKey: [api.papers.list.path],
    queryFn: async () => {
      const res = await fetch(api.papers.list.path, {
        headers: getHeaders(),
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to fetch papers");
      return (api.papers.list as any).responses[200].parse(await res.json());
    },
  });
}

export function usePaper(id: number) {
  return useQuery({
    queryKey: [api.papers.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.papers.get.path, { id });
      const res = await fetch(url, {
        headers: getHeaders(),
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to fetch paper");
      return (api.papers.get as any).responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useGeneratePaper() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: GeneratePaperRequest) => {
      const headers = getHeaders();
      headers["Content-Type"] = "application/json";

      const res = await fetch(api.papers.generate.path, {
        method: api.papers.generate.method,
        headers,
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to generate paper");
      }
      return (api.papers.generate as any).responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.papers.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.analytics.dashboard.path] });
    },
  });
}

export function useUpdatePaper() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { generatedContent: string } }) => {
      const url = buildUrl(api.papers.update.path, { id });
      const headers = getHeaders();
      headers["Content-Type"] = "application/json";

      const res = await fetch(url, {
        method: api.papers.update.method,
        headers,
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update paper");
      }
      return (api.papers.update as any).responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.papers.get.path, variables.id] });
    },
  });
}

// Analytics Hook
export function useDashboardStats() {
  return useQuery({
    queryKey: [api.analytics.dashboard.path],
    queryFn: async () => {
      const res = await fetch(api.analytics.dashboard.path, {
        headers: getHeaders(),
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to fetch dashboard stats");
      return (api.analytics.dashboard as any).responses[200].parse(await res.json());
    },
  });
}
