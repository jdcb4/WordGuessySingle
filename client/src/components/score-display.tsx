import { Card } from "@/components/ui/card";
import { Team } from "@shared/schema";
import { motion } from "framer-motion";

interface ScoreDisplayProps {
  teams: Team[];
  currentTeamId?: number;
}

export function ScoreDisplay({ teams, currentTeamId }: ScoreDisplayProps) {
  const sortedTeams = [...teams].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-4">
      {sortedTeams.map((team, index) => (
        <motion.div
          key={team.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card
            className={`p-4 ${
              team.id === currentTeamId
                ? "bg-primary/10 border-primary"
                : "bg-background"
            }`}
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">{team.name}</div>
                <div className="text-sm text-muted-foreground">
                  Round scores: {team.roundScores.join(" + ") || "0"}
                </div>
              </div>
              <div className="text-2xl font-bold">{team.score}</div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
