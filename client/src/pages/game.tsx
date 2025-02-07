import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useGameStore } from "@/lib/use-game-store";
import { useWebSocket } from "@/lib/use-websocket";
import { useTimer } from "@/lib/use-timer";
import { TimerDisplay } from "@/components/timer-display";
import { WordDisplay } from "@/components/word-display";
import { ScoreDisplay } from "@/components/score-display";
import { getRandomWord, getRandomCategory } from "@/lib/game-data";
import { WordResult, Category } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import useSound from "use-sound";
import { QuitGameDialog } from "@/components/quit-game-dialog";

export default function Game() {
  const [, navigate] = useLocation();
  const {
    teams,
    currentTeamIndex,
    excludedCategories,
    isGameOver,
    turnDuration,
    nextTeam,
    addTurnResult,
    currentRound,
    totalRounds,
    isGameStarted,
    gameId,
    isHost,
    gameMode
  } = useGameStore();
  const { connected, sendMessage } = useWebSocket(gameId);

  const [currentCategory, setCurrentCategory] = useState<Category>(
    getRandomCategory(excludedCategories)
  );
  const [usedWords] = useState<Set<string>>(new Set());
  const [currentWord, setCurrentWord] = useState("");
  const [results, setResults] = useState<WordResult[]>([]);
  const [skipsUsed, setSkipsUsed] = useState(0);

  const timer = useTimer(turnDuration);
  const [playTimerSound] = useSound('/timer-beep.mp3', { volume: 0.5 });
  const [playCorrectSound] = useSound('/correct.mp3', { volume: 0.5 });
  const [playSkipSound] = useSound('/skip.mp3', { volume: 0.5 });

  // Redirect if game not started or connection lost in online mode
  useEffect(() => {
    if (!isGameStarted || (gameMode === 'online' && !connected)) {
      navigate("/");
      return;
    }
  }, [isGameStarted, connected, navigate, gameMode]);

  // Initialize game state
  useEffect(() => {
    if (teams.length && currentWord === "") {
      setCurrentWord(getRandomWord(currentCategory, usedWords));
    }
  }, [teams, currentWord, currentCategory, usedWords]);

  // Timer sound effect
  useEffect(() => {
    if (timer.timeLeft === 5 && timer.isActive) {
      try {
        playTimerSound();
      } catch (error) {
        console.error('Error playing timer sound:', error);
      }
    }
  }, [timer.timeLeft, playTimerSound, timer.isActive]);

  // Loading state
  if (!teams.length || !isGameStarted || (gameMode === 'online' && !connected)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading game...</span>
        </div>
      </div>
    );
  }

  const getCurrentScore = () => {
    const correctWords = results.filter(r => r.correct);
    return correctWords.length - Math.max(0, skipsUsed - 1);
  };

  const handleNext = () => {
    try {
      playCorrectSound();
    } catch (error) {
      console.error('Error playing correct sound:', error);
    }
    usedWords.add(currentWord);
    setResults([...results, { word: currentWord, category: currentCategory, correct: true }]);
    setCurrentWord(getRandomWord(currentCategory, usedWords));
  };

  const handleSkip = () => {
    try {
      playSkipSound();
    } catch (error) {
      console.error('Error playing skip sound:', error);
    }
    usedWords.add(currentWord);
    setResults([...results, { word: currentWord, category: currentCategory, correct: false }]);
    setSkipsUsed(skipsUsed + 1);
    setCurrentWord(getRandomWord(currentCategory, usedWords));
  };

  const handleTurnEnd = () => {
    const team = teams[currentTeamIndex];
    const turnResult = {
      teamId: team.id,
      score: getCurrentScore(),
      words: results
    };

    // Send turn result to all players in online mode
    if (gameMode === 'online') {
      sendMessage({
        type: 'end_turn',
        payload: {
          turnResult,
          nextTeamIndex: (currentTeamIndex + 1) % teams.length,
          currentRound: currentRound + ((currentTeamIndex + 1) === teams.length ? 1 : 0)
        }
      });
    }

    addTurnResult(turnResult);

    const isLastRound = currentRound === totalRounds;
    const isLastTeam = currentTeamIndex === teams.length - 1;
    const shouldEndGame = isLastRound && isLastTeam;

    if (shouldEndGame) {
      navigate("/summary");
    } else {
      nextTeam();
      timer.reset();
      setResults([]);
      setSkipsUsed(0);
      const newCategory = getRandomCategory(excludedCategories);
      setCurrentCategory(newCategory);
      setCurrentWord(getRandomWord(newCategory, new Set()));
      usedWords.clear();
    }
  };

  // Check if it's the current team's turn and they can interact
  const isCurrentTeamsTurn =
    gameMode === 'local' ||
    (teams[currentTeamIndex] &&
      ((isHost() && teams[currentTeamIndex].isHost) ||
        (!isHost() && !teams[currentTeamIndex].isHost)));

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
          {isCurrentTeamsTurn && (
            <Button size="lg" onClick={() => {
              timer.start();
              // Notify other players that the turn has started
              if (gameMode === 'online') {
                sendMessage({
                  type: 'turn_started',
                  payload: { teamId: teams[currentTeamIndex].id }
                });
              }
            }}>
              Start Turn
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <QuitGameDialog />
      <div className="flex-1 overflow-y-auto p-6 pb-96 space-y-6">
        <TimerDisplay timeLeft={timer.timeLeft} total={turnDuration} />

        <WordDisplay word={currentWord} category={currentCategory} />

        <div className="space-y-4">
          <Card className="p-4">
            <div className="text-lg font-medium mb-2">Results</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-primary mb-2">Guessed Words</h3>
                <div className="max-h-48 overflow-y-auto">
                  <ul className="space-y-1">
                    {results.filter(r => r.correct).map((result, i) => (
                      <li key={i} className="text-sm">
                        {result.word}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="border-l pl-4">
                <h3 className="font-medium text-destructive mb-2">Skipped Words</h3>
                <div className="max-h-48 overflow-y-auto">
                  <ul className="space-y-1">
                    {results.filter(r => !r.correct).map((result, i) => (
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

      <div className="fixed bottom-[10%] left-0 right-0 space-y-4 p-4 bg-background/80 backdrop-blur-sm border-t">
        <Card className="p-4 mb-4">
          <div className="text-lg font-medium">
            Current Score: {getCurrentScore()}
          </div>
          <ScoreDisplay
            teams={teams}
            currentTeamId={teams[currentTeamIndex].id}
          />
        </Card>

        {isCurrentTeamsTurn && (
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
        )}
      </div>

      {timer.isFinished && isCurrentTeamsTurn && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full mx-4 space-y-4">
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