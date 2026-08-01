// Arte dedicada (ícones premium) dos cosméticos temáticos do Eclipse.
// Mapeada pela chave do cosmético (payload.key) — usada na loja e nas prévias.
import brasaCarmesim from "@/assets/cosmetic-brasa-carmesim.png";
import seloEclipse from "@/assets/cosmetic-selo-eclipse.png";
import ascensaoCarmesim from "@/assets/cosmetic-ascensao-carmesim.png";
import arautoEclipse from "@/assets/cosmetic-arauto-eclipse.png";
import eclipseVivo from "@/assets/cosmetic-eclipse-vivo.png";
import chamaEspiritual from "@/assets/cosmetic-chama-espiritual.png";
import seloEspiritual from "@/assets/cosmetic-selo-espiritual.png";
import ascensaoEspiritual from "@/assets/cosmetic-ascensao-espiritual.png";
import guardiaNevoa from "@/assets/cosmetic-guardia-nevoa.png";
import chamaMarionete from "@/assets/shop/marionete/chama.png";
import chamaVigilia from "@/assets/shop/princesa/chama.png";
import seloMarionete from "@/assets/shop/marionete/selo.png";
import ascensaoMarionete from "@/assets/shop/marionete/ascensao.png";
import olhoVigilia from "@/assets/shop/princesa/selo.png";
import ascensaoVigilia from "@/assets/shop/princesa/ascensao.png";

export const COSMETIC_ART: Record<string, string> = {
  brasa_carmesim: brasaCarmesim,
  selo_eclipse: seloEclipse,
  ascensao_carmesim: ascensaoCarmesim,
  arauto_eclipse: arautoEclipse,
  eclipse_vivo: eclipseVivo,
  chama_espiritual: chamaEspiritual,
  selo_espiritual: seloEspiritual,
  ascensao_espiritual: ascensaoEspiritual,
  guardia_nevoa: guardiaNevoa,
  chama_marionete: chamaMarionete,
  chama_vigilia: chamaVigilia,
  selo_marionete: seloMarionete,
  ascensao_marionete: ascensaoMarionete,
  olho_vigilia: olhoVigilia,
  ascensao_vigilia: ascensaoVigilia,
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
