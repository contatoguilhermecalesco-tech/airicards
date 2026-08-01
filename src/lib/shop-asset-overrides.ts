// Curated visual assets for signature shop items and bundles.
// Keyed by shop item id. Used by the shop grid, hero and bundle detail modal
// so cosmetics show their true art instead of generic previews.
import florescerSplash from "@/assets/shop/florescer/splash-hero.jpg";
import florescerAura from "@/assets/shop/florescer/aura.png";
import florescerFrame from "@/assets/shop/florescer/frame.png";

import florescerBackground from "@/assets/shop/florescer/background.png";
import florescerCardframe from "@/assets/shop/florescer/cardframe.png";
import florescerCompanion from "@/assets/shop/florescer/companion.png";
import florescerSakura from "@/assets/shop/florescer/sakura-overlay.png";

import monarcaSplash from "@/assets/shop/monarca/splash-hero.jpg";
import monarcaAura from "@/assets/shop/monarca/aura.png";
import monarcaFrame from "@/assets/shop/monarca/frame.png";
import monarcaBackground from "@/assets/shop/monarca/background.png";
import monarcaCardframe from "@/assets/shop/monarca/cardframe.png";
import monarcaCompanion from "@/assets/shop/monarca/companion.png";
import monarcaOverlay from "@/assets/shop/monarca/sakura-overlay.png";

import eclipseSplash from "@/assets/shop/eclipse/splash-hero.jpg";
import eclipseAura from "@/assets/shop/eclipse/aura.png";
import eclipseFrame from "@/assets/shop/eclipse/frame.png";
import eclipseBackground from "@/assets/shop/eclipse/background.png";
import eclipseCardframe from "@/assets/shop/eclipse/cardframe.png";
import eclipseCompanion from "@/assets/shop/eclipse/companion.png";
import eclipsePetals from "@/assets/shop/eclipse/petals-overlay.png";
import eclipseTableBack from "@/assets/shop/eclipse/table-cardback.png";
import eclipseBrasa from "@/assets/cosmetic-brasa-carmesim.png";
import eclipseSelo from "@/assets/cosmetic-selo-eclipse.png";
import eclipseAscensao from "@/assets/cosmetic-ascensao-carmesim.png";
import eclipseArauto from "@/assets/cosmetic-arauto-eclipse.png";
import eclipseVivo from "@/assets/cosmetic-eclipse-vivo.png";

import espiritoSplash from "@/assets/shop/espirito/splash-hero.jpg";
import espiritoAura from "@/assets/shop/espirito/aura.png";
import espiritoFrame from "@/assets/shop/espirito/frame.png";
import espiritoBackground from "@/assets/shop/espirito/background.png";
import espiritoCardframe from "@/assets/shop/espirito/cardframe.png";
import espiritoCompanion from "@/assets/shop/espirito/companion.png";
import espiritoPetals from "@/assets/shop/espirito/petals-overlay.png";
import espiritoTableBack from "@/assets/shop/espirito/table-cardback.png";
import espiritoChama from "@/assets/cosmetic-chama-espiritual.png";
import espiritoSelo from "@/assets/cosmetic-selo-espiritual.png";
import espiritoAscensao from "@/assets/cosmetic-ascensao-espiritual.png";
import espiritoTitulo from "@/assets/cosmetic-guardia-nevoa.png";
import princesaSplash from "@/assets/shop/princesa/splash-hero.png";
import princesaAura from "@/assets/shop/princesa/aura.png";
import princesaFrame from "@/assets/shop/princesa/frame.png";
import princesaBackground from "@/assets/shop/princesa/background.png";
import princesaCardframe from "@/assets/shop/princesa/cardframe.png";
import princesaTableBack from "@/assets/shop/princesa/table-ambient.jpg";
import princesaChama from "@/assets/shop/princesa/chama.png";
import princesaSelo from "@/assets/shop/princesa/selo.png";
import princesaAscensao from "@/assets/shop/princesa/ascensao.png";

import marioneteSplash from "@/assets/shop/marionete/splash-hero.jpg";
import marioneteAura from "@/assets/shop/marionete/aura.png";
import marioneteFrame from "@/assets/shop/marionete/frame.png";
import marioneteBackground from "@/assets/shop/marionete/background.png";
import marioneteCardframe from "@/assets/shop/marionete/cardframe.png";
import marioneteTableAmbient from "@/assets/shop/marionete/table-ambient.jpg";
import marioneteTableFrame from "@/assets/shop/marionete/table-frame.png";
import marioneteTableBack from "@/assets/shop/marionete/table-cardback.png";
import marionetePetals from "@/assets/shop/marionete/petals-overlay.png";
import marioneteChama from "@/assets/shop/marionete/chama.png";
import marioneteSelo from "@/assets/shop/marionete/selo.png";
import marioneteAscensao from "@/assets/shop/marionete/ascensao.png";

import piscinaSplash from "@/assets/shop/piscina/splash-hero.jpg";
import piscinaAura from "@/assets/shop/piscina/aura.png";
import piscinaFrame from "@/assets/shop/piscina/ring.png";
import piscinaTableAmbient from "@/assets/shop/piscina/table-ambient.jpg";
import piscinaTableFrame from "@/assets/shop/piscina/table-frame.png";
import piscinaTableBack from "@/assets/shop/piscina/table-cardback.png";
import piscinaChama from "@/assets/shop/piscina/chama.png";








export type ShopAssetOverride = {
  /** Wide hero splash (shop hero + bundle modal background). */
  splash?: string;
  /** Square thumbnail (bundle card art, list rows). */
  art: string;
};

export const SHOP_ASSET_OVERRIDES: Record<string, ShopAssetOverride> = {
  // Master bundle — Florescer Celestial
  "bundle.florescer_celestial": { splash: florescerSplash, art: florescerAura },
  "cosmetic.aura.florescer_celestial": { art: florescerAura },
  "cosmetic.frame.coroa_guardia": { art: florescerFrame },
  "cosmetic.effect.bosque_celestial": { art: florescerBackground },
  "cosmetic.overlay.chuva_sakura": { art: florescerSakura },
  "cosmetic.veil.veu_celestial": { art: florescerCardframe },
  "cosmetic.companion.kitsune_florescer": { art: florescerCompanion },

  // Master bundle — Monarca das Sombras
  "bundle.monarca_sombras": { splash: monarcaSplash, art: monarcaAura },
  "cosmetic.aura.monarca_sombras": { art: monarcaAura },
  "cosmetic.frame.coroa_soberano": { art: monarcaFrame },
  "cosmetic.effect.portal_sombras": { art: monarcaBackground },
  "cosmetic.overlay.exercito_sombras": { art: monarcaOverlay },
  "cosmetic.veil.manto_monarca": { art: monarcaCardframe },
  "cosmetic.companion.igris_cavaleiro": { art: monarcaCompanion },

  // Master bundle — Véu do Crepúsculo (Mítico)
  "bundle.eclipse_carmesim": { splash: eclipseSplash, art: eclipseAura },
  "cosmetic.aura.veu_carmesim": { art: eclipseAura },
  "cosmetic.frame.coroa_crepusculo": { art: eclipseFrame },
  "cosmetic.effect.catedral_eclipse": { art: eclipseBackground },
  "cosmetic.overlay.rosas_crepusculo": { art: eclipsePetals },
  "cosmetic.veil.veu_rubro": { art: eclipseCardframe },
  "cosmetic.companion.corvo_carmesim": { art: eclipseCompanion },
  "cosmetic.table.mesa_eclipse": { art: eclipseTableBack },
  "cosmetic.streak_flame.brasa_carmesim": { art: eclipseBrasa },
  "cosmetic.streak_flame.eclipse_vivo": { art: eclipseVivo },
  "cosmetic.enemy_seal.selo_eclipse": { art: eclipseSelo },
  "cosmetic.title.arauto_eclipse": { art: eclipseArauto },
  "cosmetic.victory_splash.ascensao_carmesim": { art: eclipseAscensao },

  // Master bundle — Névoa Espiritual (Mítico)
  "bundle.nevoa_espiritual": { splash: espiritoSplash, art: espiritoAura },
  "cosmetic.aura.nevoa_espiritual": { art: espiritoAura },
  "cosmetic.frame.coroa_nevoa": { art: espiritoFrame },
  "cosmetic.effect.santuario_espiritual": { art: espiritoBackground },
  "cosmetic.overlay.petalas_espectrais": { art: espiritoPetals },
  "cosmetic.veil.veu_espectral": { art: espiritoCardframe },
  "cosmetic.companion.cordeiro_espiritual": { art: espiritoCompanion },
  "cosmetic.table.mesa_espiritual": { art: espiritoTableBack },
  "cosmetic.streak_flame.chama_espiritual": { art: espiritoChama },
  "cosmetic.enemy_seal.selo_espiritual": { art: espiritoSelo },
  "cosmetic.title.guardia_nevoa": { art: espiritoTitulo },
  "cosmetic.victory_splash.ascensao_espiritual": { art: espiritoAscensao },

  // Master bundle — Princesa Espinho de Prata (Mítico)
  "bundle.princesa_espinho_prata": { splash: princesaSplash, art: princesaAura },
  "cosmetic.aura.espinho_prata": { art: princesaAura },
  "cosmetic.frame.coroa_espinho_prata": { art: princesaFrame },
  "cosmetic.effect.capela_vigilia": { art: princesaBackground },
  "cosmetic.veil.veu_espinho_prata": { art: princesaCardframe },
  "cosmetic.table.mesa_vigilia_prateada": { art: princesaTableBack },
  "cosmetic.streak_flame.chama_vigilia": { art: princesaChama },
  "cosmetic.enemy_seal.olho_vigilia": { art: princesaSelo },
  "cosmetic.victory_splash.ascensao_vigilia": { art: princesaAscensao },

  // Master bundle — Corte das Marionetes (Mítico)
  "bundle.corte_marionetes": { splash: marioneteSplash, art: marioneteAura },
  "cosmetic.aura.corte_marionetes": { art: marioneteAura },
  "cosmetic.frame.coroa_marionete": { art: marioneteFrame },
  "cosmetic.effect.teatro_marionetes": { art: marioneteBackground },
  "cosmetic.veil.veu_marionete": { art: marioneteCardframe },
  "cosmetic.table.mesa_marionetes": { art: marioneteTableAmbient },
  "cosmetic.streak_flame.chama_marionete": { art: marioneteChama },
  "cosmetic.enemy_seal.selo_marionete": { art: marioneteSelo },
  "cosmetic.victory_splash.ascensao_marionete": { art: marioneteAscensao },

  // Master bundle — Piscina Infinita (Épico)
  "bundle.piscina_infinita": { splash: piscinaSplash, art: piscinaAura },
  "cosmetic.aura.piscina_infinita": { art: piscinaAura },
  "cosmetic.frame.coroa_piscina": { art: piscinaFrame },
  "cosmetic.table.mesa_piscina": { art: piscinaTableAmbient },
  "cosmetic.streak_flame.chama_piscina": { art: piscinaChama },
};


export function getShopAssetOverride(itemId: string): ShopAssetOverride | undefined {
  return SHOP_ASSET_OVERRIDES[itemId];
}

/**
 * Map from wallet cosmetic key (`slot:key` as stored in wallet.equipped/cosmetics)
 * to the curated art asset. Used by the profile page to render real bundle art
 * instead of a generic Lucide icon when an item is equipped.
 */
export const EQUIPPED_ART_BY_KEY: Record<string, string> = {
  "decoration:florescer_celestial": florescerAura,
  "nameplate:coroa_guardia": florescerFrame,
  "effect:bosque_celestial": florescerBackground,
  "overlay:chuva_sakura": florescerSakura,
  "veil:veu_celestial": florescerCardframe,
  "companion:kitsune_florescer": florescerCompanion,

  "decoration:monarca_sombras": monarcaAura,
  "nameplate:coroa_soberano": monarcaFrame,
  "effect:portal_sombras": monarcaBackground,
  "overlay:exercito_sombras": monarcaOverlay,
  "veil:manto_monarca": monarcaCardframe,
  "companion:igris_cavaleiro": monarcaCompanion,

  "decoration:veu_carmesim": eclipseAura,
  "nameplate:coroa_crepusculo": eclipseFrame,
  "effect:catedral_eclipse": eclipseBackground,
  "overlay:rosas_crepusculo": eclipsePetals,
  "veil:veu_rubro": eclipseCardframe,
  "companion:corvo_carmesim": eclipseCompanion,
  "table:mesa_eclipse": eclipseTableBack,
  "streak_flame:brasa_carmesim": eclipseBrasa,
  "streak_flame:eclipse_vivo": eclipseVivo,
  "enemy_seal:selo_eclipse": eclipseSelo,
  "title:arauto_eclipse": eclipseArauto,
  "victory_splash:ascensao_carmesim": eclipseAscensao,

  "decoration:nevoa_espiritual": espiritoAura,
  "nameplate:coroa_nevoa": espiritoFrame,
  "effect:santuario_espiritual": espiritoBackground,
  "overlay:petalas_espectrais": espiritoPetals,
  "veil:veu_espectral": espiritoCardframe,
  "companion:cordeiro_espiritual": espiritoCompanion,
  "table:mesa_espiritual": espiritoTableBack,
  "streak_flame:chama_espiritual": espiritoChama,
  "enemy_seal:selo_espiritual": espiritoSelo,
  "title:guardia_nevoa": espiritoTitulo,
  "victory_splash:ascensao_espiritual": espiritoAscensao,

  "decoration:espinho_prata": princesaAura,
  "nameplate:coroa_espinho_prata": princesaFrame,
  "effect:capela_vigilia": princesaBackground,
  "veil:veu_espinho_prata": princesaCardframe,
  "table:mesa_vigilia_prateada": princesaTableBack,
  "streak_flame:chama_vigilia": princesaChama,
  "enemy_seal:olho_vigilia": princesaSelo,
  "victory_splash:ascensao_vigilia": princesaAscensao,

  "decoration:corte_marionetes": marioneteAura,
  "nameplate:coroa_marionete": marioneteFrame,
  "effect:teatro_marionetes": marioneteBackground,
  "veil:veu_marionete": marioneteCardframe,
  "table:mesa_marionetes": marioneteTableAmbient,
  "streak_flame:chama_marionete": marioneteChama,
  "enemy_seal:selo_marionete": marioneteSelo,
  "victory_splash:ascensao_marionete": marioneteAscensao,

  "decoration:piscina_infinita": piscinaAura,
  "nameplate:coroa_piscina": piscinaFrame,
  "table:mesa_piscina": piscinaTableAmbient,
  "streak_flame:chama_piscina": piscinaChama,
};



export function getEquippedArt(walletKey: string | undefined | null): string | undefined {
  if (!walletKey) return undefined;
  return EQUIPPED_ART_BY_KEY[walletKey];
}
