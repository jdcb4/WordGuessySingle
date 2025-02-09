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
      <Label>Game Categories</Label>
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(category => (
          <Button
            key={category}
            variant="outline"
            size="sm"
            className={cn(
              "rounded-full transition-colors",
              includedCategories.includes(category) && "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
            onClick={() => {
              if (includedCategories.includes(category)) {
                onChange(includedCategories.filter(c => c !== category));
              } else {
                onChange([...includedCategories, category]);
              }
            }}
          >
            {category}
          </Button>
        ))}
      </div>
      {includedCategories.length === 0 && (
        <p className="text-sm text-destructive">
          Please select at least one category
        </p>
      )}
    </div>
  );
}