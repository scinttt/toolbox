"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeftRight, Loader2 } from "lucide-react";

interface TranslateButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export default function TranslateButton({
  onClick,
  disabled,
  loading,
}: TranslateButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      variant="outline"
      size="icon"
      className="rounded-full h-10 w-10"
      aria-label="Translate"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <ArrowLeftRight className="h-4 w-4" />
      )}
    </Button>
  );
}
