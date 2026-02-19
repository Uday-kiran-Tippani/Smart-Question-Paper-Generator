import { useState } from "react";
import { LayoutShell } from "@/components/layout-shell";
import { useQuestions, useCreateQuestion, useDeleteQuestion } from "@/hooks/use-questions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Search, Filter, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertQuestionSchema } from "@shared/schema";
import { z } from "zod";

export default function QuestionsPage() {
  const [filters, setFilters] = useState({ search: "", subject: "All", difficulty: "All" });
  const { data: questions, isLoading } = useQuestions({
    search: filters.search || undefined,
    subject: filters.subject === "All" ? undefined : filters.subject,
    difficulty: filters.difficulty === "All" ? undefined : filters.difficulty as any,
  });
  const deleteQuestion = useDeleteQuestion();

  return (
    <LayoutShell>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Question Bank</h1>
          <p className="text-muted-foreground">Manage and organize your repository of questions.</p>
        </div>
        <AddQuestionDialog />
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search question content..." 
            className="pl-9"
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
        </div>
        <Select 
          value={filters.subject} 
          onValueChange={(val) => setFilters(prev => ({ ...prev, subject: val }))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Subjects</SelectItem>
            <SelectItem value="Physics">Physics</SelectItem>
            <SelectItem value="Chemistry">Chemistry</SelectItem>
            <SelectItem value="Math">Math</SelectItem>
            <SelectItem value="Biology">Biology</SelectItem>
            <SelectItem value="History">History</SelectItem>
          </SelectContent>
        </Select>
        <Select 
          value={filters.difficulty} 
          onValueChange={(val) => setFilters(prev => ({ ...prev, difficulty: val }))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Levels</SelectItem>
            <SelectItem value="Easy">Easy</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Hard">Hard</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-[400px]">Question</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Marks</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
                </TableCell>
              </TableRow>
            ) : questions?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No questions found. Add one to get started!
                </TableCell>
              </TableRow>
            ) : (
              questions?.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="font-medium line-clamp-2 max-w-[400px]" title={q.content}>
                    {q.content.length > 80 ? q.content.substring(0, 80) + "..." : q.content}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200">
                      {q.subject}
                    </Badge>
                  </TableCell>
                  <TableCell>{q.type}</TableCell>
                  <TableCell>
                    <Badge className={`
                      ${q.difficulty === 'Easy' ? 'bg-green-100 text-green-700 hover:bg-green-100 border-green-200' : ''}
                      ${q.difficulty === 'Medium' ? 'bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200' : ''}
                      ${q.difficulty === 'Hard' ? 'bg-red-100 text-red-700 hover:bg-red-100 border-red-200' : ''}
                    `} variant="outline">
                      {q.difficulty}
                    </Badge>
                  </TableCell>
                  <TableCell>{q.marks}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => deleteQuestion.mutate(q.id)}
                      disabled={deleteQuestion.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </LayoutShell>
  );
}

function AddQuestionDialog() {
  const [open, setOpen] = useState(false);
  const createQuestion = useCreateQuestion();
  
  const form = useForm<z.infer<typeof insertQuestionSchema>>({
    resolver: zodResolver(insertQuestionSchema),
    defaultValues: {
      type: "Short",
      difficulty: "Medium",
      marks: 5,
      subject: "Physics", // Default to reduce clicks
      topic: "General"
    }
  });

  const onSubmit = (data: z.infer<typeof insertQuestionSchema>) => {
    createQuestion.mutate(data, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4 mr-2" />
          Add Question
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Question</DialogTitle>
          <DialogDescription>
            Create a question to add to the bank. Be specific with topics for better generation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" {...form.register("subject")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <Input id="topic" {...form.register("topic")} placeholder="e.g. Thermodynamics" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Question Content</Label>
            <textarea 
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              id="content" 
              placeholder="Type your question here..."
              {...form.register("content")} 
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select 
                onValueChange={(val) => form.setValue("type", val as any)} 
                defaultValue={form.getValues("type")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MCQ">MCQ</SelectItem>
                  <SelectItem value="Short">Short Answer</SelectItem>
                  <SelectItem value="Long">Long Answer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select 
                onValueChange={(val) => form.setValue("difficulty", val as any)} 
                defaultValue={form.getValues("difficulty")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="marks">Marks</Label>
              <Input type="number" id="marks" {...form.register("marks", { valueAsNumber: true })} />
            </div>
          </div>

          <div className="space-y-2">
             <Label htmlFor="taxonomy">Bloom's Taxonomy</Label>
             <Input id="taxonomy" {...form.register("bloomsTaxonomy")} placeholder="e.g. Analysis, Application" />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={createQuestion.isPending}>
              {createQuestion.isPending ? "Adding..." : "Add Question"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
