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

export type ShopAssetOverride = {
  /** Wide hero splash (shop hero + bundle modal background). */
  splash?: string;
  /** Square thumbnail (bundle card art, list rows). */
  art: string;
};

export const SHOP_ASSET_OVERRIDES: Record<string, ShopAssetOverride> = {
  // Master bundle
  "bundle.florescer_celestial": { splash: florescerSplash, art: florescerAura },

  // Individual items in the Florescer Celestial bundle
  "cosmetic.aura.florescer_celestial": { art: florescerAura },
  "cosmetic.frame.coroa_guardia": { art: florescerFrame },
  "cosmetic.effect.bosque_celestial": { art: florescerBackground },
  "cosmetic.overlay.chuva_sakura": { art: florescerBackground },
  "cosmetic.veil.veu_celestial": { art: florescerCardframe },
  "cosmetic.companion.kitsune_florescer": { art: florescerCompanion },
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
  "veil:veu_celestial": florescerCardframe,
  "companion:kitsune_florescer": florescerCompanion,
};

export function getEquippedArt(walletKey: string | undefined | null): string | undefined {
  if (!walletKey) return undefined;
  return EQUIPPED_ART_BY_KEY[walletKey];
}
