import { Loader2 } from "lucide-react";

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen = ({ message = "Loading..." }: LoadingScreenProps) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center glass">
      <div className="glass-card p-8 rounded-2xl">
        <Loader2 className="h-12 w-12 text-accent animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground text-center">{message}</p>
      </div>
    </div>
  );
};
