import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Team, TURN_DURATIONS, CATEGORIES, DIFFICULTIES } from "@shared/schema";
import { CategorySelect } from "./category-select";
import { DifficultySelect } from "./difficulty-select";
import { Info } from "lucide-react";

interface TeamSetupProps {
  onStart: (
    teams: Team[],
    includedCategories: string[],
    turnDuration: number,
    totalRounds: number,
    includedDifficulties: string[]
  ) => void;
}

export function TeamSetup({ onStart }: TeamSetupProps) {
  const [teamCount, setTeamCount] = useState(2);
  const [teamNames, setTeamNames] = useState<string[]>(Array(4).fill(""));
  const [includedCategories, setIncludedCategories] = useState<string[]>([...CATEGORIES]);
  const [turnDuration, setTurnDuration] = useState<number>(TURN_DURATIONS[2]); // Default to 30 seconds
  const [totalRounds, setTotalRounds] = useState(3); // Default to 3 rounds
  const [includedDifficulties, setIncludedDifficulties] = useState<string[]>(["Easy", "Medium"]);
  const [infoOpen, setInfoOpen] = useState(false);

  const handleStart = () => {
    if (includedCategories.length === 0) return;

    const teams: Team[] = Array.from({ length: teamCount }, (_, i) => ({
      id: i + 1,
      name: teamNames[i] || `Team ${i + 1}`,
      score: 0,
      roundScores: []
    }));
    onStart(teams, includedCategories, turnDuration, totalRounds, includedDifficulties);
  };

  return (
    <Card className="p-6 max-w-md mx-auto space-y-6 relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4"
        onClick={() => setInfoOpen(true)}
      >
        <Info className="h-5 w-5" />
      </Button>

      <div className="space-y-2">
        <Label>Number of Teams</Label>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(num => (
            <Button
              key={num}
              variant={teamCount === num ? "default" : "outline"}
              onClick={() => setTeamCount(num)}
              className="flex-1"
            >
              {num}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Number of Rounds: {totalRounds}</Label>
        <Slider
          value={[totalRounds]}
          onValueChange={([value]) => setTotalRounds(value)}
          min={1}
          max={10}
          step={1}
          className="py-4"
        />
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

      <DifficultySelect
        includedDifficulties={includedDifficulties}
        onChange={setIncludedDifficulties}
      />

      <div className="space-y-4">
        {Array.from({ length: teamCount }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Label>Team {i + 1} Name</Label>
            <Input
              value={teamNames[i]}
              onChange={e => {
                const newNames = [...teamNames];
                newNames[i] = e.target.value;
                setTeamNames(newNames);
              }}
              placeholder={`Team ${i + 1}`}
            />
          </div>
        ))}
      </div>

      <CategorySelect
        includedCategories={includedCategories}
        onChange={setIncludedCategories}
      />

      <Button
        size="lg"
        className="w-full"
        onClick={handleStart}
        disabled={includedCategories.length === 0}
      >
        Start Game
      </Button>

      <AlertDialog open={infoOpen} onOpenChange={setInfoOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>About WordGuessy</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <div className="text-center">
                <img 
                  src="junto.png" 
                  alt="Junto Logo" 
                  className="mx-auto w-32 h-32 mb-4"
                />
                <p className="text-lg">
                  A fun word guessing game for teams, created by Junto.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Version 1.0
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setInfoOpen(false)}>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}