import { useState } from "react";
import { LayoutShell } from "@/components/layout-shell";
import { useGeneratePaper } from "@/hooks/use-papers";
import { useSubjects } from "@/hooks/use-subjects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, AlertCircle, Plus, Trash2 } from "lucide-react";
import { useLocation } from "wouter";

export default function GeneratePaperPage() {
  const [, setLocation] = useLocation();
  const generate = useGeneratePaper();
  const { data: subjects, isLoading: subjectsLoading } = useSubjects();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    subjectId: "",
    examType: "MID-1&2",
    totalMarks: 100,
    durationMinutes: 180,
    difficulty: {
      Easy: 30,
      Medium: 50,
      Hard: 20
    },
    marksDistribution: [
      { marks: "2m", count: 10 },
      { marks: "5m", count: 8 },
      { marks: "10m", count: 4 }
    ]
  });

  const handleDifficultyChange = (key: keyof typeof formData.difficulty, val: string) => {
    setFormData(prev => ({
      ...prev,
      difficulty: {
        ...prev.difficulty,
        [key]: Number(val)
      }
    }));
  };

  const addMarksRow = () => {
    setFormData(prev => ({
      ...prev,
      marksDistribution: [...prev.marksDistribution, { marks: "15m", count: 1 }]
    }));
  };

  const updateMarksRow = (index: number, field: "marks" | "count", val: string | number) => {
    const newDist = [...formData.marksDistribution];
    newDist[index] = { ...newDist[index], [field]: val };
    setFormData({ ...formData, marksDistribution: newDist });
  };

  const removeMarksRow = (index: number) => {
    const newDist = [...formData.marksDistribution];
    newDist.splice(index, 1);
    setFormData({ ...formData, marksDistribution: newDist });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!formData.subjectId) return alert("Please select a subject.");

    const diffSum = formData.difficulty.Easy + formData.difficulty.Medium + formData.difficulty.Hard;
    if (diffSum !== 100) return alert("Difficulty distribution must sum to 100%.");

    let marksSum = 0;
    const formattedMarksDist: Record<string, number> = {};
    formData.marksDistribution.forEach(row => {
      const markVal = parseInt(row.marks.replace(/[^0-9]/g, ''), 10);
      if (!isNaN(markVal)) {
        marksSum += markVal * row.count;
      }
      formattedMarksDist[row.marks] = row.count;
    });

    if (marksSum !== formData.totalMarks) {
      return alert(`Marks distribution sum (${marksSum}) does not match Total Marks (${formData.totalMarks}).`);
    }

    generate.mutate({
      title: formData.title,
      subjectId: Number(formData.subjectId),
      examType: formData.examType as any,
      totalMarks: Number(formData.totalMarks),
      durationMinutes: Number(formData.durationMinutes),
      difficultyDistribution: formData.difficulty,
      marksDistribution: formattedMarksDist
    }, {
      onSuccess: (data) => {
        setLocation(`/papers/${data.id}`);
      },
      onError: (err: any) => {
        setErrorMessage(err.message || "An error occurred during paper generation.");
      }
    });
  };

  if (subjectsLoading) return <LayoutShell><div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div></LayoutShell>;

  return (
    <LayoutShell>
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-display font-bold">Configure AI Paper Generation</h1>
          <p className="text-muted-foreground">Set the exact parameters for the ML engine to construct the examination.</p>
        </div>

        {errorMessage && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="pt-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-destructive">Generation Failed</p>
                <p className="text-sm text-destructive/80">{errorMessage}</p>
                <Button
                  variant="link"
                  className="p-0 h-auto text-destructive font-bold underline"
                  onClick={() => setErrorMessage(null)}
                >
                  Dismiss
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-border shadow-lg">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Core Details */}
              <div className="grid md:grid-cols-2 gap-6 p-4 bg-muted/20 rounded-xl border border-border/50">
                <div className="col-span-full">
                  <h3 className="font-semibold text-lg border-b pb-2 mb-4">Core Information</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Paper Title (e.g. Mid Term Exam 2026)</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Select value={formData.subjectId} onValueChange={(val) => setFormData({ ...formData, subjectId: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects?.map(sub => (
                        <SelectItem key={sub.id} value={sub.id.toString()}>{sub.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="examType">Exam Type (Determines Syllabus coverage)</Label>
                  <Select value={formData.examType} onValueChange={(val) => setFormData({ ...formData, examType: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Exam Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MID-1&2">MID-1 & 2 (Units 1-2)</SelectItem>
                      <SelectItem value="MID-3&4">MID-3 & 4 (Units 3-4)</SelectItem>
                      <SelectItem value="SEMESTER">SEMESTER (All Units)</SelectItem>
                      <SelectItem value="OTHERS">OTHERS (All Units)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Duration (Minutes)</Label>
                  <Input type="number" min={10} max={300} value={formData.durationMinutes} onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })} />
                </div>
              </div>

              {/* Advanced ML Parameters */}
              <div className="grid md:grid-cols-2 gap-6">

                {/* Difficulty */}
                <div className="p-4 bg-muted/20 rounded-xl border border-border/50 space-y-4">
                  <div className="flex items-center justify-between border-b pb-2 mb-2">
                    <h3 className="font-semibold text-lg">Difficulty Target</h3>
                    <span className={`text-sm font-bold ${(formData.difficulty.Easy + formData.difficulty.Medium + formData.difficulty.Hard) === 100
                      ? "text-green-500"
                      : "text-red-500"
                      }`}>
                      {formData.difficulty.Easy + formData.difficulty.Medium + formData.difficulty.Hard}% Let total
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-green-600 flex justify-between"><span>Easy</span> <span>{formData.difficulty.Easy}%</span></Label>
                      <Slider value={[formData.difficulty.Easy]} min={0} max={100} onValueChange={(v) => handleDifficultyChange("Easy", v[0].toString())} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-amber-600 flex justify-between"><span>Medium</span> <span>{formData.difficulty.Medium}%</span></Label>
                      <Slider value={[formData.difficulty.Medium]} min={0} max={100} onValueChange={(v) => handleDifficultyChange("Medium", v[0].toString())} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-red-600 flex justify-between"><span>Hard</span> <span>{formData.difficulty.Hard}%</span></Label>
                      <Slider value={[formData.difficulty.Hard]} min={0} max={100} onValueChange={(v) => handleDifficultyChange("Hard", v[0].toString())} />
                    </div>
                  </div>
                </div>

                {/* Marks Template */}
                <div className="p-4 bg-muted/20 rounded-xl border border-border/50 space-y-4 flex flex-col">
                  <div className="flex items-center justify-between border-b pb-2 mb-2">
                    <h3 className="font-semibold text-lg">Marks Distribution Template</h3>
                    <div className="text-right">
                      <Label className="text-xs text-muted-foreground block">Total Paper Marks</Label>
                      <Input type="number" className="w-20 inline-block h-7 text-sm ml-2" value={formData.totalMarks} onChange={(e) => setFormData({ ...formData, totalMarks: Number(e.target.value) })} />
                    </div>
                  </div>

                  <div className="flex-1 space-y-3 overflow-y-auto max-h-[250px] pr-2 custom-scrollbar">
                    {formData.marksDistribution.map((row, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input
                          placeholder="Marks (e.g. 5m)"
                          className="w-1/2"
                          value={row.marks}
                          onChange={(e) => updateMarksRow(idx, "marks", e.target.value)}
                        />
                        <span className="text-muted-foreground text-sm">x</span>
                        <Input
                          type="number"
                          min={1}
                          className="w-24"
                          value={row.count}
                          onChange={(e) => updateMarksRow(idx, "count", Number(e.target.value))}
                        />
                        <span className="text-muted-foreground text-sm w-12 truncate block">Q's</span>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeMarksRow(idx)} className="text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Button type="button" variant="outline" size="sm" onClick={addMarksRow} className="w-full mt-auto">
                    <Plus className="w-4 h-4 mr-2" /> Add Marks Row
                  </Button>
                </div>
              </div>

              {/* Action */}
              <Button
                type="submit"
                className="w-full h-14 text-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 rounded-xl font-display mt-8"
                disabled={generate.isPending}
              >
                {generate.isPending ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                    Synthesizing Required Syllabi & Contacting ML Engine...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6 mr-3" />
                    Invoke ML Paper Generation
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </LayoutShell>
  );
}
