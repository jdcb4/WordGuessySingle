import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useGameStore } from "@/lib/use-game-store";
import { useTimer } from "@/lib/use-timer";
import { TimerDisplay } from "@/components/timer-display";
import { WordDisplay } from "@/components/word-display";
import { ScoreDisplay } from "@/components/score-display";
import { getRandomWord, getRandomCategory } from "@/lib/game-data";
import { WordResult, Category } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import useSound from "use-sound";
import { QuitGameDialog } from "@/components/quit-game-dialog";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Game() {
  const [, navigate] = useLocation();
  const {
    teams,
    currentTeamIndex,
    includedCategories,
    includedDifficulties,
    isGameOver,
    turnDuration,
    nextTeam,
    addTurnResult,
    currentRound,
    totalRounds,
  } = useGameStore();

  const [currentCategory, setCurrentCategory] = useState<Category>(
    getRandomCategory(includedCategories),
  );
  const [usedWords] = useState<Set<string>>(new Set());
  const [currentWord, setCurrentWord] = useState("");
  const [results, setResults] = useState<WordResult[]>([]);
  const [skipsUsed, setSkipsUsed] = useState(0);
  const [soundsLoaded, setSoundsLoaded] = useState(false);

  const timer = useTimer(turnDuration);
  const [playTimerSound] = useSound("countdown.mp3", { 
    volume: 0.5,
    onload: () => setSoundsLoaded(true)
  });
  const [playCorrectSound] = useSound("correct.mp3", { 
    volume: 0.5,
    onload: () => setSoundsLoaded(true)
  });
  const [playSkipSound] = useSound("skip.mp3", { 
    volume: 0.5,
    onload: () => setSoundsLoaded(true)
  });

  // Add state to track if we've played the countdown this turn
  const [hasPlayedCountdown, setHasPlayedCountdown] = useState(false);

  useEffect(() => {
    const loadSounds = async () => {
      try {
        // Preload sounds
        await Promise.all([
          new Audio("countdown.mp3").load(),
          new Audio("correct.mp3").load(),
          new Audio("skip.mp3").load()
        ]);
        setSoundsLoaded(true);
      } catch (error) {
        console.error("Error loading sounds:", error);
        // Continue without sounds if they fail to load
        setSoundsLoaded(true);
      }
    };

    loadSounds();
  }, []);

  useEffect(() => {
    console.log('Sound loaded state:', soundsLoaded);
  }, [soundsLoaded]);

  useEffect(() => {
    if (!teams.length) {
      navigate("/");
      return;
    }
    setCurrentWord(
      getRandomWord(currentCategory, includedDifficulties, usedWords),
    );
  }, []);

  // Update the countdown sound effect
  useEffect(() => {
    if (
      timer.isActive && 
      !timer.isFinished && 
      soundsLoaded && 
      timer.timeLeft === 5 && // Exactly at 5 seconds
      !hasPlayedCountdown     // Haven't played it yet this turn
    ) {
      try {
        playTimerSound();
        setHasPlayedCountdown(true);  // Mark as played for this turn
      } catch (error) {
        console.error("Error playing timer sound:", error);
      }
    }
  }, [timer.isActive, timer.isFinished, soundsLoaded, timer.timeLeft, playTimerSound, hasPlayedCountdown]);

  // Reset hasPlayedCountdown when starting a new turn
  useEffect(() => {
    if (!timer.isActive || timer.isFinished) {
      setHasPlayedCountdown(false);
    }
  }, [timer.isActive, timer.isFinished]);

  const getCurrentScore = () => {
    const correctWords = results.filter((r) => r.correct);
    // Use Math.max to ensure the score doesn't go below 0
    return Math.max(0, correctWords.length - Math.max(0, skipsUsed - 1));
  };

  const handleNext = () => {
    console.log('Playing correct sound, loaded:', soundsLoaded);
    if (soundsLoaded) {
      try {
        playCorrectSound();
      } catch (error) {
        console.error("Error playing correct sound:", error);
      }
    }
    usedWords.add(currentWord);
    setResults([
      ...results,
      { word: currentWord, category: currentCategory, correct: true },
    ]);
    setCurrentWord(
      getRandomWord(currentCategory, includedDifficulties, usedWords),
    );
  };

  const handleSkip = () => {
    console.log('Playing skip sound, loaded:', soundsLoaded);
    if (soundsLoaded) {
      try {
        playSkipSound();
      } catch (error) {
        console.error("Error playing skip sound:", error);
      }
    }
    usedWords.add(currentWord);
    setResults([
      ...results,
      { word: currentWord, category: currentCategory, correct: false },
    ]);
    setSkipsUsed(skipsUsed + 1);
    setCurrentWord(
      getRandomWord(currentCategory, includedDifficulties, usedWords),
    );
  };

  const handleTurnEnd = () => {
    const team = teams[currentTeamIndex];
    const isLastRound = currentRound === totalRounds;
    const isLastTeam = currentTeamIndex === teams.length - 1;
    const shouldEndGame = isLastRound && isLastTeam;

    addTurnResult({
      teamId: team.id,
      score: getCurrentScore(),
      words: results,
    });

    if (shouldEndGame) {
      navigate("/summary");
    } else {
      nextTeam();
      timer.reset();
      setResults([]);
      setSkipsUsed(0);
      const newCategory = getRandomCategory(includedCategories);
      setCurrentCategory(newCategory);
      setCurrentWord(
        getRandomWord(newCategory, includedDifficulties, new Set()),
      );
      usedWords.clear();
    }
  };

  const handleStartTurn = () => {
    timer.start();
  };

  if (!timer.isActive && !timer.isFinished) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">
            {teams[currentTeamIndex].name}'s Turn
          </h2>
          <div className="text-lg text-muted-foreground">
            Category:{" "}
            <span className="font-medium text-primary">{currentCategory}</span>
          </div>
          <Button 
            size="lg" 
            onClick={handleStartTurn}
          >
            Start Turn
          </Button>
        </div>
      </div>
    );
  }

  if (timer.isFinished) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="w-full max-w-md space-y-4">
          <Card className="p-6">
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Turn Complete!</h2>
                <div className="text-xl font-semibold text-primary">
                  Score this turn: {getCurrentScore()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Correct Words */}
                <div>
                  <h3 className="font-medium text-primary mb-2">
                    Correct Words ({results.filter(r => r.correct).length})
                  </h3>
                  <div className="overflow-y-auto max-h-48">
                    <ul className="space-y-1">
                      {results
                        .filter(r => r.correct)
                        .map((result, i) => (
                          <li key={i} className="text-sm">
                            {result.word}
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>

                {/* Skipped Words */}
                <div>
                  <h3 className="font-medium text-destructive mb-2">
                    Skipped Words ({results.filter(r => !r.correct).length})
                  </h3>
                  <div className="overflow-y-auto max-h-48">
                    <ul className="space-y-1">
                      {results
                        .filter(r => !r.correct)
                        .map((result, i) => (
                          <li key={i} className="text-sm text-muted-foreground">
                            {result.word}
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button size="lg" className="w-full" onClick={handleTurnEnd}>
                  End Turn
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <QuitGameDialog />
      
      <div className="content-area">
        <div className="max-w-md mx-auto space-y-4">
          <TimerDisplay timeLeft={timer.timeLeft} total={turnDuration} />

          <WordDisplay
            word={currentWord}
            category={currentCategory}
            onNext={handleNext}
            onSkip={handleSkip}
            disabled={timer.isFinished}
          />

          <div className="space-y-4">
            <Card className="p-4">
              <div className="text-lg font-medium mb-2">Results</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-primary mb-2">Guessed Words</h3>
                  <div className="overflow-y-auto" style={{ maxHeight: 'calc(60vh - 20rem)' }}>
                    <ul className="space-y-1">
                      {[...results]
                        .reverse()
                        .filter((r) => r.correct)
                        .map((result, i) => (
                          <li key={i} className="text-sm">
                            {result.word}
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
                <div className="border-l pl-4">
                  <h3 className="font-medium text-destructive mb-2">
                    Skipped Words
                  </h3>
                  <div className="overflow-y-auto" style={{ maxHeight: 'calc(60vh - 20rem)' }}>
                    <ul className="space-y-1">
                      {[...results]
                        .reverse()
                        .filter((r) => !r.correct)
                        .map((result, i) => (
                          <li key={i} className="text-sm text-muted-foreground">
                            {result.word}
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <div className="bottom-area">
        <Card className="p-4 mb-4">
          <div className="text-lg font-medium">
            Current Score: {getCurrentScore()}
          </div>
          <ScoreDisplay
            teams={teams}
            currentTeamId={teams[currentTeamIndex].id}
          />
        </Card>

        <div className="max-w-md mx-auto flex gap-4">
          <Button
            size="lg"
            variant="default"
            onClick={handleNext}
            disabled={timer.isFinished}
            className="flex-1"
          >
            Next
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={handleSkip}
            disabled={timer.isFinished}
            className="flex-1"
          >
            Skip
          </Button>
        </div>
      </div>
    </div>
  );
}