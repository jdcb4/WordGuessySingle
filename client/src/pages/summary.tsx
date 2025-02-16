import { useLocation } from "wouter";
import { useGameStore } from "@/lib/use-game-store";
import { ScoreDisplay } from "@/components/score-display";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import confetti from 'canvas-confetti';
import useSound from 'use-sound';
import { QuitGameDialog } from "@/components/quit-game-dialog";
import { useEffect, useState } from "react";

export default function Summary() {
  const [, navigate] = useLocation();
  const { teams, reset } = useGameStore();
  const [soundLoaded, setSoundLoaded] = useState(false);
  const [playWoohoo] = useSound('woohoo.mp3', { 
    volume: 0.5,
    onload: () => setSoundLoaded(true),
    onplayerror: (_, err) => console.error("Error playing woohoo:", err)
  });

  // Find winning team(s)
  const maxScore = Math.max(...teams.map(t => t.score));
  const winners = teams.filter(t => t.score === maxScore);

  // Separate effect for sound loading
  useEffect(() => {
    const loadSound = async () => {
      try {
        // Preload the sound
        const audio = new Audio('woohoo.mp3');
        await audio.load();
        setSoundLoaded(true);
      } catch (error) {
        console.error('Error loading woohoo sound:', error);
      }
    };

    loadSound();
  }, []);

  // Separate effect for playing sound and confetti
  useEffect(() => {
    if (!soundLoaded) return;

    const timer = setTimeout(() => {
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Play sound with user interaction safety
      const playSound = async () => {
        try {
          await playWoohoo();
        } catch (error) {
          console.error('Error playing woohoo sound:', error);
        }
      };
      
      playSound();
    }, 500);

    return () => clearTimeout(timer);
  }, [soundLoaded, playWoohoo]);

  const handlePlayAgain = () => {
    reset();
    navigate("/");
  };

  return (
    <div className="app-container">
      <QuitGameDialog />
      
      <div className="content-area">
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
    </div>
  );
}