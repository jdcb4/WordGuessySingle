import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DIFFICULTIES } from "@shared/schema";

interface DifficultySelectProps {
  selectedDifficulties: string[];
  onChange: (difficulties: string[]) => void;
}

export function DifficultySelect({ selectedDifficulties, onChange }: DifficultySelectProps) {
  return (
    <div className="space-y-2">
      <Label>Word Difficulty</Label>
      <div className="flex gap-2">
        {DIFFICULTIES.map(difficulty => (
          <Button
            key={difficulty}
            variant={selectedDifficulties.includes(difficulty) ? "default" : "outline"}
            onClick={() => {
              if (selectedDifficulties.includes(difficulty)) {
                // Don't allow unchecking if it's the last selected difficulty
                if (selectedDifficulties.length > 1) {
                  onChange(selectedDifficulties.filter(d => d !== difficulty));
                }
              } else {
                onChange([...selectedDifficulties, difficulty]);
              }
            }}
            className="flex-1"
          >
            {difficulty}
          </Button>
        ))}
      </div>
    </div>
  );
}