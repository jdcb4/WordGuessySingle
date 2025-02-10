import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DIFFICULTIES } from "@shared/schema";

interface DifficultySelectProps {
  includedDifficulties: string[];
  onChange: (difficulties: string[]) => void;
}

export function DifficultySelect({ includedDifficulties, onChange }: DifficultySelectProps) {
  return (
    <div className="space-y-2">
      <Label>Difficulty Levels</Label>
      <div className="flex gap-2">
        {DIFFICULTIES.map(difficulty => (
          <Button
            key={difficulty}
            variant={includedDifficulties.includes(difficulty) ? "default" : "outline"}
            onClick={() => {
              if (includedDifficulties.includes(difficulty)) {
                onChange(includedDifficulties.filter(d => d !== difficulty));
              } else {
                onChange([...includedDifficulties, difficulty]);
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
