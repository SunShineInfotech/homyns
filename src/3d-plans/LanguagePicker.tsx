import { PlanLanguage } from "./language";

export function LanguagePicker({ value, onChange }: { value: PlanLanguage; onChange: (language: PlanLanguage) => void }) {
  return <div className="flex items-center gap-1" role="group" aria-label="Choose language">
    {([["en", "English"], ["hi", "हिन्दी"], ["gu", "ગુજરાતી"]] as const).map(([code, label]) => <button key={code} type="button" onClick={() => onChange(code)} aria-pressed={value === code} className={`rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${value === code ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}>{label}</button>)}
  </div>;
}
