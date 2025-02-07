import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useGameStore } from "@/lib/use-game-store";
import { useTimer, TURN_DURATION } from "@/lib/use-timer";
import { TimerDisplay } from "@/components/timer-display";
import { WordDisplay } from "@/components/word-display";
import { ScoreDisplay } from "@/components/score-display";
import { getRandomWord, getRandomCategory } from "@/lib/game-data";
import { WordResult, Category } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import useSound from "use-sound";

export default function Game() {
  const [, navigate] = useLocation();
  const {
    teams,
    currentTeamIndex,
    excludedCategories,
    isGameOver,
    nextTeam,
    addTurnResult
  } = useGameStore();

  const [currentCategory, setCurrentCategory] = useState<Category>(
    getRandomCategory(excludedCategories)
  );
  const [usedWords] = useState<Set<string>>(new Set());
  const [currentWord, setCurrentWord] = useState("");
  const [results, setResults] = useState<WordResult[]>([]);
  const [skipsUsed, setSkipsUsed] = useState(0);

  const timer = useTimer();
  const [playTimerSound] = useSound('/timer-beep.mp3', { volume: 0.5 });
  const [playCorrectSound] = useSound('/correct.mp3', { volume: 0.5 });
  const [playSkipSound] = useSound('/skip.mp3', { volume: 0.5 });

  useEffect(() => {
    if (timer.timeLeft <= 10 && timer.timeLeft > 0) {
      playTimerSound();
    }
  }, [timer.timeLeft, playTimerSound]);

  useEffect(() => {
    if (!teams.length) {
      navigate("/");
      return;
    }
    setCurrentWord(getRandomWord(currentCategory, usedWords));
  }, []);

  const getCurrentScore = () => {
    const correctWords = results.filter(r => r.correct);
    return correctWords.length - Math.max(0, skipsUsed - 1);
  };

  const handleNext = () => {
    playCorrectSound();
    usedWords.add(currentWord);
    setResults([...results, { word: currentWord, category: currentCategory, correct: true }]);

    const nextCategory = getRandomCategory(excludedCategories);
    setCurrentCategory(nextCategory);
    setCurrentWord(getRandomWord(nextCategory, usedWords));
  };

  const handleSkip = () => {
    playSkipSound();
    usedWords.add(currentWord);
    setResults([...results, { word: currentWord, category: currentCategory, correct: false }]);
    setSkipsUsed(skipsUsed + 1);

    const nextCategory = getRandomCategory(excludedCategories);
    setCurrentCategory(nextCategory);
    setCurrentWord(getRandomWord(nextCategory, usedWords));
  };

  const handleTurnEnd = () => {
    addTurnResult({
      teamId: teams[currentTeamIndex].id,
      score: getCurrentScore(),
      words: results
    });

    if (isGameOver) {
      navigate("/summary");
    } else {
      nextTeam();
      timer.reset();
      setResults([]);
      setSkipsUsed(0);
      setCurrentCategory(getRandomCategory(excludedCategories));
      setCurrentWord(getRandomWord(currentCategory, usedWords));
    }
  };

  if (!timer.isActive && !timer.isFinished) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">
            {teams[currentTeamIndex].name}'s Turn
          </h2>
          <div className="text-lg text-muted-foreground">
            Category: <span className="font-medium text-primary">{currentCategory}</span>
          </div>
          <Button size="lg" onClick={() => timer.start()}>
            Start Turn
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 space-y-6">
      <TimerDisplay timeLeft={timer.timeLeft} total={TURN_DURATION} />

      <WordDisplay
        word={currentWord}
        category={currentCategory}
        onNext={handleNext}
        onSkip={handleSkip}
        disabled={timer.isFinished}
      />

      <div className="space-y-4">
        <Card className="p-4">
          <div className="text-lg font-medium mb-2">
            Current Score: {getCurrentScore()}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="font-medium text-primary mb-2">Guessed Words</h3>
              <ul className="space-y-1">
                {results.filter(r => r.correct).map((result, i) => (
                  <li key={i} className="text-sm">
                    {result.word} ({result.category})
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-destructive mb-2">Skipped Words</h3>
              <ul className="space-y-1">
                {results.filter(r => !r.correct).map((result, i) => (
                  <li key={i} className="text-sm text-muted-foreground">
                    {result.word} ({result.category})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>

        <ScoreDisplay
          teams={teams}
          currentTeamId={teams[currentTeamIndex].id}
        />
      </div>

      {timer.isFinished && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center">
          <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full space-y-4">
            <h3 className="text-2xl font-bold text-center">Time's Up!</h3>
            <Button
              size="lg"
              className="w-full"
              onClick={handleTurnEnd}
            >
              End Turn
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}