// Arte dedicada (ícones premium) dos cosméticos temáticos do Eclipse.
// Mapeada pela chave do cosmético (payload.key) — usada na loja e nas prévias.
import brasaCarmesim from "@/assets/cosmetic-brasa-carmesim.png";
import seloEclipse from "@/assets/cosmetic-selo-eclipse.png";
import ascensaoCarmesim from "@/assets/cosmetic-ascensao-carmesim.png";
import arautoEclipse from "@/assets/cosmetic-arauto-eclipse.png";
import eclipseVivo from "@/assets/cosmetic-eclipse-vivo.png";

export const COSMETIC_ART: Record<string, string> = {
  brasa_carmesim: brasaCarmesim,
  selo_eclipse: seloEclipse,
  ascensao_carmesim: ascensaoCarmesim,
  arauto_eclipse: arautoEclipse,
  eclipse_vivo: eclipseVivo,
};

function normalize(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null;
  const idx = value.indexOf(":");
  return idx === -1 ? value : value.slice(idx + 1);
}

/** Retorna a arte do cosmético a partir de um payload de item da loja. */
export function cosmeticArtFor(
  payload: Record<string, unknown> | null | undefined,
): string | null {
  if (!payload) return null;
  const key =
    normalize(payload.key) ??
    normalize(payload.value) ??
    normalize(payload.id);
  return (key && COSMETIC_ART[key]) || null;
}

/** Retorna a arte a partir da chave crua do cosmético. */
export function cosmeticArtByKey(key: string | null | undefined): string | null {
  const k = normalize(key);
  return (k && COSMETIC_ART[k]) || null;
}
