import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Online from "@/pages/online";
import Game from "@/pages/game";
import Host from "@/pages/host";
import Client from "@/pages/client";
import Summary from "@/pages/summary";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/local" component={Home} />
      <Route path="/online" component={Online} />
      <Route path="/host" component={Host} />
      <Route path="/client" component={Client} />
      <Route path="/game" component={Game} />
      <Route path="/summary" component={Summary} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;