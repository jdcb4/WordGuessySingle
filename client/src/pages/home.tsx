import { useState } from "react";
import { useLocation } from "wouter";
import { TeamSetup } from "@/components/team-setup";
import { useGameStore } from "@/lib/use-game-store";
import { Team } from "@shared/schema";
import { InfoDialog } from "@/components/info-dialog";

export default function Home() {
  const [, navigate] = useLocation();
  const initializeGame = useGameStore(state => state.initializeGame);

  const handleStart = (teams: Team[], excludedCategories: string[], turnDuration: number, totalRounds: number) => {
    initializeGame(teams, excludedCategories, turnDuration, totalRounds);
    navigate("/game");
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-background to-primary/5">
      <InfoDialog />
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Word Guessy
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