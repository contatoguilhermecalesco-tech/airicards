import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Check, Clock3, Loader2, Save, ShieldCheck, Wrench } from "lucide-react";
import { adminFetchAreaMaintenanceFn, adminSetAreaMaintenanceFn, type AppAreaMaintenanceRow } from "@/lib/admin.functions";

const AREAS = [
  { key: "social", label: "Social", description: "Feed, curtidas, comentários e atividades dos amigos." },
  { key: "review", label: "Revisão", description: "Sessões de revisão e repetição de cartas." },
  { key: "library", label: "Biblioteca", description: "Decks, cartas e organização da biblioteca." },
  { key: "study", label: "Estudo", description: "Trilhas, conteúdos e atividades de estudo." },
  { key: "duels", label: "Duelos", description: "Disputas e partidas entre jogadores." },
  { key: "challenges", label: "Desafios", description: "Missões e objetivos." },
  { key: "rank", label: "Rank", description: "Classificação e evolução competitiva." },
  { key: "achievements", label: "Conquistas", description: "Marcos, medalhas e recompensas." },
  { key: "shop", label: "Loja", description: "Loja, compras e pacotes." },
  { key: "inventory", label: "Inventário", description: "Itens e personalizações." },
  { key: "enemies", label: "Inimigas", description: "Cartas difíceis e arena." },
  { key: "news", label: "Novidades", description: "Novidades e notas de atualização." },
  { key: "profile", label: "Perfil", description: "Perfil público e personalização." },
  { key: "forge", label: "Forja", description: "Fragmentos e criação de cosméticos." },
  { key: "settings", label: "Configurações", description: "Preferências e configurações da conta." },
] as const;

const DEFAULT_MESSAGE = "Esta seção está passando por uma manutenção temporária para melhorar sua experiência no AIRI. Voltaremos em breve!";

function getActionErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === "object") {
    const value = error as Record<string, unknown>;
    const candidates = [value.message, value.error, value.data, value.cause, value.statusText];
    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim()) return candidate;
      if (candidate && typeof candidate === "object") {
        const nested = candidate as Record<string, unknown>;
        for (const key of ["message", "error", "description"]) {
          if (typeof nested[key] === "string" && nested[key]) return nested[key] as string;
        }
      }
    }
  }
  return fallback;
}

export function MaintenanceAdminSection() {
  const fetchSettings = useServerFn(adminFetchAreaMaintenanceFn);
  const saveSetting = useServerFn(adminSetAreaMaintenanceFn);
  const [rows, setRows] = useState<AppAreaMaintenanceRow[]>([]);
  const [selected, setSelected] = useState<string>("social");
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [expectedReturn, setExpectedReturn] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const current = rows.find((row) => row.area_key === selected);
  const enabledCount = useMemo(() => rows.filter((row) => row.enabled).length, [rows]);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchSettings();
      setRows(data);
      const active = data.find((row) => row.area_key === selected) ?? data[0];
      if (active) {
        setSelected(active.area_key);
        setMessage(active.message || DEFAULT_MESSAGE);
        setExpectedReturn(active.expected_return_at ? new Date(active.expected_return_at).toISOString().slice(0, 16) : "");
        setInternalNote(active.internal_note ?? "");
      }
    } catch (error) {
      setFeedback(getActionErrorMessage(error, "Não foi possível carregar as áreas."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  function chooseArea(key: string) {
    setSelected(key);
    const row = rows.find((item) => item.area_key === key);
    setMessage(row?.message || DEFAULT_MESSAGE);
    setExpectedReturn(row?.expected_return_at ? new Date(row.expected_return_at).toISOString().slice(0, 16) : "");
    setInternalNote(row?.internal_note ?? "");
    setFeedback(null);
  }

  async function persist(enabled: boolean) {
    setSaving(true);
    setFeedback(null);
    try {
      const saved = await saveSetting({ data: {
        areaKey: selected as typeof AREAS[number]["key"],
        enabled,
        message: message.trim() || DEFAULT_MESSAGE,
        expectedReturnAt: expectedReturn ? new Date(expectedReturn).toISOString() : null,
        internalNote: internalNote.trim() || null,
      } });
      setRows((previous) => [...previous.filter((row) => row.area_key !== saved.area_key), saved]);
      setFeedback(enabled ? "Manutenção ativada. A área foi bloqueada para os usuários." : "Área liberada. O acesso foi restaurado.");
    } catch (error) {
      setFeedback(getActionErrorMessage(error, "Não foi possível salvar a configuração. Verifique o console do navegador para detalhes."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-5 py-1">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Disponibilidade das áreas</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Bloqueie temporariamente uma seção sem removê-la da navegação.</p>
        </div>
        <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[11px] font-semibold text-amber-300">
          {enabledCount} em manutenção
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando configurações…</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <div className="space-y-2">
            {AREAS.map((area) => {
              const active = rows.find((row) => row.area_key === area.key)?.enabled ?? false;
              return (
                <button key={area.key} onClick={() => chooseArea(area.key)} className={`w-full rounded-xl border p-3 text-left transition ${selected === area.key ? "border-primary/40 bg-primary/[0.07]" : "border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.045]"}`}>
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold text-foreground">{area.label}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${active ? "bg-amber-400/10 text-amber-300" : "bg-emerald-400/10 text-emerald-300"}`}>{active ? "Manutenção" : "Disponível"}</span>
                  </span>
                  <span className="mt-1 block text-[10.5px] leading-relaxed text-muted-foreground">{area.description}</span>
                </button>
              );
            })}
          </div>

          <div className="space-y-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl border border-amber-400/20 bg-amber-400/10 text-amber-300"><Wrench className="h-4 w-4" /></span>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Configurar {AREAS.find((area) => area.key === selected)?.label}</h3>
                <p className="text-[10px] text-muted-foreground">As alterações são aplicadas imediatamente após salvar.</p>
              </div>
            </div>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-foreground">Mensagem para os usuários</span>
              <textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={500} rows={4} className="w-full resize-y rounded-xl border border-border bg-surface px-3 py-2.5 text-xs leading-relaxed outline-none focus:border-primary/60" />
              <span className="text-right text-[10px] text-muted-foreground">{message.length}/500</span>
            </label>

            <label className="block space-y-1.5">
              <span className="flex items-center gap-1.5 text-xs font-medium text-foreground"><Clock3 className="h-3.5 w-3.5 text-muted-foreground" /> Previsão de retorno (opcional)</span>
              <input type="datetime-local" value={expectedReturn} onChange={(event) => setExpectedReturn(event.target.value)} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-xs outline-none focus:border-primary/60" />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-foreground">Nota interna (somente Admin)</span>
              <textarea value={internalNote} onChange={(event) => setInternalNote(event.target.value)} maxLength={1000} rows={2} placeholder="Motivo da manutenção, investigação em andamento…" className="w-full resize-y rounded-xl border border-border bg-surface px-3 py-2.5 text-xs outline-none focus:border-primary/60" />
            </label>

            <div className="rounded-xl border border-amber-400/15 bg-amber-400/[0.05] p-3">
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                <p className="text-[10.5px] leading-relaxed text-muted-foreground">A área continuará visível no aplicativo. Usuários comuns verão o aviso de manutenção; administradores poderão acessar a funcionalidade para testar.</p>
              </div>
            </div>

            {feedback && <p role="status" className="text-xs text-muted-foreground">{feedback}</p>}

            <div className="grid grid-cols-2 gap-2">
              <button disabled={saving || (!current?.enabled && !message.trim())} onClick={() => void persist(true)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-400/25 bg-amber-400/10 px-3 py-2.5 text-xs font-semibold text-amber-200 transition hover:bg-amber-400/15 disabled:opacity-50">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <AlertTriangle className="h-3.5 w-3.5" />} Ativar manutenção
              </button>
              <button disabled={saving || !current?.enabled} onClick={() => void persist(false)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-3 py-2.5 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-400/15 disabled:opacity-50">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Liberar área
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
