import { LayoutShell } from "@/components/layout-shell";
import { usePapers } from "@/hooks/use-papers";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, FileText, Calendar, BookOpen } from "lucide-react";

export default function PapersListPage() {
  const { data: papers, isLoading } = usePapers();

  return (
    <LayoutShell>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Generated Papers</h1>
          <p className="text-muted-foreground">Archive of all your generated question papers.</p>
        </div>
        <Link href="/generate">
          <Button>Generate New Paper</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {papers?.map((paper) => (
            <Link key={paper.id} href={`/papers/${paper.id}`}>
              <Card className="card-hover cursor-pointer border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-start justify-between">
                    <span className="text-lg leading-snug">{paper.title}</span>
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mt-2">
                    <div className="flex items-center text-sm text-muted-foreground gap-2">
                      <BookOpen className="w-4 h-4" />
                      <span>{paper.subject}</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(paper.createdAt!).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="pt-2 flex items-center gap-2">
                      <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded">
                        {paper.totalMarks} Marks
                      </span>
                      <span className="text-xs font-medium bg-secondary text-secondary-foreground px-2 py-1 rounded">
                        {paper.durationMinutes} Mins
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          {papers?.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No papers found. Try generating one!
            </div>
          )}
        </div>
      )}
    </LayoutShell>
  );
}
