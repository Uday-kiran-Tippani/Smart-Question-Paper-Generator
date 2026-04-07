import { useState } from "react";
import { LayoutShell } from "@/components/layout-shell";
import { useSubjects, useCreateSubject, useUnits, useCreateUnit } from "@/hooks/use-subjects";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, ArrowLeft, Pencil, Trash2, MoreVertical } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSubjectSchema, insertUnitSchema } from "@shared/schema";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useUpdateSubject, useDeleteSubject, useUpdateUnit, useDeleteUnit } from "@/hooks/use-subjects";

export default function SubjectsPage() {
    const { data: subjects, isLoading } = useSubjects();
    const [selectedSubject, setSelectedSubject] = useState<number | null>(null);

    if (isLoading) {
        return (
            <LayoutShell>
                <div className="flex h-[60vh] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </LayoutShell>
        );
    }

    return (
        <LayoutShell>
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-display text-3xl font-bold">Subjects & Syllabus</h1>
                        <p className="text-muted-foreground">Manage subjects and course syllabus content for AI paper generation.</p>
                    </div>
                </div>

                {selectedSubject ? (
                    <UnitManager subjectId={selectedSubject} onBack={() => setSelectedSubject(null)} />
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <CreateSubjectCard />
                        {subjects?.map((sub) => (
                            <SubjectCard key={sub.id} subject={sub} onSelect={() => setSelectedSubject(sub.id)} />
                        ))}
                    </div>
                )}
            </div>
        </LayoutShell>
    );
}

function SubjectCard({ subject, onSelect }: { subject: any, onSelect: () => void }) {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isRenameOpen, setIsRenameOpen] = useState(false);
    const [newName, setNewName] = useState(subject.name);
    const deleteSubject = useDeleteSubject();
    const updateSubject = useUpdateSubject();

    return (
        <>
            <Card
                className="group relative transition-shadow hover:shadow-md hover:border-primary/50"
            >
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                    <CardTitle className="text-xl cursor-pointer" onClick={onSelect}>{subject.name}</CardTitle>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setIsRenameOpen(true)}>
                                <Pencil className="mr-2 h-4 w-4" /> Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardHeader>
                <CardContent>
                    <Button variant="outline" className="w-full" onClick={onSelect}>Manage Syllabus Units</Button>
                </CardContent>
            </Card>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the subject "{subject.name}" and all its syllabus units.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteSubject.mutate(subject.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Rename Subject</AlertDialogTitle>
                    </AlertDialogHeader>
                    <div className="py-4">
                        <Label htmlFor="newName">New Subject Name</Label>
                        <Input
                            id="newName"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="mt-2"
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setNewName(subject.name)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => updateSubject.mutate({ id: subject.id, data: { name: newName } })}
                        >
                            Rename
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

function CreateSubjectCard() {
    const createSubject = useCreateSubject();
    const form = useForm<z.infer<typeof insertSubjectSchema>>({
        resolver: zodResolver(insertSubjectSchema),
    });

    return (
        <Card className="border-dashed border-2 bg-muted/20">
            <form onSubmit={form.handleSubmit((d) => createSubject.mutate(d, { onSuccess: () => form.reset() }))}>
                <CardHeader>
                    <CardTitle className="text-lg">Add New Subject</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Subject Name</Label>
                        <Input placeholder="e.g. Operating Systems" {...form.register("name")} />
                    </div>
                    <Button type="submit" disabled={createSubject.isPending} className="w-full">
                        {createSubject.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                        Add Subject
                    </Button>
                </CardContent>
            </form>
        </Card>
    );
}

function UnitCard({ unit, subjectId }: { unit: any; subjectId: number }) {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const deleteUnit = useDeleteUnit();

    return (
        <>
            <Card className="group">
                <CardHeader className="py-3 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-md">Unit {unit.unitNumber}: {unit.title}</CardTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setIsDeleteDialogOpen(true)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">{unit.syllabusContent}</p>
                </CardContent>
            </Card>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Unit?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete Unit {unit.unitNumber}: {unit.title}?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteUnit.mutate({ subjectId, unitId: unit.id })}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

function UnitManager({ subjectId, onBack }: { subjectId: number; onBack: () => void }) {
    const { data: units, isLoading } = useUnits(subjectId);
    const createUnit = useCreateUnit();

    // Assuming subjectId is included in path, we omit it from form defaults
    const form = useForm<Omit<z.infer<typeof insertUnitSchema>, "subjectId">>({
        resolver: zodResolver(insertUnitSchema.omit({ subjectId: true })),
    });

    const onSubmit = (data: any) => {
        createUnit.mutate({ subjectId, data }, { onSuccess: () => form.reset() });
    };

    return (
        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
            <Button variant="ghost" onClick={onBack} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Subjects
            </Button>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Unit List */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold">Existing Syllabus Units</h2>
                    {isLoading ? (
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    ) : units?.length === 0 ? (
                        <p className="text-muted-foreground">No units added yet. Add syllabus content to generate papers.</p>
                    ) : (
                        units?.map((u) => (
                            <UnitCard key={u.id} unit={u} subjectId={subjectId} />
                        ))
                    )}
                </div>

                {/* Add Unit Form */}
                <Card>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardHeader>
                            <CardTitle>Add New Unit</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Unit Number</Label>
                                <Input type="number" min={1} max={10} {...form.register("unitNumber", { valueAsNumber: true })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Unit Title</Label>
                                <Input placeholder="e.g. Memory Management" {...form.register("title")} />
                            </div>
                            <div className="space-y-2">
                                <Label>Syllabus Content</Label>
                                <Textarea
                                    placeholder="Paste topics covered in this unit... (Used by AI as context for generating questions)"
                                    className="min-h-[150px]"
                                    {...form.register("syllabusContent")}
                                />
                            </div>
                            <Button type="submit" disabled={createUnit.isPending} className="w-full">
                                {createUnit.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                                Add Unit
                            </Button>
                        </CardContent>
                    </form>
                </Card>
            </div>
        </div>
    );
}
