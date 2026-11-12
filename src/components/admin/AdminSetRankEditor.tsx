import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { PROFILES } from "@/lib/profile";
import { DIVISION_ROMAN, TIER_COLORS, TIER_LABEL, readRankForProfile, refreshAllRanks, type Division, type Tier } from "@/lib/rank-store";
import { ADMIN_TIERS, ELITE_LP_RANGE, isEliteTier, normalizeRankTarget } from "@/lib/rank-override";
import { adminSetRankFn } from "@/lib/admin.functions";
import { RankEmblem } from "@/components/RankBadge";

const DIVISIONS: Exclude<Division, null>[] = [4, 3, 2, 1];

export function AdminSetRankEditor() {
  const [profileId, setProfileId] = useState(PROFILES[0]?.id ?? "");
  const [tier, setTier] = useState<Tier>("diamond");
  const [division, setDivision] = useState<Exclude<Division, null>>(4);
  const [lpRaw, setLpRaw] = useState("0");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  const elite = isEliteTier(tier);
  const target = normalizeRankTarget(tier, elite ? null : division, Number(lpRaw) || 0);
  const label = `${TIER_LABEL[tier]}${target.division ? ` ${DIVISION_ROMAN[target.division as 1 | 2 | 3 | 4]}` : ""}`;
  const colors = TIER_COLORS[tier];
  const profile = PROFILES.find((p) => p.id === profileId);
  const current = readRankForProfile(profileId);

  function pickTier(t: Tier) {
    setTier(t);
    setStatus(null);
    if (isEliteTier(t)) setLpRaw(String(ELITE_LP_RANGE[t as keyof typeof ELITE_LP_RANGE][0]));
    else if (Number(lpRaw) > 99) setLpRaw("0");
  }

  async function apply() {
    setBusy(true);
    setStatus(null);
    try {
      await adminSetRankFn({ data: { profileId, tier: target.tier, division: target.division, lp: target.lp, label } });
      await refreshAllRanks();
      setStatus({ ok: true, text: `${profile?.name ?? "Perfil"} agora está em ${label} · ${target.lp} LP` });
    } catch (e) {
      console.error("[airi/admin] set rank failed", e);
      setStatus({ ok: false, text: "Não foi possível definir o elo. Tente novamente." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ios-card mt-4 rounded-3xl p-4 sm:p-5">
      <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">Definir elo</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Escolha o perfil e o elo. A mudança vale em todos os aparelhos da pessoa.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {PROFILES.map((p) => {
          const active = p.id === profileId;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => { setProfileId(p.id); setStatus(null); }}
              className={`flex min-h-11 items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-medium transition ${active ? "border-primary/60 bg-primary/15 text-foreground" : "border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:text-foreground"}`}
            >
              <span aria-hidden className="h-6 w-6 shrink-0 rounded-full" style={{ backgroundImage: p.gradient }} />
              {p.name}
            </button>
          );
        })}
      </div>
      {current && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          Atual: {TIER_LABEL[current.tier]}{current.division ? ` ${DIVISION_ROMAN[current.division]}` : ""} · {current.lp} LP
        </p>
      )}

      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Elo</p>
      <div className="mt-2 grid grid-cols-5 gap-2">
        {ADMIN_TIERS.map((t) => {
          const active = t === tier;
          const c = TIER_COLORS[t];
          return (
            <button
              key={t}
              type="button"
              onClick={() => pickTier(t)}
              aria-pressed={active}
              className={`flex flex-col items-center gap-1 rounded-2xl border px-1 py-2 transition ${active ? "bg-white/[0.06]" : "border-white/[0.05] bg-white/[0.02] opacity-70 hover:opacity-100"}`}
              style={active ? { borderColor: c.ring, boxShadow: `0 0 0 1px ${c.glow}` } : undefined}
            >
              <RankEmblem tier={t} division={isEliteTier(t) ? null : 4} size={30} />
              <span className="w-full truncate text-center text-[10px] font-medium" style={{ color: active ? c.text : undefined }}>
                {TIER_LABEL[t]}
              </span>
            </button>
          );
        })}
      </div>

      {!elite && (
        <>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Divisão</p>
          <div className="mt-2 grid grid-cols-4 gap-1 rounded-2xl bg-white/[0.03] p-1">
            {DIVISIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => { setDivision(d); setStatus(null); }}
                className={`min-h-10 rounded-xl text-sm font-semibold transition ${division === d ? "bg-white/[0.1] text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {DIVISION_ROMAN[d]}
              </button>
            ))}
          </div>
        </>
      )}

      <label className="mt-4 block">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          LP {elite ? `(${ELITE_LP_RANGE[tier as keyof typeof ELITE_LP_RANGE].join("–")})` : "(0–99)"}
        </span>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={lpRaw}
          onChange={(e) => { setLpRaw(e.target.value); setStatus(null); }}
          className="mt-2 h-11 w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 text-base tabular-nums outline-none focus:border-primary/60"
        />
      </label>

      <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
        <RankEmblem tier={target.tier} division={target.division} size={44} />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-muted-foreground">{profile?.name} ficará em</p>
          <p className="text-sm font-semibold" style={{ color: colors.text }}>
            {label} · {target.lp} LP
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => void apply()}
        disabled={busy || !profileId}
        className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" strokeWidth={2.5} />}
        Aplicar elo
      </button>
      {status && (
        <p className={`mt-2 text-center text-xs ${status.ok ? "text-primary" : "text-destructive"}`}>{status.text}</p>
      )}
      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        O pico da temporada passa a ser o elo definido, e a calibração é encerrada. LP ganho e histórico são mantidos.
      </p>
    </section>
  );
}
