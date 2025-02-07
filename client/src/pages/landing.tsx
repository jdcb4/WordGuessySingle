import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { InfoDialog } from "@/components/info-dialog";

export default function Landing() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-background to-primary/5">
      <InfoDialog />
      <div className="max-w-md mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Word Guessy
          </h1>
          <p className="text-muted-foreground">
            A fun word guessing game for teams
          </p>
        </div>

        <div className="space-y-4">
          <Button 
            size="lg"
            className="w-full"
            onClick={() => navigate("/local")}
          >
            Pass and Play
          </Button>
          <Button 
            size="lg"
            variant="outline"
            className="w-full"
            onClick={() => navigate("/online")}
          >
            Play Online
          </Button>
        </div>
      </div>
    </div>
  );
}
