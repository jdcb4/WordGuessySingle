import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface WordDisplayProps {
  word: string;
  category: string;
  onNext: () => void;
  onSkip: () => void;
  disabled?: boolean;
}

export function WordDisplay({ word, category, onNext, onSkip, disabled }: WordDisplayProps) {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        key={word}
      >
        <Card className="p-6 text-center bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="text-sm text-primary/60 uppercase tracking-wide mb-2">
            {category}
          </div>
          <div className="text-4xl font-bold text-primary">
            {word}
          </div>
        </Card>
      </motion.div>

      <div className="flex gap-4 justify-center">
        <Button
          size="lg"
          variant="default"
          onClick={onNext}
          disabled={disabled}
          className="w-32"
        >
          Next
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={onSkip}
          disabled={disabled}
          className="w-32"
        >
          Skip
        </Button>
      </div>
    </div>
  );
}
