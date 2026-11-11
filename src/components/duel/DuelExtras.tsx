import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Crown, Coins, Mail, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { earn, spend, useWallet } from "@/lib/wallet-store";
import { currentWeekKey, otherProfile, profileMeta, useDuelHistory, useDuelResults, useWeeklyDuel, type ProfileId } from "@/lib/social-store";
import { BET_MAX, BET_MIN, SECRET_CARD_REWARD, betPayout, headToHead, isValidBet, resolveDuelMood, type BetRow, type DuelMood } from "@/lib/duel-extras-rules";
import champion from "@/assets/airi-emotes/airi-duel-champion.png";
import crying from "@/assets/airi-emotes/airi-duel-crying.png";
import gg from "@/assets/airi-emotes/airi-duel-gg.png";
import panic from "@/assets/airi-emotes/airi-duel-panic.png";

const sb = supabase as any;

const MOODS: Record<Exclude<DuelMood, null>, { src: string; line: (opp: string) => string }> = {
  champion: { src: champion, line: () => "O cinturão da temporada é seu. Não deixa escapar." },
  crying: { src: crying, line: (o) => `${o} levou o cinturão... me passa o sorvete.` },
  gg: { src: gg, line: () => "Sua parte tá feita. GG EZ." },
  panic: { src: panic, line: (o) => `${o} já jogou! REAGE!` },
};

export function DuelHallOfFame({ meId }: { meId: ProfileId }) {
  const oppId = otherProfile(meId);
  const opp = profileMeta(oppId);
  const history = useDuelHistory();
  const active = useWeeklyDuel();
  const results = useDuelResults(active?.status === "active" ? active.id : undefined);
  const h2h = headToHead(history as any);
  const last = history[0];
  const mood = resolveDuelMood({
    me: meId,
    hasActive: active?.status === "active",
    activeIPlayed: results.some((r) => r.profileId === meId),
    activeOppPlayed: results.some((r) => r.profileId === oppId),
    lastWinner: last?.winner as ProfileId | null,
  });
  const beltHolder = last?.winner as ProfileId | null | undefined;
  const mine = h2h[meId];
  const theirs = h2h[oppId];

  return (
    <section className="mb-5 overflow-hidden rounded-[22px] border border-border/60 bg-card/60 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Hall da Fama</p>
      <div className="mt-2 flex items-center gap-3">
        {mood ? <img src={MOODS[mood].src} alt="Airi" className="h-28 w-28 shrink-0 object-contain drop-shadow-[0_8px_20px_color-mix(in_oklab,var(--primary)_35%,transparent)]" /> : null}
        <div className="min-w-0 flex-1">
          <p className="text-[28px] font-semibold tabular-nums tracking-tight text-foreground">
            {mine} <span className="text-muted-foreground">×</span> {theirs}
          </p>
          <p className="text-[12px] text-muted-foreground">Você × {opp.name} · vitórias no geral</p>
          {beltHolder ? (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-medium text-primary">
              <Crown className="h-3.5 w-3.5" /> Cinturão: {beltHolder === meId ? "Você" : opp.name}
            </p>
          ) : null}
          {mood ? <p className="mt-2 text-[12px] italic text-foreground/80">“{MOODS[mood].line(opp.name)}”</p> : null}
        </div>
      </div>
    </section>
  );
}

function mapBet(r: any): BetRow & { id: string } {
  return { id: r.id, profileId: r.profile_id, amount: r.amount, payoutClaimed: r.payout_claimed };
}

export function DuelBetCard({ meId }: { meId: ProfileId }) {
  const wallet = useWallet();
  const active = useWeeklyDuel();
  const history = useDuelHistory();
  const [bets, setBets] = useState<(BetRow & { id: string; duelId: string })[]>([]);
  const [amount, setAmount] = useState(50);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await sb.from("duel_bets").select("*").order("created_at", { ascending: false }).limit(60);
    setBets((data ?? []).map((r: any) => ({ ...mapBet(r), duelId: r.duel_id })));
  }, []);
  useEffect(() => { load(); }, [load]);

  const open = active?.status === "active" ? active : null;
  const openBets = open ? bets.filter((b) => b.duelId === open.id) : [];
  const myOpen = openBets.find((b) => b.profileId === meId);
  const pot = openBets.reduce((s, b) => s + b.amount, 0);

  const claimable = history
    .map((d) => {
      const dbets = bets.filter((b) => b.duelId === d.id);
      const value = betPayout(meId, d.winner as ProfileId | null, dbets);
      return { duel: d, value, row: dbets.find((b) => b.profileId === meId) };
    })
    .filter((c) => c.value > 0 && c.row);

  async function place() {
    if (!open || !isValidBet(amount, wallet.crystals)) return toast.error(`Aposte entre ${BET_MIN} e ${BET_MAX} ✦ dentro do seu saldo.`);
    setBusy(true);
    const ok = await spend(amount);
    if (!ok) { setBusy(false); return toast.error("Saldo insuficiente."); }
    const { error } = await sb.from("duel_bets").insert({ duel_id: open.id, profile_id: meId, amount });
    if (error) { await earn(amount, "Aposta devolvida"); toast.error("Não deu pra registrar a aposta."); }
    else toast.success(`Aposta de ${amount} ✦ feita!`);
    setBusy(false);
    load();
  }

  async function claim(c: (typeof claimable)[number]) {
    setBusy(true);
    const { data, error } = await sb.from("duel_bets").update({ payout_claimed: true }).eq("id", c.row!.id).eq("payout_claimed", false).select();
    if (!error && data?.length) { await earn(c.value, "Pote do duelo"); toast.success(`+${c.value} ✦ no bolso!`); }
    setBusy(false);
    load();
  }

  return (
    <section className="mb-5 rounded-[22px] border border-border/60 bg-card/60 p-4">
      <div className="flex items-center justify-between">
        <p className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-foreground"><Coins className="h-4 w-4 text-primary" /> Aposta do duelo</p>
        {open ? <span className="text-[12px] tabular-nums text-muted-foreground">Pote: {pot} ✦</span> : null}
      </div>
      {claimable.map((c) => (
        <Button key={c.duel.id} className="mt-3 w-full" disabled={busy} onClick={() => claim(c)}>
          Resgatar {c.value} ✦ · {c.duel.deckName}
        </Button>
      ))}
      {!open ? (
        <p className="mt-2 text-[12px] text-muted-foreground">Quando um duelo estiver aberto, você pode apostar Arlys. Quem vencer leva o pote.</p>
      ) : myOpen ? (
        <p className="mt-2 text-[12px] text-muted-foreground">Você apostou {myOpen.amount} ✦. Quem vencer leva tudo; sem vencedor, cada um recebe a sua de volta.</p>
      ) : (
        <div className="mt-3 flex items-center gap-2">
          <input type="number" min={BET_MIN} max={BET_MAX} value={amount} onChange={(e) => setAmount(Number(e.target.value))}
            className="h-10 w-24 rounded-xl border border-border bg-background px-3 text-[14px] tabular-nums text-foreground" />
          <Button className="flex-1" disabled={busy} onClick={place}>Apostar ✦</Button>
        </div>
      )}
    </section>
  );
}

export function SecretCardComposer({ meId }: { meId: ProfileId }) {
  const opp = profileMeta(otherProfile(meId));
  const week = currentWeekKey();
  const [sent, setSent] = useState<boolean | null>(null);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  useEffect(() => {
    sb.from("secret_cards").select("id").eq("from_profile", meId).eq("week_key", week).then(({ data }: any) => setSent(!!data?.length));
  }, [meId, week]);

  async function send() {
    if (!front.trim() || !back.trim()) return;
    const { error } = await sb.from("secret_cards").insert({ from_profile: meId, to_profile: otherProfile(meId), front: front.trim(), back: back.trim(), week_key: week, reward: SECRET_CARD_REWARD });
    if (error) return toast.error("Você já mandou a carta secreta desta semana.");
    setSent(true);
    toast.success(`Carta secreta enviada! Vai cair na revisão de ${opp.name}.`);
  }

  return (
    <section className="mb-5 rounded-[22px] border border-border/60 bg-card/60 p-4">
      <p className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-foreground"><Mail className="h-4 w-4 text-primary" /> Carta secreta</p>
      {sent ? (
        <p className="mt-2 text-[12px] text-muted-foreground">Carta desta semana enviada. Toda semana você pode mandar uma nova.</p>
      ) : (
        <>
          <p className="mt-1 text-[12px] text-muted-foreground">1 por semana. Cai de surpresa na revisão de {opp.name} e vale {SECRET_CARD_REWARD} ✦ se ela acertar.</p>
          <input value={front} onChange={(e) => setFront(e.target.value)} maxLength={160} placeholder="Frente (em inglês)" className="mt-3 h-10 w-full rounded-xl border border-border bg-background px-3 text-[14px] text-foreground" />
          <input value={back} onChange={(e) => setBack(e.target.value)} maxLength={160} placeholder="Resposta" className="mt-2 h-10 w-full rounded-xl border border-border bg-background px-3 text-[14px] text-foreground" />
          <Button className="mt-3 w-full" onClick={send} disabled={!front.trim() || !back.trim()}><Send /> Enviar em segredo</Button>
        </>
      )}
    </section>
  );
}

/** Aparece no meio da revisão quando o parceiro mandou uma carta secreta. */
export function SecretCardDrop({ meId, reviewed, after }: { meId: string; reviewed: number; after: number }) {
  const [card, setCard] = useState<any>(null);
  const [checked, setChecked] = useState(false);
  const [flipped, setFlipped] = useState(false);
  useEffect(() => {
    if (checked || reviewed < after) return;
    setChecked(true);
    sb.from("secret_cards").select("*").eq("to_profile", meId).eq("status", "pending").order("created_at").limit(1).then(({ data }: any) => setCard(data?.[0] ?? null));
  }, [reviewed, after, checked, meId]);
  if (!card) return null;
  const from = profileMeta(card.from_profile as ProfileId);

  async function answer(right: boolean) {
    const { data } = await sb.from("secret_cards").update({ status: right ? "correct" : "wrong", answered_at: new Date().toISOString() }).eq("id", card.id).eq("status", "pending").select();
    if (right && data?.length) { await earn(card.reward, "Carta secreta"); toast.success(`+${card.reward} ✦ — carta secreta de ${from.name}!`); }
    setCard(null);
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-background/80 p-5 backdrop-blur-md">
      <div className="w-full max-w-sm rounded-[26px] border border-primary/40 bg-card p-5 text-center shadow-2xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Carta secreta de {from.name}</p>
        <p className="mt-4 text-[22px] font-semibold text-foreground">{card.front}</p>
        {flipped ? (
          <>
            <p className="mt-3 text-[16px] text-muted-foreground">{card.back}</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => answer(false)}>Errei</Button>
              <Button onClick={() => answer(true)}>Acertei +{card.reward} ✦</Button>
            </div>
          </>
        ) : (
          <Button className="mt-6 w-full" onClick={() => setFlipped(true)}>Mostrar resposta</Button>
        )}
      </div>
    </div>
  );
}
