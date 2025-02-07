import { useEffect } from "react";
import { useLocation } from "wouter";
import { useGameStore } from "@/lib/use-game-store";
import { useWebSocket } from "@/lib/use-websocket";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { InfoDialog } from "@/components/info-dialog";

export default function Client() {
  const [, navigate] = useLocation();
  const gameState = useGameStore();
  const { connected } = useWebSocket(gameState.gameId);

  // Redirect to game when it starts
  useEffect(() => {
    if (gameState.isGameStarted) {
      navigate("/game");
    }
  }, [gameState.isGameStarted, navigate]);

  // Redirect if not connected
  useEffect(() => {
    if (!connected) {
      navigate("/online");
    }
  }, [connected, navigate]);

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
          <h1 className="text-4xl font-bold">Waiting for Game</h1>
          <p className="text-muted-foreground">
            The host will start the game when all players have joined
          </p>
        </div>

        <Card className="p-6 space-y-6">
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-lg font-medium">Connected Teams</h2>
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
          </div>
        </Card>
      </div>
    </div>
  );
}
