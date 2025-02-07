import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { TeamSetup } from "@/components/team-setup";
import { useGameStore } from "@/lib/use-game-store";
import { useWebSocket } from "@/lib/use-websocket";
import { Team } from "@shared/schema";
import { InfoDialog } from "@/components/info-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { nanoid } from "nanoid";

export default function Home() {
  const [, navigate] = useLocation();
  const [gameId, setGameId] = useState<string>(() => nanoid());
  const [joinGameId, setJoinGameId] = useState("");
  const [showJoinInput, setShowJoinInput] = useState(false);
  const initializeGame = useGameStore(state => state.initializeGame);
  const { connected, sendMessage } = useWebSocket(gameId);

  // Handle game creation
  const handleStart = (teams: Team[], excludedCategories: string[], turnDuration: number, totalRounds: number) => {
    // Initialize local game state first
    initializeGame(teams, excludedCategories, turnDuration, totalRounds);

    // Then broadcast to other players
    sendMessage({
      type: 'start_game',
      payload: {
        teams,
        excludedCategories,
        turnDuration,
        totalRounds
      }
    });

    navigate("/game");
  };

  // Handle game joining
  const handleJoinGame = () => {
    if (joinGameId) {
      setGameId(joinGameId);
      navigate("/game");
    }
  };

  // Generate shareable link
  const getShareableLink = () => {
    return `${window.location.origin}?game=${gameId}`;
  };

  // Check URL for game ID
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gameIdFromUrl = params.get('game');
    if (gameIdFromUrl) {
      setGameId(gameIdFromUrl);
      navigate("/game");
    }
  }, []);

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

        {!showJoinInput ? (
          <div className="space-y-4">
            <TeamSetup onStart={handleStart} />
            <div className="text-center">
              <Button
                variant="link"
                onClick={() => setShowJoinInput(true)}
              >
                Join Existing Game
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              placeholder="Enter game code"
              value={joinGameId}
              onChange={(e) => setJoinGameId(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={handleJoinGame}
                disabled={!joinGameId}
              >
                Join Game
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowJoinInput(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {connected && !showJoinInput && (
          <div className="mt-4 p-4 bg-primary/5 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Share this link with friends to join your game:</p>
            <Input
              readOnly
              value={getShareableLink()}
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
          </div>
        )}
      </div>
    </div>
  );
}