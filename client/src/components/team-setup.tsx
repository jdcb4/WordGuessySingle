import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Team, TURN_DURATIONS, ROUND_OPTIONS } from "@shared/schema";
import { CategorySelect } from "./category-select";
import { DifficultySelect } from "./difficulty-select";

interface TeamSetupProps {
  onStart: (
    teams: Team[],
    includedCategories: string[],
    selectedDifficulties: string[],
    turnDuration: number,
    totalRounds: number,
  ) => void;
}

export function TeamSetup({ onStart }: TeamSetupProps) {
  const [teamCount, setTeamCount] = useState(2);
  const [teamNames, setTeamNames] = useState<string[]>(Array(4).fill(""));
  const [includedCategories, setIncludedCategories] = useState<string[]>([
    "Things",
    "Places",
    "Food & Drink",
    "Hobbies",
    "Entertainment",
    "People",
  ]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([
    "Easy",
    "Medium",
  ]);
  const [turnDuration, setTurnDuration] = useState(TURN_DURATIONS[2]); // Default to 30 seconds
  const [totalRounds, setTotalRounds] = useState(3); // Default to 3 rounds

  const handleStart = () => {
    if (includedCategories.length === 0) {
      return; // Prevent starting if no categories selected
    }
    const teams: Team[] = Array.from({ length: teamCount }, (_, i) => ({
      id: i + 1,
      name: teamNames[i] || `Team ${i + 1}`,
      score: 0,
      roundScores: [],
    }));
    console.log("Starting game with total rounds:", totalRounds);
    onStart(
      teams,
      includedCategories,
      selectedDifficulties,
      turnDuration,
      totalRounds
    );
  };

  return (
    <Card className="p-6 max-w-md mx-auto space-y-6">
      <div className="space-y-2">
        <Label>Number of Teams</Label>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((num) => (
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
        <Label>Number of Rounds</Label>
        <div className="flex flex-wrap gap-2">
          {ROUND_OPTIONS.map((count) => (
            <Button
              key={count}
              variant={totalRounds === count ? "default" : "outline"}
              onClick={() => setTotalRounds(count)}
              className="flex-1"
            >
              {count}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Turn Duration (seconds)</Label>
        <div className="flex gap-2">
          {TURN_DURATIONS.map((duration) => (
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

      <div className="space-y-4">
        {Array.from({ length: teamCount }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Label>Team {i + 1} Name</Label>
            <Input
              value={teamNames[i]}
              onChange={(e) => {
                const newNames = [...teamNames];
                newNames[i] = e.target.value;
                setTeamNames(newNames);
              }}
              placeholder={`Team ${i + 1}`}
            />
          </div>
        ))}
      </div>

      <DifficultySelect
        selectedDifficulties={selectedDifficulties}
        onChange={setSelectedDifficulties}
      />

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
        {includedCategories.length === 0
          ? "Please select at least one category"
          : "Start Game"}
      </Button>
    </Card>
  );
}