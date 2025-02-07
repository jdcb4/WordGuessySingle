import { useState } from "react";
import { useLocation } from "wouter";
import { TeamSetup } from "@/components/team-setup";
import { useGameStore } from "@/lib/use-game-store";
import { Team } from "@shared/schema";

export default function Home() {
  const [, navigate] = useLocation();
  const initializeGame = useGameStore(state => state.initializeGame);

  const handleStart = (teams: Team[], excludedCategories: string[], turnDuration: number) => {
    initializeGame(teams, excludedCategories, turnDuration);
    navigate("/game");
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-background to-primary/5">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Word Party
          </h1>
          <p className="text-muted-foreground">
            A fun word guessing game for teams
          </p>
        </div>

        <TeamSetup onStart={handleStart} />
      </div>
    </div>
  );
}