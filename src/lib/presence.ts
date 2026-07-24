// Presence — pinga profile_data.updated_at periodicamente enquanto o usuário
// está com a aba ativa. Assim conseguimos derivar "online / há X min" ao
// visualizar o perfil do parceiro. O timestamp já existe na tabela, então
// não precisamos de coluna nova.
import { supabase } from "@/integrations/supabase/client";
import { subscribeProfile, getCurrentProfile } from "@/lib/profile";

const HEARTBEAT_MS = 60_000;
let timer: ReturnType<typeof setInterval> | null = null;
let activeId: string | null = null;

async function ping() {
  const p = getCurrentProfile();
  if (!p) return;
  if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
  try {
    await supabase
      .from("profile_data")
      .update({ updated_at: new Date().toISOString() })
      .eq("profile_id", p.id);
  } catch {
    /* silent — presença é best-effort */
  }
}

function start() {
  if (timer) return;
  void ping();
  timer = setInterval(() => void ping(), HEARTBEAT_MS);
}

function stop() {
  if (timer) clearInterval(timer);
  timer = null;
}

if (typeof window !== "undefined") {
  subscribeProfile(() => {
    const p = getCurrentProfile();
    if (p && p.id !== activeId) {
      activeId = p.id;
      start();
    } else if (!p) {
      activeId = null;
      stop();
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void ping();
  });
  window.addEventListener("focus", () => void ping());
}

export function formatPresence(iso: string | null | undefined): {
  online: boolean;
  label: string;
} {
  if (!iso) return { online: false, label: "offline" };
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return { online: true, label: "online agora" };
  if (mins < 60) {
    return { online: false, label: `online há ${mins} ${mins === 1 ? "minuto" : "minutos"}` };
  }
  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    return { online: false, label: `online há ${hours} ${hours === 1 ? "hora" : "horas"}` };
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return { online: false, label: `online há ${days} ${days === 1 ? "dia" : "dias"}` };
  }
  const weeks = Math.floor(days / 7);
  if (weeks < 4) {
    return { online: false, label: `online há ${weeks} ${weeks === 1 ? "semana" : "semanas"}` };
  }
  const months = Math.floor(days / 30);
  return { online: false, label: `online há ${months} ${months === 1 ? "mês" : "meses"}` };
}
