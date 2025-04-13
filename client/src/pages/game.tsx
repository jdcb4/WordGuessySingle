import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useGameStore } from "@/lib/use-game-store";
import { useTimer } from "@/lib/use-timer";
import { TimerDisplay } from "@/components/timer-display";
import { WordDisplay } from "@/components/word-display";
import { ScoreDisplay } from "@/components/score-display";
import { getRandomWord, getRandomCategory } from "@/lib/game-data";
import { Category } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import useSound from "use-sound";
import { QuitGameDialog } from "@/components/quit-game-dialog";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTensionSound } from "@/lib/use-tension-sound";

// Define WordData locally if not in shared schema
type CurrentWordData = { word: string; hint: string } | null;

// Rename the local type if it conflicts with an import
type TurnWordResult = {
  word: string;
  category: string;
  correct: boolean;
  hint?: string;
};

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

  // Select freeSkips and freeHints explicitly
  const freeSkips = useGameStore(state => state.freeSkips);
  const freeHints = useGameStore(state => state.freeHints);

  // Add a log to verify the selected values immediately
  console.log(`Selected values - freeSkips: ${freeSkips}, freeHints: ${freeHints}`);

  const [currentCategory, setCurrentCategory] = useState<Category>(
    getRandomCategory(includedCategories),
  );
  const [currentWordData, setCurrentWordData] = useState<CurrentWordData>(null);
  const usedWords = useRef(new Set<string>());
  const [results, setResults] = useState<TurnWordResult[]>([]);
  const [skipsUsed, setSkipsUsed] = useState(0);
  const [soundsLoaded, setSoundsLoaded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);

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

  // Function to get next word
  const getNextWord = async () => {
    const newWordData = await getRandomWord(currentCategory, includedDifficulties, usedWords.current);
    if (newWordData) {
      setCurrentWordData(newWordData);
    } else {
      // Handle case where no words are left for the category/difficulty
      setCurrentWordData({ word: "NO MORE WORDS", hint: "" }); 
    }
  };

  // Initial load
  useEffect(() => {
    if (!teams.length) {
      navigate("/");
      return;
    }
    getNextWord(); // Load initial word
  }, []);

  // Reset hasPlayedCountdown when starting a new turn
  useEffect(() => {
    if (!timer.isActive || timer.isFinished) {
      setHasPlayedCountdown(false);
    }
  }, [timer.isActive, timer.isFinished]);

  // Add this effect to handle the final word when timer finishes
  useEffect(() => {
    if (timer.isFinished && currentWordData) {
      setResults(prev => [
        ...prev,
        { word: currentWordData.word, category: currentCategory, correct: false, hint: currentWordData.hint }
      ]);
    }
  }, [timer.isFinished]);

  useEffect(() => {
    console.log('[Game useEffect] Values from store:', { freeSkips, freeHints });
    // If they are initially undefined, this effect will run again if/when they change.
  }, [freeSkips, freeHints]); // Depend specifically on these values

  const getCurrentScore = () => {
    const correctWords = results.filter((r) => r.correct).length;
    let skipPenalty = 0;

    // Log the values being used in the calculation
    console.log(`Calculating score - correctWords: ${correctWords}, skipsUsed: ${skipsUsed}, freeSkips from store: ${freeSkips}`);

    // Ensure freeSkips is a valid number before using it
    const numFreeSkips = typeof freeSkips === 'number' && !isNaN(freeSkips) ? freeSkips : 1; // Default to 1 if invalid

    if (numFreeSkips === -1) {
      // Unlimited skips means no penalty
      skipPenalty = 0;
      console.log("Unlimited free skips, penalty = 0");
    } else {
      skipPenalty = Math.max(0, skipsUsed - numFreeSkips);
      console.log(`Calculated penalty: max(0, ${skipsUsed} - ${numFreeSkips}) = ${skipPenalty}`);
    }

    // Final score cannot be negative
    const finalScore = Math.max(0, correctWords - skipPenalty);

    // Check if the result is NaN and return 0 if it is
    if (isNaN(finalScore)) {
      console.error("Score calculation resulted in NaN. Values:", { correctWords, skipsUsed, freeSkips, numFreeSkips, skipPenalty });
      return 0;
    }

    console.log(`Final score: max(0, ${correctWords} - ${skipPenalty}) = ${finalScore}`);
    return finalScore;
  };

  // Calculate if hints are available
  console.log(`[Game Render] Values before hintsAvailable calc: freeHints=${freeHints}, hintsUsed=${hintsUsed}`);
  const hintsAvailable = freeHints === -1 || hintsUsed < freeHints;
  console.log(`Hints check - freeHints: ${freeHints}, hintsUsed: ${hintsUsed}, hintsAvailable: ${hintsAvailable}`);

  // Reset hintsUsed when turn starts
  const handleStartTurn = () => {
    if (!timer.isActive) {
      setResults([]);
      setSkipsUsed(0);
      setHintsUsed(0);
      usedWords.current.clear();
      getNextWord();
      timer.start();
    }
  };

  // Update handleNext
  const handleNext = async () => {
    if (isTransitioning || !currentWordData || currentWordData.word === "NO MORE WORDS") return;

    if (soundsLoaded) {
      try {
        playCorrectSound();
      } catch (error) {
        console.error("Error playing correct sound:", error);
      }
    }

    usedWords.current.add(currentWordData.word);
    setResults(prev => [
      ...prev,
      {
        word: currentWordData.word,
        category: currentCategory,
        correct: true,
        hint: currentWordData.hint // Store hint in results
      }
    ]);
    await getNextWord();
  };

  // Update handleSkip
  const handleSkip = async () => {
    if (isTransitioning || !currentWordData || currentWordData.word === "NO MORE WORDS") return;

    if (soundsLoaded) {
      try {
        playSkipSound();
      } catch (error) {
        console.error("Error playing skip sound:", error);
      }
    }

    usedWords.current.add(currentWordData.word);
    setResults(prev => [
      ...prev,
      {
        word: currentWordData.word,
        category: currentCategory,
        correct: false,
        hint: currentWordData.hint // Store hint in results
      }
    ]);
    setSkipsUsed(prev => prev + 1);
    await getNextWord();
  };

  // Reset hintsUsed when turn ends
  const handleTurnEnd = () => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    const finalScore = getCurrentScore();
    const team = teams[currentTeamIndex];
    const isLastRound = currentRound === totalRounds;
    const isLastTeam = currentTeamIndex === teams.length - 1;
    const shouldEndGame = isLastRound && isLastTeam;

    addTurnResult({
      teamId: team.id,
      score: finalScore,
      words: results,
    });

    setTimeout(() => {
      if (shouldEndGame) {
        navigate("/summary");
      } else {
        nextTeam();
        timer.reset();
        setResults([]);
        setSkipsUsed(0);
        setHintsUsed(0);
        const newCategory = getRandomCategory(includedCategories);
        setCurrentCategory(newCategory);
        usedWords.current.clear();
        getNextWord();
      }
      setIsTransitioning(false);
    }, 1000);
  };

  // Function to handle showing the hint (passed to WordDisplay)
  const handleShowHint = () => {
    console.log('handleShowHint called in Game. Current hintsAvailable:', hintsAvailable, 'Current hintsUsed:', hintsUsed);
    if (hintsAvailable) {
      setHintsUsed(prev => {
        const nextHintsUsed = prev + 1;
        console.log(`Incrementing hintsUsed to: ${nextHintsUsed}`);
        return nextHintsUsed;
      });
    } else {
      console.log('handleShowHint called but hints not available.');
    }
  };

  useTensionSound(timer.isActive, timer.timeLeft, turnDuration);

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

              {/* Add Final Word Display */}
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <h3 className="font-medium text-muted-foreground mb-1">Final Word</h3>
                <p className="text-lg font-medium">{currentWordData?.word === "NO MORE WORDS" ? "N/A" : currentWordData?.word || 'N/A'}</p>
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

  // Add logging before rendering WordDisplay
  console.log('Rendering WordDisplay with hintsAvailable:', hintsAvailable);
  return (
    <div className="app-container">
      <QuitGameDialog />
      
      <div className="content-area">
        <div className="max-w-md mx-auto space-y-4">
          <TimerDisplay timeLeft={timer.timeLeft} total={turnDuration} />

          <WordDisplay
            wordData={currentWordData}
            category={currentCategory}
            hintsAvailable={hintsAvailable}
            onShowHint={handleShowHint}
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
            variant="outline"
            onClick={handleSkip}
            disabled={timer.isFinished}
            className="flex-1"
          >
            Skip ({skipsUsed})
          </Button>
          <Button
            size="lg"
            variant="default"
            onClick={handleNext}
            disabled={timer.isFinished}
            className="flex-1"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}