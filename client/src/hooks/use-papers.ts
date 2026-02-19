import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { GeneratePaperRequest, GeneratedPaper, Question } from "@shared/schema";

export function usePapers() {
  return useQuery({
    queryKey: [api.papers.list.path],
    queryFn: async () => {
      const res = await fetch(api.papers.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch papers");
      return api.papers.list.responses[200].parse(await res.json());
    },
  });
}

export function usePaper(id: number) {
  return useQuery({
    queryKey: [api.papers.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.papers.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch paper");
      return api.papers.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useGeneratePaper() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: GeneratePaperRequest) => {
      const res = await fetch(api.papers.generate.path, {
        method: api.papers.generate.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to generate paper");
      }
      return api.papers.generate.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.papers.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.analytics.dashboard.path] });
    },
  });
}

// Analytics Hook
export function useDashboardStats() {
  return useQuery({
    queryKey: [api.analytics.dashboard.path],
    queryFn: async () => {
      const res = await fetch(api.analytics.dashboard.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch dashboard stats");
      return api.analytics.dashboard.responses[200].parse(await res.json());
    },
  });
}
