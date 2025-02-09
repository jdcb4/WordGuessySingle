import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { DIFFICULTIES } from "@shared/schema";

interface DifficultySelectProps {
  selectedDifficulties: string[];
  onChange: (difficulties: string[]) => void;
}

export function DifficultySelect({ selectedDifficulties, onChange }: DifficultySelectProps) {
  return (
    <div className="space-y-4">
      <Label>Word Difficulty</Label>
      <div className="grid grid-cols-3 gap-4">
        {DIFFICULTIES.map(difficulty => (
          <div key={difficulty} className="flex items-center space-x-2">
            <Checkbox
              id={difficulty}
              checked={selectedDifficulties.includes(difficulty)}
              onCheckedChange={(checked) => {
                if (checked) {
                  onChange([...selectedDifficulties, difficulty]);
                } else {
                  // Don't allow unchecking if it's the last selected difficulty
                  if (selectedDifficulties.length > 1) {
                    onChange(selectedDifficulties.filter(d => d !== difficulty));
                  }
                }
              }}
            />
            <label
              htmlFor={difficulty}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {difficulty}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
