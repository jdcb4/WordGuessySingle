import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface TimerDisplayProps {
  timeLeft: number;
  total: number;
}

export function TimerDisplay({ timeLeft, total }: TimerDisplayProps) {
  const percentage = (timeLeft / total) * 100;
  const isLow = timeLeft <= 10;

  return (
    <div className="w-full max-w-md mx-auto space-y-2">
      <div className={cn(
        "text-4xl font-bold text-center transition-colors",
        isLow ? "text-red-500 animate-pulse" : "text-primary"
      )}>
        {timeLeft}s
      </div>
      <Progress
        value={percentage}
        className={cn(
          "h-3 transition-colors",
          isLow ? "bg-red-100" : "bg-primary/20"
        )}
        indicatorClassName={cn(
          "transition-all",
          isLow ? "bg-red-500" : "bg-primary"
        )}
      />
    </div>
  );
}
