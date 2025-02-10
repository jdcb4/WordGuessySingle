import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@shared/schema";
import { cn } from "@/lib/utils";

interface CategorySelectProps {
  includedCategories: string[];
  onChange: (categories: string[]) => void;
}

export function CategorySelect({ includedCategories, onChange }: CategorySelectProps) {
  return (
    <div className="space-y-4">
      <Label className="flex items-center gap-2">
        Select Categories
        {includedCategories.length === 0 && (
          <span className="text-sm text-destructive">
            (Select at least one category)
          </span>
        )}
      </Label>
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(category => (
          <Button
            key={category}
            variant={includedCategories.includes(category) ? "default" : "outline"}
            onClick={() => {
              if (includedCategories.includes(category)) {
                onChange(includedCategories.filter(c => c !== category));
              } else {
                onChange([...includedCategories, category]);
              }
            }}
            className={cn(
              "rounded-full",
              includedCategories.includes(category) ? "bg-primary text-primary-foreground" : ""
            )}
          >
            {category}
          </Button>
        ))}
      </div>
    </div>
  );
}