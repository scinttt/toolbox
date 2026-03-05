"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeftRight, X } from "lucide-react";

interface TranslateButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  onCancel?: () => void;
}

export default function TranslateButton({
  onClick,
  disabled,
  loading,
  onCancel,
}: TranslateButtonProps) {
  if (loading) {
    return (
      <Button
        onClick={onCancel}
        variant="outline"
        size="icon"
        className="rounded-full h-10 w-10"
        aria-label="Cancel translation"
      >
        <X className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      variant="outline"
      size="icon"
      className="rounded-full h-10 w-10"
      aria-label="Translate"
    >
      <ArrowLeftRight className="h-4 w-4" />
    </Button>
  );
}
