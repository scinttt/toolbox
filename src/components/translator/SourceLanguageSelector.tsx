"use client";

import type { SourceLang } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SourceLanguageSelectorProps {
  value: SourceLang;
  onChange: (lang: SourceLang) => void;
}

export default function SourceLanguageSelector({
  value,
  onChange,
}: SourceLanguageSelectorProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as SourceLang)}>
      <SelectTrigger className="w-[140px]" aria-label="Input language">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="zh">中文</SelectItem>
        <SelectItem value="en">English</SelectItem>
        <SelectItem value="mixed">Mixed 混合</SelectItem>
      </SelectContent>
    </Select>
  );
}
