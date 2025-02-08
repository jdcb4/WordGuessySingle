import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Home from "@/pages/home";
import LocalGame from "@/pages/local-game";
import OnlineGame from "@/pages/online-game";
import Game from "@/pages/game";
import Summary from "@/pages/summary";
import NotFound from "@/pages/not-found";
import HostGame from "@/pages/host-game";
import JoinGame from "@/pages/join-game";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/local-game" component={LocalGame} />
      <Route path="/online-game" component={OnlineGame} />
      <Route path="/host-game" component={HostGame} />
      <Route path="/join-game" component={JoinGame} />
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