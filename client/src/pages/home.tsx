import { useState } from "react";
import { useLocation } from "wouter";
import { TeamSetup } from "@/components/team-setup";
import { useGameStore } from "@/lib/use-game-store";
import { Team } from "@shared/schema";
import { QuitGameDialog } from "@/components/quit-game-dialog";

export default function Home() {
  const [, navigate] = useLocation();
  const initializeGame = useGameStore(state => state.initializeGame);

  const handleStart = (
    teams: Team[],
    includedCategories: string[],
    turnDuration: number,
    totalRounds: number,
    includedDifficulties: string[]
  ) => {
    initializeGame(teams, includedCategories, turnDuration, totalRounds, includedDifficulties);
    navigate("/game");
  };

  return (
    <div className="app-container">
      <QuitGameDialog />
      
      <div className="content-area">
        <div className="max-w-md mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              WordGuessy
            </h1>
            <p className="text-muted-foreground">
              A fun word guessing game for teams
            </p>
          </div>

          <TeamSetup onStart={handleStart} />
        </div>
      </div>
    </div>
  );
}