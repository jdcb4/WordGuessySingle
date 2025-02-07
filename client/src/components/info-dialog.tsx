import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

export function InfoDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-16 z-50"
        >
          <Info className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center mb-4">
            Word Guessy comin' at you from the junto crew
          </DialogTitle>
        </DialogHeader>
        <div className="aspect-square relative overflow-hidden rounded-lg">
          <img
            src="/junto-crew.jpg"
            alt="Junto Crew"
            className="object-cover w-full h-full"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}