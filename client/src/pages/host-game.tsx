import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { CategorySelect } from "@/components/category-select";
import { TURN_DURATIONS, ROUND_OPTIONS, Team } from "@shared/schema";
import { useWebSocket } from "@/lib/use-websocket";
import { useToast } from "@/hooks/use-toast";

export default function HostGame() {
  const [, navigate] = useLocation();
  const [teamName, setTeamName] = useState("");
  const [excludedCategories, setExcludedCategories] = useState<string[]>([]);
  const [turnDuration, setTurnDuration] = useState<number>(30); // Default to 30 seconds
  const [totalRounds, setTotalRounds] = useState(3); // Default to 3 rounds
  const [isWaitingRoom, setIsWaitingRoom] = useState(false);
  const [gameCode, setGameCode] = useState("");
  const [joinedTeams, setJoinedTeams] = useState<Team[]>([]);
  const ws = useWebSocket();
  const { toast } = useToast();

  useEffect(() => {
    ws.connect();

    ws.on('game_created', (data) => {
      setGameCode(data.code);
      setIsWaitingRoom(true);
    });

    ws.on('teams_updated', (data) => {
      setJoinedTeams(data.teams);
    });

    ws.on('error', (data) => {
      toast({
        title: "Error",
        description: data.message,
        variant: "destructive"
      });
    });

    return () => {
      ws.socket?.close();
    };
  }, [ws]);

  const handleCreateGame = () => {
    if (!teamName) return;

    const initialState = {
      teams: [{
        id: 1,
        name: teamName,
        score: 0,
        roundScores: []
      }],
      currentRound: 1,
      totalRounds,
      currentTeamIndex: 0,
      excludedCategories,
      isGameStarted: false,
      isGameOver: false,
      turnDuration
    };

    ws.send({
      type: 'create_game',
      state: initialState
    });
  };

  const handleKickTeam = (teamName: string) => {
    ws.send({
      type: 'kick_team',
      teamName
    });
  };

  const handleStartGame = () => {
    ws.send({ type: 'start_game' });
    navigate("/game");
  };

  if (isWaitingRoom) {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-b from-background to-primary/5">
        <div className="max-w-md mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-primary">
              Waiting Room
            </h2>
            <p className="text-lg font-medium">
              Game Code: <span className="text-primary">{gameCode}</span>
            </p>
            <p className="text-muted-foreground">
              Share this code with other players
            </p>
          </div>

          <Card className="p-6">
            <div className="space-y-4">
              <h3 className="font-medium">Connected Teams</h3>
              {joinedTeams.map((team) => (
                <div
                  key={team.id}
                  className="flex items-center justify-between py-2"
                >
                  <span>{team.name}</span>
                  {team.id !== 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleKickTeam(team.name)}
                    >
                      Kick
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Button
            size="lg"
            className="w-full"
            onClick={handleStartGame}
            disabled={joinedTeams.length < 1}
          >
            Start Game
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-background to-primary/5">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-primary">
            Host Game
          </h2>
          <p className="text-muted-foreground">
            Set up your game settings
          </p>
        </div>

        <Card className="p-6 space-y-6">
          <div className="space-y-2">
            <Label>Your Team Name</Label>
            <Input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter your team name"
            />
          </div>

          <div className="space-y-2">
            <Label>Number of Rounds</Label>
            <div className="grid grid-cols-5 gap-2">
              {ROUND_OPTIONS.map(num => (
                <Button
                  key={num}
                  variant={totalRounds === num ? "default" : "outline"}
                  onClick={() => setTotalRounds(num)}
                  className="flex-1"
                >
                  {num}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Turn Duration (seconds)</Label>
            <div className="flex gap-2">
              {TURN_DURATIONS.map(duration => (
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

          <CategorySelect
            excludedCategories={excludedCategories}
            onChange={setExcludedCategories}
          />

          <div className="pt-4 space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate("/online-game")}
            >
              Back
            </Button>
            <Button
              onClick={handleCreateGame}
              disabled={!teamName}
            >
              Create Game
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}