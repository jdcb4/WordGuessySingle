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

  useEffect(() => {
    if (timer.isActive && !timer.isFinished && soundsLoaded) {
      try {
        playTimerSound();
      } catch (error) {
        console.error("Error playing timer sound:", error);
      }
    }
  }, [timer.isActive, timer.isFinished, soundsLoaded, playTimerSound]);

  const getCurrentScore = () => {
    const correctWords = results.filter((r) => r.correct);
    return correctWords.length - Math.max(0, skipsUsed - 1);
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
            onClick={() => {
              timer.start();
              if (soundsLoaded) {
                try {
                  playTimerSound();
                } catch (error) {
                  console.error("Error playing timer sound:", error);
                }
              }
            }}
          >
            Start Turn
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <QuitGameDialog />
      <div className="flex-1 overflow-y-auto p-6 pb-48 space-y-6">
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

      <div className="fixed bottom-0 left-0 right-0 space-y-4 p-4 bg-background/80 backdrop-blur-sm border-t">
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

      {timer.isFinished && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full mx-4 space-y-4">
            <h3 className="text-2xl font-bold text-center">Time's Up!</h3>

            <div className="text-xl font-semibold text-center text-primary">
              Score this turn: {getCurrentScore()}
            </div>

            <Button size="lg" className="w-full" onClick={handleTurnEnd}>
              End Turn
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}