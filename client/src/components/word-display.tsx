import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

interface WordDisplayProps {
  word: string;
  category: string;
}

export function WordDisplay({ word, category }: WordDisplayProps) {
  return (
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
  );
}