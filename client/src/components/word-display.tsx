import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";

interface WordDisplayProps {
  wordData: { word: string; hint: string } | null;
  category: string;
  hintsAvailable: boolean;
  onShowHint: () => void;
}

export function WordDisplay({ wordData, category, hintsAvailable, onShowHint }: WordDisplayProps) {
  const [showHint, setShowHint] = useState(false);

  console.log('WordDisplay rendered. Received hintsAvailable:', hintsAvailable);

  useEffect(() => {
    console.log('WordDisplay useEffect triggered by word change:', wordData?.word);
    setShowHint(false);
  }, [wordData?.word]);

  if (!wordData) {
    return (
      <Card className="p-6 text-center bg-gradient-to-r from-muted/10 to-muted/5">
        <div className="text-muted-foreground">Loading word...</div>
      </Card>
    );
  }

  const handleShowHintClick = () => {
    console.log('handleShowHintClick triggered. Button disabled state should be:', !hintsAvailable);
    if (hintsAvailable) {
      console.log('Hints ARE available. Calling setShowHint(true) and onShowHint().');
      setShowHint(true);
      onShowHint();
    } else {
      console.log('Hints are NOT available. Button click ignored.');
    }
  };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      key={wordData.word}
      className="space-y-4"
    >
      <Card className="p-6 text-center bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="text-sm text-primary/60 uppercase tracking-wide mb-2">
          {category}
        </div>
        <div className="text-4xl font-bold text-primary">
          {wordData.word === "NO MORE WORDS" ? "No More Words" : wordData.word}
        </div>
      </Card>

      {wordData.hint && wordData.word !== "NO MORE WORDS" && (
        <Card className="p-3 text-center bg-gradient-to-r from-secondary/10 to-secondary/5">
          {showHint ? (
            <div className="text-secondary-foreground italic">
              Hint: {wordData.hint}
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShowHintClick}
              disabled={!hintsAvailable}
            >
              <Lightbulb className="mr-2 h-4 w-4" />
              Show Hint (Available: {String(hintsAvailable)})
            </Button>
          )}
        </Card>
      )}
    </motion.div>
  );
}