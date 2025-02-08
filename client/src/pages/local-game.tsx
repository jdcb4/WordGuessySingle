import { TeamSetup } from "@/components/team-setup";
import { useLocation } from "wouter";
import { useGameStore } from "@/lib/use-game-store";
import { Team } from "@shared/schema";

export default function LocalGame() {
  const [, navigate] = useLocation();
  const initializeGame = useGameStore(state => state.initializeGame);

  const handleStart = (teams: Team[], excludedCategories: string[], turnDuration: number, totalRounds: number) => {
    initializeGame(teams, excludedCategories, turnDuration, totalRounds);
    navigate("/game");
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-background to-primary/5">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-primary">
            Local Game Setup
          </h2>
          <p className="text-muted-foreground">
            Configure your game settings
          </p>
        </div>

        <TeamSetup onStart={handleStart} />
      </div>
    </div>
  );
}
