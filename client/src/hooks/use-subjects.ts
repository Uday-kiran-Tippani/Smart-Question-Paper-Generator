import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Subject, Unit, InsertSubject, InsertUnit } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useSubjects() {
    return useQuery<Subject[]>({
        queryKey: ["/api/subjects"],
        queryFn: async () => {
            const res = await apiRequest("GET", "/api/subjects");
            return res.json();
        }
    });
}

export function useUnits(subjectId: number | null) {
    return useQuery<Unit[]>({
        queryKey: [`/api/subjects/${subjectId}/units`],
        queryFn: async () => {
            const res = await apiRequest("GET", `/api/subjects/${subjectId}/units`);
            return res.json();
        },
        enabled: !!subjectId,
    });
}

export function useCreateSubject() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async (data: InsertSubject) => {
            const res = await apiRequest("POST", "/api/subjects", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
            toast({ title: "Subject created successfully" });
        },
        onError: (error: Error) => {
            toast({
                title: "Failed to create subject",
                description: error.message,
                variant: "destructive",
            });
        },
    });
}

export function useCreateUnit() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async ({ subjectId, data }: { subjectId: number; data: Omit<InsertUnit, "subjectId"> }) => {
            const res = await apiRequest("POST", `/api/subjects/${subjectId}/units`, data);
            return res.json();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: [`/api/subjects/${variables.subjectId}/units`] });
            toast({ title: "Unit created successfully" });
        },
        onError: (error: Error) => {
            toast({
                title: "Failed to create unit",
                description: error.message,
                variant: "destructive",
            });
        },
    });
}
export function useUpdateSubject() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<InsertSubject> }) => {
            const res = await apiRequest("PATCH", `/api/subjects/${id}`, data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
            toast({ title: "Subject updated successfully" });
        },
        onError: (error: Error) => {
            toast({
                title: "Failed to update subject",
                description: error.message,
                variant: "destructive",
            });
        },
    });
}

export function useDeleteSubject() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/subjects/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
            toast({ title: "Subject deleted successfully" });
        },
        onError: (error: Error) => {
            toast({
                title: "Failed to delete subject",
                description: error.message,
                variant: "destructive",
            });
        },
    });
}

export function useUpdateUnit() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async ({ subjectId, unitId, data }: { subjectId: number; unitId: number; data: Partial<InsertUnit> }) => {
            const res = await apiRequest("PATCH", `/api/subjects/${subjectId}/units/${unitId}`, data);
            return res.json();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: [`/api/subjects/${variables.subjectId}/units`] });
            toast({ title: "Unit updated successfully" });
        },
        onError: (error: Error) => {
            toast({
                title: "Failed to update unit",
                description: error.message,
                variant: "destructive",
            });
        },
    });
}

export function useDeleteUnit() {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async ({ subjectId, unitId }: { subjectId: number; unitId: number }) => {
            await apiRequest("DELETE", `/api/subjects/${subjectId}/units/${unitId}`);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: [`/api/subjects/${variables.subjectId}/units`] });
            toast({ title: "Unit deleted successfully" });
        },
        onError: (error: Error) => {
            toast({
                title: "Failed to delete unit",
                description: error.message,
                variant: "destructive",
            });
        },
    });
}
