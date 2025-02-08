import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Server, UserPlus } from "lucide-react";

export default function OnlineGame() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-background to-primary/5">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-primary">
            Online Game
          </h2>
          <p className="text-muted-foreground">
            Host a new game or join an existing one
          </p>
        </div>

        <div className="grid gap-4">
          <Button
            size="lg"
            className="h-24"
            onClick={() => navigate("/host-game")}
          >
            <Server className="mr-2 h-5 w-5" />
            Host a Game
          </Button>
          <Button
            size="lg"
            className="h-24"
            variant="outline"
            onClick={() => navigate("/join-game")}
          >
            <UserPlus className="mr-2 h-5 w-5" />
            Join a Game
          </Button>
        </div>
      </div>
    </div>
  );
}
