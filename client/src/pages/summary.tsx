import { useLocation } from "wouter";
import { useGameStore } from "@/lib/use-game-store";
import { ScoreDisplay } from "@/components/score-display";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import confetti from 'canvas-confetti';
import useSound from 'use-sound';

export default function Summary() {
  const [, navigate] = useLocation();
  const { teams, reset } = useGameStore();
  const [playWoohoo] = useSound('/woohoo.mp3', { volume: 0.5 });

  // Find winning team(s)
  const maxScore = Math.max(...teams.map(t => t.score));
  const winners = teams.filter(t => t.score === maxScore);

  const handlePlayAgain = () => {
    reset();
    navigate("/");
  };

  // Trigger confetti and sound effect
  setTimeout(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    try {
      playWoohoo();
    } catch (error) {
      console.error('Error playing woohoo sound:', error);
    }
  }, 500);

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-background to-primary/5">
      <div className="max-w-md mx-auto space-y-8">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-2"
        >
          <h1 className="text-4xl font-bold">Game Over!</h1>
          {winners.length === 1 ? (
            <p className="text-xl text-primary">
              {winners[0].name} wins with {winners[0].score} points!
            </p>
          ) : (
            <p className="text-xl text-primary">
              It's a tie! {winners.map(w => w.name).join(" & ")} win with {maxScore} points!
            </p>
          )}
        </motion.div>

        <ScoreDisplay teams={teams} />

        <Button
          size="lg"
          className="w-full"
          onClick={handlePlayAgain}
        >
          Play Again
        </Button>
      </div>
    </div>
  );
}