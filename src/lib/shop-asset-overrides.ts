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
};

export function getEquippedArt(walletKey: string | undefined | null): string | undefined {
  if (!walletKey) return undefined;
  return EQUIPPED_ART_BY_KEY[walletKey];
}
