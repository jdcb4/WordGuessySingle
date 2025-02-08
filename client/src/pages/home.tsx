import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Globe } from "lucide-react";
import { InfoDialog } from "@/components/info-dialog";

export default function Home() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-background to-primary/5">
      <InfoDialog />
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Word Guessy
          </h1>
          <p className="text-muted-foreground">
            A fun word guessing game for teams
          </p>
        </div>

        <div className="grid gap-4">
          <Button
            size="lg"
            className="h-24"
            onClick={() => navigate("/local-game")}
          >
            <Users className="mr-2 h-5 w-5" />
            Pass and Play
          </Button>
          <Button
            size="lg"
            className="h-24"
            variant="outline"
            onClick={() => navigate("/online-game")}
          >
            <Globe className="mr-2 h-5 w-5" />
            Play Online
          </Button>
        </div>
      </div>
    </div>
  );
}