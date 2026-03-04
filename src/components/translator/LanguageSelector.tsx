"use client";

import type { TargetLang } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LanguageSelectorProps {
  value: TargetLang;
  onChange: (lang: TargetLang) => void;
}

export default function LanguageSelector({
  value,
  onChange,
}: LanguageSelectorProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as TargetLang)}>
      <SelectTrigger className="w-[140px]" aria-label="Output language">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="zh">中文</SelectItem>
        <SelectItem value="en">English</SelectItem>
      </SelectContent>
    </Select>
  );
}
