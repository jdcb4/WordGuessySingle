import React from "react";
import ReactDOM from "react-dom/client";
import { Route } from "wouter";
import { AppRouter } from "./lib/router";
import Home from "./pages/home";
import Game from "./pages/game";
import Summary from "./pages/summary";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppRouter>
      <Route path="/" component={Home} />
      <Route path="/game" component={Game} />
      <Route path="/summary" component={Summary} />
    </AppRouter>
  </React.StrictMode>,
);
