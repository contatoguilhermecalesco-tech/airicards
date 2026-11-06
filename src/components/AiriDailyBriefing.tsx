import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AIRI_FOCUS_CONFIG } from "@/components/AiriMascot";
import { useCurrentProfile, useProfileHydrated } from "@/lib/profile";
import { briefingDay, briefingKey, dailyFocusFor, shouldShowBriefing } from "@/lib/airi-briefing";

const shownThisSession = new Map<string, string>();

export function AiriDailyBriefing() {
  const profile = useCurrentProfile();
  const hydrated = useProfileHydrated();
  const [open, setOpen] = useState(false);
  const [mood, setMood] = useState(() => dailyFocusFor(new Date()));

  useEffect(() => {
    if (!profile || !hydrated) return;
    // Wait until other overlays (especially the introduction) have finished.
    const check = () => {
      const date = new Date();
      let seen = shownThisSession.get(profile.id) ?? null;
      try { seen = localStorage.getItem(briefingKey(profile.id)) ?? seen; } catch { /* session fallback */ }
      if (!shouldShowBriefing(profile.id, seen, date)) return;
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return;
      setMood(dailyFocusFor(date));
      setOpen(true);
      shownThisSession.set(profile.id, briefingDay(date));
      try { localStorage.setItem(briefingKey(profile.id), briefingDay(date)); } catch { /* session fallback */ }
    };
    const timer = window.setTimeout(check, 1800);
    const interval = window.setInterval(check, 2000);
    return () => { window.clearTimeout(timer); window.clearInterval(interval); };
  }, [profile?.id, hydrated]);

  const config = AIRI_FOCUS_CONFIG[mood];
  const label = mood === "missions_pending" ? "Desafios diários" : mood === "grammar" ? "Gramática" : `${mood.charAt(0).toUpperCase()}${mood.slice(1)}`;

  return (
    <Dialog open={open && Boolean(profile)} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm gap-0 border-primary/20 bg-surface-elevated p-6 text-center">
        <p className="text-xs font-semibold text-primary">Airi · {label}</p>
        <img src={config.img} alt={`Airi — ${label}`} className="mx-auto my-4 h-44 w-44 object-contain sm:h-48 sm:w-48" />
        <DialogTitle className="text-xl leading-snug">{config.title}</DialogTitle>
        <DialogDescription className="mt-3 leading-relaxed">{config.detail}</DialogDescription>
        <div className="mt-6 grid gap-2">
          <Button asChild className="h-11"><Link to={config.route} onClick={() => setOpen(false)}>{mood === "missions_pending" ? "Ver desafios" : "Começar treino"}<ArrowRight /></Link></Button>
          <Button variant="ghost" className="h-11 text-muted-foreground" onClick={() => setOpen(false)}>Pular por enquanto</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}