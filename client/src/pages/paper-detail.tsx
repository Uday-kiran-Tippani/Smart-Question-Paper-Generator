import { LayoutShell } from "@/components/layout-shell";
import { usePaper, useUpdatePaper } from "@/hooks/use-papers";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Download, Printer, FileText, Edit2, Save } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function PaperDetailPage() {
  const [, params] = useRoute("/papers/:id");
  const { data: paper, isLoading } = usePaper(Number(params?.id));
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const updatePaper = useUpdatePaper();

  useEffect(() => {
    if (paper?.generatedContent) {
      setEditedContent(paper.generatedContent);
    }
  }, [paper?.generatedContent]);

  const handleSave = async () => {
    try {
      await updatePaper.mutateAsync({
        id: paper.id,
        data: { generatedContent: editedContent }
      });
      setIsEditing(false);
      toast({ title: "Success", description: "Paper updated successfully." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    window.open(`/api/papers/${paper.id}/export/pdf`, '_blank');
  };

  if (isLoading || !paper) {
    return (
      <LayoutShell>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </LayoutShell>
    );
  }

  // Group questions by section (Difficulty)
  const sections = {
    A: paper.questions.filter((q: any) => q.difficulty === 'Easy'),
    B: paper.questions.filter((q: any) => q.difficulty === 'Medium'),
    C: paper.questions.filter((q: any) => q.difficulty === 'Hard'),
  };

  return (
    <LayoutShell>
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-2xl font-bold font-display">{paper.title}</h1>
          <p className="text-muted-foreground">Generated on {new Date(paper.createdAt!).toLocaleDateString()}</p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleSave} disabled={updatePaper.isPending}>
              {updatePaper.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Paper
            </Button>
          )}
          <Button variant="outline" onClick={handlePrint} disabled={isEditing}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button className="bg-primary" onClick={handleDownload} disabled={isEditing}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      <div className="mt-8 bg-white p-8 md:p-12 shadow-sm border border-border/50 max-w-4xl mx-auto min-h-[800px]" ref={printRef}>
        {/* Paper Header (Hide if we are showing generated raw text that has its own header) */}
        {paper.questions?.length > 0 && (
          <div className="text-center mb-8 border-b-2 border-black pb-4">
            <h2 className="text-xl font-bold uppercase tracking-wider">{paper.title}</h2>
            <div className="flex justify-between mt-4 font-medium">
              <span>Subject: {paper.subject?.name || paper.subject}</span>
              <span>Duration: {paper.durationMinutes} Minutes</span>
              <span>Max Marks: {paper.totalMarks}</span>
            </div>
          </div>
        )}

        <div className="space-y-8">
          {paper.generatedContent ? (
            isEditing ? (
              <textarea
                className="w-full min-h-[600px] p-4 font-mono text-sm leading-relaxed border rounded focus:ring-2 focus:ring-primary focus:outline-none resize-y"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
              />
            ) : (
              <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                {paper.generatedContent}
              </div>
            )
          ) : paper.questions?.length > 0 ? (
            <>
              {sections.A.length > 0 && (
                <div>
                  <h3 className="font-bold text-lg mb-4 bg-gray-100 p-2 uppercase">Section A: Easy Questions</h3>
                  <div className="space-y-6">
                    {sections.A.map((q: any, idx: number) => (
                      <div key={q.id}>
                        <div className="flex justify-between gap-4">
                          <p className="text-base"><span className="font-bold mr-2">{idx + 1}.</span> {q.questionText}</p>
                          <span className="text-sm font-semibold shrink-0">[{q.marks}M]</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {sections.B.length > 0 && (
                <div>
                  <h3 className="font-bold text-lg mb-4 bg-gray-100 p-2 uppercase">Section B: Medium Questions</h3>
                  <div className="space-y-6">
                    {sections.B.map((q: any, idx: number) => (
                      <div key={q.id} className="flex justify-between gap-4">
                        <p className="text-base">
                          <span className="font-bold mr-2">{sections.A.length + idx + 1}.</span>
                          {q.questionText}
                        </p>
                        <span className="text-sm font-semibold shrink-0">[{q.marks}M]</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {sections.C.length > 0 && (
                <div>
                  <h3 className="font-bold text-lg mb-4 bg-gray-100 p-2 uppercase">Section C: Hard Questions</h3>
                  <div className="space-y-8">
                    {sections.C.map((q: any, idx: number) => (
                      <div key={q.id} className="flex justify-between gap-4">
                        <p className="text-base">
                          <span className="font-bold mr-2">{sections.A.length + sections.B.length + idx + 1}.</span>
                          {q.questionText}
                        </p>
                        <span className="text-sm font-semibold shrink-0">[{q.marks}M]</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
             <div className="text-center py-20 text-gray-500">
               No content generated for this paper.
             </div>
          )}
        </div>

        <div className="mt-12 pt-4 border-t border-black text-center text-sm text-gray-500">
          *** End of Paper ***
        </div>
      </div>
    </LayoutShell>
  );
}
