import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useGameStore } from "@/lib/use-game-store";
import { useWebSocket } from "@/lib/use-websocket";
import { nanoid } from "nanoid";

export default function Online() {
  const [, navigate] = useLocation();
  const [isJoining, setIsJoining] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [gameCode, setGameCode] = useState("");
  const [hostGameId] = useState(() => nanoid());
  const initializeGame = useGameStore(state => state.initializeGame);
  const { connected, sendMessage } = useWebSocket(isJoining ? gameCode : hostGameId);

  // Handle hosting a new game
  const handleHost = () => {
    if (!teamName) return;
    
    initializeGame([{ id: 1, name: teamName, score: 0, roundScores: [], isHost: true }], [], 30, 3, 'online');
    navigate("/host");
  };

  // Handle joining an existing game
  const handleJoin = () => {
    if (!teamName || !gameCode) return;

    sendMessage({
      type: 'join_game',
      payload: {
        gameId: gameCode,
        teamName
      }
    });

    navigate("/client");
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-background to-primary/5">
      <div className="max-w-md mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          ← Back
        </Button>

        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Play Online</h1>
          <p className="text-muted-foreground">
            Host a new game or join an existing one
          </p>
        </div>

        {!isJoining ? (
          <Card className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Your Team Name</Label>
                <Input
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Enter your team name"
                />
              </div>

              <div className="space-y-4">
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleHost}
                  disabled={!teamName || !connected}
                >
                  Host New Game
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsJoining(true)}
                >
                  Join Existing Game
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Your Team Name</Label>
                <Input
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Enter your team name"
                />
              </div>

              <div className="space-y-2">
                <Label>Game Code</Label>
                <Input
                  value={gameCode}
                  onChange={(e) => setGameCode(e.target.value)}
                  placeholder="Enter game code"
                />
              </div>

              <div className="space-y-4">
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleJoin}
                  disabled={!teamName || !gameCode || !connected}
                >
                  Join Game
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsJoining(false)}
                >
                  Back
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
