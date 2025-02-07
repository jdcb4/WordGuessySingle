import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CATEGORIES } from "@shared/schema";

interface CategorySelectProps {
  excludedCategories: string[];
  onChange: (categories: string[]) => void;
}

export function CategorySelect({ excludedCategories, onChange }: CategorySelectProps) {
  return (
    <div className="space-y-4">
      <Label>Exclude Categories</Label>
      <div className="grid grid-cols-2 gap-4">
        {CATEGORIES.map(category => (
          <div key={category} className="flex items-center space-x-2">
            <Checkbox
              id={category}
              checked={excludedCategories.includes(category)}
              onCheckedChange={(checked) => {
                if (checked) {
                  onChange([...excludedCategories, category]);
                } else {
                  onChange(excludedCategories.filter(c => c !== category));
                }
              }}
            />
            <label
              htmlFor={category}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {category}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
