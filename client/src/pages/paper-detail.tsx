import { LayoutShell } from "@/components/layout-shell";
import { usePaper } from "@/hooks/use-papers";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Download, Printer, FileText } from "lucide-react";
import { useRef } from "react";

export default function PaperDetailPage() {
  const [, params] = useRoute("/papers/:id");
  const { data: paper, isLoading } = usePaper(Number(params?.id));
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
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

  // Group questions by section (Type)
  const sections = {
    A: paper.questions.filter(q => q.type === 'MCQ'),
    B: paper.questions.filter(q => q.type === 'Short'),
    C: paper.questions.filter(q => q.type === 'Long'),
  };

  return (
    <LayoutShell>
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-2xl font-bold font-display">{paper.title}</h1>
          <p className="text-muted-foreground">Generated on {new Date(paper.createdAt!).toLocaleDateString()}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button className="bg-primary">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      <div className="mt-8 bg-white p-8 md:p-12 shadow-sm border border-border/50 max-w-4xl mx-auto min-h-[800px]" ref={printRef}>
        {/* Paper Header */}
        <div className="text-center mb-8 border-b-2 border-black pb-4">
          <h2 className="text-xl font-bold uppercase tracking-wider">{paper.title}</h2>
          <div className="flex justify-between mt-4 font-medium">
            <span>Subject: {paper.subject}</span>
            <span>Duration: {paper.durationMinutes} Minutes</span>
            <span>Max Marks: {paper.totalMarks}</span>
          </div>
        </div>

        <div className="space-y-8">
          {sections.A.length > 0 && (
            <div>
              <h3 className="font-bold text-lg mb-4 bg-gray-100 p-2 uppercase">Section A: Multiple Choice Questions</h3>
              <div className="space-y-6">
                {sections.A.map((q, idx) => (
                  <div key={q.id}>
                    <div className="flex justify-between gap-4">
                      <p className="text-base"><span className="font-bold mr-2">{idx + 1}.</span> {q.content}</p>
                      <span className="text-sm font-semibold shrink-0">[{q.marks}]</span>
                    </div>
                    {/* Render Options if available */}
                    {/* Simplified for display */}
                    <div className="ml-6 mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2"><div className="w-4 h-4 border rounded-full"></div> Option A</div>
                      <div className="flex items-center gap-2"><div className="w-4 h-4 border rounded-full"></div> Option B</div>
                      <div className="flex items-center gap-2"><div className="w-4 h-4 border rounded-full"></div> Option C</div>
                      <div className="flex items-center gap-2"><div className="w-4 h-4 border rounded-full"></div> Option D</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sections.B.length > 0 && (
            <div>
              <h3 className="font-bold text-lg mb-4 bg-gray-100 p-2 uppercase">Section B: Short Answer Questions</h3>
              <div className="space-y-6">
                {sections.B.map((q, idx) => (
                  <div key={q.id} className="flex justify-between gap-4">
                    <p className="text-base">
                      <span className="font-bold mr-2">{sections.A.length + idx + 1}.</span> 
                      {q.content}
                    </p>
                    <span className="text-sm font-semibold shrink-0">[{q.marks}]</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sections.C.length > 0 && (
            <div>
              <h3 className="font-bold text-lg mb-4 bg-gray-100 p-2 uppercase">Section C: Long Answer Questions</h3>
              <div className="space-y-8">
                {sections.C.map((q, idx) => (
                  <div key={q.id} className="flex justify-between gap-4">
                    <p className="text-base">
                      <span className="font-bold mr-2">{sections.A.length + sections.B.length + idx + 1}.</span> 
                      {q.content}
                    </p>
                    <span className="text-sm font-semibold shrink-0">[{q.marks}]</span>
                  </div>
                ))}
              </div>
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
