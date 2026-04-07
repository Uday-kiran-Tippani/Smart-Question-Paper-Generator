import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

import AuthPage from "@/pages/auth";
import DashboardPage from "@/pages/dashboard";
import SubjectsPage from "@/pages/subjects";
import GeneratePaperPage from "@/pages/generate-paper";
import PaperDetailPage from "@/pages/paper-detail";
import PapersListPage from "@/pages/papers-list";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    setLocation("/auth");
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/" component={() => <ProtectedRoute component={DashboardPage} />} />
      <Route path="/subjects" component={() => <ProtectedRoute component={SubjectsPage} />} />
      <Route path="/generate" component={() => <ProtectedRoute component={GeneratePaperPage} />} />
      <Route path="/papers" component={() => <ProtectedRoute component={PapersListPage} />} />
      <Route path="/papers/:id" component={PaperDetailPage} /> {/* ProtectedRoute wrapped inside details component logic or here? Let's leave it protected by sidebar shell logic mostly, but explicitly: */}
      {/* For papers/:id, let's just let the page handle loading state or auth redirect if usePaper fails due to 401 */}

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
