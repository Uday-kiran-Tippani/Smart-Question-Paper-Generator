import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { InsertGeneratedQuestion, GeneratedQuestion } from "@shared/schema";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = { "Accept": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
};

export function useQuestions(filters?: {
  subject?: string;
  topic?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  type?: 'MCQ' | 'Short' | 'Long';
  search?: string;
}) {
  return useQuery({
    queryKey: ["/api/questions", filters],
    queryFn: async () => {
      const url = new URL("/api/questions", window.location.origin);
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) url.searchParams.append(key, value);
        });
      }

      const res = await fetch(url.toString(), {
        headers: getHeaders(),
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to fetch questions");
      return await res.json();
    },
  });
}

export function useCreateQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertGeneratedQuestion) => {
      const headers = getHeaders();
      headers["Content-Type"] = "application/json";

      const res = await fetch("/api/questions", {
        method: "POST",
        headers,
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create question");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      queryClient.invalidateQueries({ queryKey: [api.analytics.dashboard.path] });
    },
  });
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/questions/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to delete question");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      queryClient.invalidateQueries({ queryKey: [api.analytics.dashboard.path] });
    },
  });
}

export function useBulkCreateQuestions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertGeneratedQuestion[]) => {
      const headers = getHeaders();
      headers["Content-Type"] = "application/json";

      const res = await fetch("/api/questions/bulk", {
        method: "POST",
        headers,
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to bulk upload questions");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      queryClient.invalidateQueries({ queryKey: [api.analytics.dashboard.path] });
    },
  });
}
