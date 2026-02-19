import { useState } from "react";
import { LayoutShell } from "@/components/layout-shell";
import { useGeneratePaper } from "@/hooks/use-papers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Loader2, Sparkles, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";

export default function GeneratePaperPage() {
  const [, setLocation] = useLocation();
  const generate = useGeneratePaper();
  
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    totalMarks: 100,
    difficulty: {
      easy: 30,
      medium: 50,
      hard: 20
    }
  });

  const handleDifficultyChange = (val: number[]) => {
    // This is a simplified handler. In a real app, you'd want a 3-way slider or specific logic
    // to ensure they sum to 100. For now, we'll just let the user set Easy/Medium and calc Hard.
    // This example uses a single slider to adjust Easy vs Hard ratio with Medium fixed? No, let's just do individual inputs for precision.
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sum = formData.difficulty.easy + formData.difficulty.medium + formData.difficulty.hard;
    if (sum !== 100) {
      alert("Difficulty distribution must sum to 100%");
      return;
    }

    generate.mutate({
      title: formData.title,
      subject: formData.subject,
      totalMarks: Number(formData.totalMarks),
      difficultyDistribution: {
        Easy: formData.difficulty.easy,
        Medium: formData.difficulty.medium,
        Hard: formData.difficulty.hard,
      },
      topics: [] // Optional
    }, {
      onSuccess: (data) => {
        setLocation(`/papers/${data.id}`);
      }
    });
  };

  return (
    <LayoutShell>
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-display font-bold">Generate New Paper</h1>
          <p className="text-muted-foreground">Configure the parameters for your automated question paper.</p>
        </div>

        <Card className="border-border shadow-md">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Paper Title</Label>
                  <Input 
                    id="title" 
                    placeholder="Mid-Term Examination 2024"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input 
                    id="subject" 
                    placeholder="e.g. Physics"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Total Marks: {formData.totalMarks}</Label>
                <Slider 
                  value={[formData.totalMarks]} 
                  onValueChange={(val) => setFormData({...formData, totalMarks: val[0]})}
                  min={10} 
                  max={200} 
                  step={5} 
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Difficulty Distribution (%)</Label>
                  <span className={`text-sm ${
                    (formData.difficulty.easy + formData.difficulty.medium + formData.difficulty.hard) === 100 
                    ? "text-green-500" 
                    : "text-red-500 font-bold"
                  }`}>
                    Total: {formData.difficulty.easy + formData.difficulty.medium + formData.difficulty.hard}%
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-green-600">Easy</Label>
                    <Input 
                      type="number" 
                      value={formData.difficulty.easy}
                      onChange={(e) => setFormData({
                        ...formData, 
                        difficulty: {...formData.difficulty, easy: Number(e.target.value)}
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-amber-600">Medium</Label>
                    <Input 
                      type="number" 
                      value={formData.difficulty.medium}
                      onChange={(e) => setFormData({
                        ...formData, 
                        difficulty: {...formData.difficulty, medium: Number(e.target.value)}
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-red-600">Hard</Label>
                    <Input 
                      type="number" 
                      value={formData.difficulty.hard}
                      onChange={(e) => setFormData({
                        ...formData, 
                        difficulty: {...formData.difficulty, hard: Number(e.target.value)}
                      })}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <AlertCircle className="w-3 h-3" />
                  Ensure the distribution adds up to exactly 100%.
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-lg bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg shadow-primary/25"
                disabled={generate.isPending}
              >
                {generate.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Paper
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
