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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Team, TURN_DURATIONS, CATEGORIES, DIFFICULTIES } from "@shared/schema";
import { CategorySelect } from "./category-select";
import { DifficultySelect } from "./difficulty-select";
import { Info, InfoIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface TeamSetupProps {
  onStart: (
    teams: Team[],
    includedCategories: string[],
    turnDuration: number,
    totalRounds: number,
    includedDifficulties: string[],
    freeSkips: number,
    freeHints: number
  ) => void;
}

export function TeamSetup({ onStart }: TeamSetupProps) {
  const [teamCount, setTeamCount] = useState(2);
  const [teamNames, setTeamNames] = useState<string[]>(Array(4).fill(""));
  const [includedCategories, setIncludedCategories] = useState<string[]>([
    "Actions",
    "Things",
    "Places",
    "Food & Drink",
    "Entertainment"
  ]);
  const [turnDuration, setTurnDuration] = useState(60);
  const [totalRounds, setTotalRounds] = useState(3);
  const [includedDifficulties, setIncludedDifficulties] = useState<string[]>(["Easy", "Medium"]);
  const [freeSkips, setFreeSkips] = useState("1");
  const [freeHints, setFreeHints] = useState("1");
  const [infoOpen, setInfoOpen] = useState(false);

  const handleStart = () => {
    if (includedCategories.length === 0) return;

    const numFreeSkips = freeSkips === "Unlimited" ? -1 : parseInt(freeSkips, 10);
    const numFreeHints = freeHints === "Unlimited" ? -1 : parseInt(freeHints, 10);

    console.log('[TeamSetup] Calculated Settings:', { numFreeSkips, numFreeHints, freeSkipsState: freeSkips, freeHintsState: freeHints });

    const validNumFreeSkips = isNaN(numFreeSkips) ? 1 : numFreeSkips;
    const validNumFreeHints = isNaN(numFreeHints) ? 1 : numFreeHints;

    if (isNaN(numFreeSkips) || isNaN(numFreeHints)) {
        console.error('[TeamSetup] Invalid number parsed for skips/hints. Defaulting to 1.');
    }

    const teams: Team[] = Array.from({ length: teamCount }, (_, i) => ({
      id: i + 1,
      name: teamNames[i] || `Team ${i + 1}`,
      score: 0,
      roundScores: []
    }));
    onStart(teams, includedCategories, turnDuration, totalRounds, includedDifficulties, validNumFreeSkips, validNumFreeHints);
  };

  return (
    <Card className="p-6 max-w-md mx-auto space-y-6 relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4"
        onClick={() => setInfoOpen(true)}
      >
        <InfoIcon className="h-5 w-5" />
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

      <div className="space-y-2">
        <Label>Game Settings</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <div>
            <Label htmlFor="free-skips" className="text-sm">Free Skips per Turn</Label>
            <Select value={freeSkips} onValueChange={setFreeSkips}>
              <SelectTrigger id="free-skips">
                <SelectValue placeholder="Select free skips" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0</SelectItem>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="Unlimited">Unlimited (∞)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="free-hints" className="text-sm">Free Hints per Turn</Label>
            <Select value={freeHints} onValueChange={setFreeHints}>
              <SelectTrigger id="free-hints">
                <SelectValue placeholder="Select free hints" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0</SelectItem>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="Unlimited">Unlimited (∞)</SelectItem>
              </SelectContent>
            </Select>
          </div>
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

      <div className="flex justify-between items-center">
        <Button
          size="lg"
          className="w-full"
          onClick={handleStart}
          disabled={includedCategories.length === 0 || includedDifficulties.length === 0}
        >
          Start Game
        </Button>
      </div>

      <AlertDialog open={infoOpen} onOpenChange={setInfoOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center">About WordGuessy</AlertDialogTitle>
            <div className="text-center">
              <img 
                src="junto.png" 
                alt="Junto Logo" 
                className="mx-auto w-32 h-32 mb-4"
              />
            </div>
            <AlertDialogDescription className="text-center space-y-2">
              <p>
                A fun word guessing game for teams, created by Junto.
              </p>
              <p className="text-sm text-muted-foreground">
                Version 1.0
              </p>
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