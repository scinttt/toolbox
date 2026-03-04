"use client";

import { Textarea } from "@/components/ui/textarea";
import { MAX_INPUT_LENGTH } from "@/types";

interface InputPanelProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export default function InputPanel({
  value,
  onChange,
  onSubmit,
  disabled,
}: InputPanelProps) {
  const charCount = value.length;
  const isOverLimit = charCount > MAX_INPUT_LENGTH;

  return (
    <div className="flex flex-col h-full">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (!disabled) onSubmit();
          }
        }}
        placeholder="Type or paste text here..."
        className="flex-1 min-h-0 resize-none text-xl leading-relaxed"
        disabled={disabled}
      />
      <div
        className={`text-xs mt-1 px-1 text-right ${
          isOverLimit ? "text-destructive" : "text-muted-foreground"
        }`}
      >
        {charCount} / {MAX_INPUT_LENGTH}
      </div>
    </div>
  );
}
