import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useGameStore } from "@/lib/use-game-store";
import { useWebSocket } from "@/lib/use-websocket";
import { InfoDialog } from "@/components/info-dialog";
import { Label } from "@/components/ui/label";
import { CATEGORIES, Category } from "@shared/schema";
import { CategorySelect } from "@/components/category-select";

export default function Host() {
  const [, navigate] = useLocation();
  const gameState = useGameStore();
  const { connected, sendMessage } = useWebSocket(gameState.gameId);
  const [excludedCategories, setExcludedCategories] = useState<string[]>([]);
  const [turnDuration, setTurnDuration] = useState(30);
  const [totalRounds, setTotalRounds] = useState(3);

  // Redirect if not a host
  useEffect(() => {
    if (!gameState.hostId || !connected) {
      navigate("/online");
    }
  }, [gameState.hostId, connected, navigate]);

  const handleStartGame = () => {
    sendMessage({
      type: 'start_game',
      payload: {
        teams: gameState.teams,
        excludedCategories,
        turnDuration,
        totalRounds
      }
    });

    navigate("/game");
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-background to-primary/5">
      <InfoDialog />
      <div className="max-w-md mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/online")}
          className="mb-6"
        >
          ← Back
        </Button>

        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Game Setup</h1>
          <p className="text-muted-foreground">
            Configure the game settings and start when ready
          </p>
        </div>

        <Card className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Game Code</Label>
              <div className="p-4 bg-primary/5 rounded-lg text-center">
                <p className="text-2xl font-mono font-bold text-primary">{gameState.gameId}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Share this code with other players to join
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Joined Teams</Label>
              <div className="space-y-2">
                {gameState.teams.map(team => (
                  <div
                    key={team.id}
                    className="p-2 bg-primary/5 rounded-lg flex items-center justify-between"
                  >
                    <span>{team.name}</span>
                    {team.isHost && <span className="text-sm text-primary">(Host)</span>}
                  </div>
                ))}
              </div>
            </div>

            <CategorySelect
              excludedCategories={excludedCategories}
              onChange={setExcludedCategories}
            />

            <div className="space-y-2">
              <Label>Turn Duration (seconds)</Label>
              <div className="flex gap-2">
                {[15, 30, 45, 60].map(duration => (
                  <Button
                    key={duration}
                    variant={turnDuration === duration ? "default" : "outline"}
                    onClick={() => setTurnDuration(duration)}
                    className="flex-1"
                  >
                    {duration}s
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Number of Rounds</Label>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map(rounds => (
                  <Button
                    key={rounds}
                    variant={totalRounds === rounds ? "default" : "outline"}
                    onClick={() => setTotalRounds(rounds)}
                    className="flex-1"
                  >
                    {rounds}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <Button
            size="lg"
            className="w-full"
            onClick={handleStartGame}
            disabled={!connected || gameState.teams.length < 2}
          >
            Start Game
          </Button>
        </Card>
      </div>
    </div>
  );
}
