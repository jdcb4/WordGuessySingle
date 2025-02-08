import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useWebSocket } from "@/lib/use-websocket";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const joinGameSchema = z.object({
  gameCode: z.string().min(1, "Game code is required"),
  teamName: z.string().min(1, "Team name is required").max(30, "Team name is too long"),
});

type JoinGameForm = z.infer<typeof joinGameSchema>;

export default function JoinGame() {
  const [, navigate] = useLocation();
  const ws = useWebSocket();
  const { toast } = useToast();

  const form = useForm<JoinGameForm>({
    resolver: zodResolver(joinGameSchema),
    defaultValues: {
      gameCode: "",
      teamName: "",
    },
  });

  useEffect(() => {
    ws.connect();

    ws.on('joined_game', () => {
      toast({
        title: "Success",
        description: "Successfully joined the game. Waiting for host to start...",
      });
    });

    ws.on('game_started', () => {
      navigate("/game");
    });

    ws.on('error', (data) => {
      toast({
        title: "Error",
        description: data.message,
        variant: "destructive"
      });
    });

    ws.on('kicked', () => {
      toast({
        title: "Kicked",
        description: "You have been removed from the game by the host.",
        variant: "destructive"
      });
      navigate("/online-game");
    });

    return () => {
      ws.socket?.close();
    };
  }, [ws, navigate, toast]);

  const onSubmit = (data: JoinGameForm) => {
    ws.send({
      type: 'join_game',
      code: data.gameCode.toUpperCase(),
      teamName: data.teamName
    });
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-background to-primary/5">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-primary">
            Join Game
          </h2>
          <p className="text-muted-foreground">
            Enter the game code and your team name
          </p>
        </div>

        <Card className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="gameCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Game Code</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter game code"
                        className="uppercase"
                        onChange={e => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="teamName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter your team name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4 space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/online-game")}
                >
                  Back
                </Button>
                <Button type="submit">
                  Join Game
                </Button>
              </div>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}