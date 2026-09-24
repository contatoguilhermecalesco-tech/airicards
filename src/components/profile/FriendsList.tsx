import { Link } from "@tanstack/react-router";
import { ChevronRight, Eye, Flame, Gift, Users } from "lucide-react";
import { useState } from "react";

import { PokeButton } from "@/components/PokeButton";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPresence } from "@/lib/presence";
import type { Profile } from "@/lib/profile";
import { useProfileSnapshot } from "@/lib/profile-view";
import type { ProfileId } from "@/lib/social-store";

export function FriendsList({ friend }: { friend: Profile }) {
  const [open, setOpen] = useState(false);
  const { snapshot, loading } = useProfileSnapshot(friend.id);
  const presence = formatPresence(snapshot?.lastSeenAt);
  const streakDays = snapshot?.streak?.count ?? 0;

  return (
    <section className="min-w-0">
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" strokeWidth={2.25} />
          <h3 className="text-[13px] font-semibold text-foreground">Amigos</h3>
        </div>
        <span className="text-[11px] text-muted-foreground">1 amigo</span>
      </div>

      <Button
        type="button"
        variant="ghost"
        onClick={() => setOpen(true)}
        className="group h-auto w-full justify-start gap-3 rounded-md border border-border bg-profile-panel p-3 text-left hover:bg-profile-raised"
      >
        <span className="relative shrink-0">
          <ProfileAvatar
            profileId={friend.id}
            initial={friend.initial}
            gradient={friend.gradient}
            size={44}
            fontScale={0.36}
            ring="var(--border)"
          />
          <span
            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-profile-panel ${
              presence.online ? "bg-emerald-400" : "bg-muted-foreground"
            }`}
            aria-label={presence.label}
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-semibold text-foreground">{friend.name}</span>
          <span className={`mt-0.5 block truncate text-[11px] ${presence.online ? "text-emerald-400" : "text-muted-foreground"}`}>
            {loading ? "Carregando status…" : presence.label}
          </span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" strokeWidth={2.5} />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100%-1.5rem)] max-w-sm gap-0 overflow-hidden border-border bg-profile-base p-0">
          <div className="h-16 bg-primary/15" />
          <div className="px-5 pb-5">
            <div className="-mt-7 flex items-end justify-between">
              <ProfileAvatar
                profileId={friend.id}
                initial={friend.initial}
                gradient={friend.gradient}
                size={64}
                fontScale={0.36}
                ring="var(--profile-base)"
              />
              <span className={`mb-1 text-[11px] font-medium ${presence.online ? "text-emerald-400" : "text-muted-foreground"}`}>
                {loading ? "Carregando…" : presence.label}
              </span>
            </div>

            <DialogHeader className="mt-3 text-left">
              <DialogTitle className="text-[18px] text-foreground">{friend.name}</DialogTitle>
              <DialogDescription className="text-[12px]">Amigo no airi</DialogDescription>
            </DialogHeader>

            <div className="mt-4 flex items-center gap-4 border-y border-border py-3 text-[12px]">
              <span className="font-medium text-foreground">{snapshot?.rank?.lp ?? 0} LP</span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Flame className="h-3.5 w-3.5 text-orange-400" strokeWidth={2.25} />
                {streakDays} dias
              </span>
              <span className="text-muted-foreground">{snapshot?.cardsTotal ?? 0} cartas</span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <Button asChild variant="secondary" className="h-14 flex-col gap-1 px-1 text-[11px]">
                <Link to="/perfil/$id" params={{ id: friend.id }} onClick={() => setOpen(false)}>
                  <Eye className="h-4 w-4" />
                  Ver perfil
                </Link>
              </Button>
              <Button asChild variant="secondary" className="h-14 flex-col gap-1 px-1 text-[11px]">
                <Link to="/library" onClick={() => setOpen(false)}>
                  <Gift className="h-4 w-4" />
                  Presentear
                </Link>
              </Button>
              <div className="flex h-14 items-center justify-center rounded-md bg-secondary">
                <PokeButton targetId={friend.id as ProfileId} />
              </div>
            </div>
            <p className="mt-3 text-center text-[10px] text-muted-foreground">
              Para presentear, escolha uma carta da sua biblioteca.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}