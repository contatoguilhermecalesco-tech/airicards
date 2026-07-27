// CRUD + upload helpers for the shop's featured vitrine slots.
// Admin-only writes; everyone authenticated reads.
import { supabase } from "@/integrations/supabase/client";
import type { Rarity } from "@/components/shop/shop-visuals";

export type FeaturedSlotRow = {
  id: string;
  item_kind: "shop_item" | "deck";
  item_id: string;
  splash_url: string | null;
  art_url: string | null;
  tagline: string | null;
  description_override: string | null;
  rarity_override: Rarity | null;
  position: number;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
};

const BUCKET = "shop-featured";
// 10 years — signed URL that effectively never expires.
const SIGN_EXPIRY_SECONDS = 60 * 60 * 24 * 365 * 10;

export async function listFeaturedSlots(): Promise<FeaturedSlotRow[]> {
  const { data, error } = await supabase
    .from("shop_featured_slots")
    .select("*")
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []) as FeaturedSlotRow[];
}

export async function listActiveFeaturedSlots(): Promise<FeaturedSlotRow[]> {
  const all = await listFeaturedSlots();
  const now = Date.now();
  return all.filter((s) => {
    if (!s.active) return false;
    if (s.starts_at && +new Date(s.starts_at) > now) return false;
    if (s.ends_at && +new Date(s.ends_at) < now) return false;
    return true;
  });
}

export async function createFeaturedSlot(input: {
  item_kind: FeaturedSlotRow["item_kind"];
  item_id: string;
  position?: number;
}): Promise<FeaturedSlotRow> {
  const { data, error } = await supabase
    .from("shop_featured_slots")
    .insert({
      item_kind: input.item_kind,
      item_id: input.item_id,
      position: input.position ?? 0,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as FeaturedSlotRow;
}

export async function updateFeaturedSlot(
  id: string,
  patch: Partial<Omit<FeaturedSlotRow, "id" | "created_at" | "updated_at">>,
): Promise<FeaturedSlotRow> {
  const { data, error } = await supabase
    .from("shop_featured_slots")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as FeaturedSlotRow;
}

export async function deleteFeaturedSlot(row: FeaturedSlotRow): Promise<void> {
  // Best-effort remove assets first.
  const paths: string[] = [];
  const splashKey = extractKey(row.splash_url);
  const artKey = extractKey(row.art_url);
  if (splashKey) paths.push(splashKey);
  if (artKey) paths.push(artKey);
  if (paths.length > 0) {
    await supabase.storage.from(BUCKET).remove(paths).catch(() => undefined);
  }
  const { error } = await supabase
    .from("shop_featured_slots")
    .delete()
    .eq("id", row.id);
  if (error) throw error;
}

export async function uploadSlotAsset(
  slotId: string,
  variant: "splash" | "art",
  file: File,
): Promise<string> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const key = `${slotId}/${variant}-${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(key, file, { upsert: true, contentType: file.type || undefined });
  if (upErr) throw upErr;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(key, SIGN_EXPIRY_SECONDS);
  if (error || !data?.signedUrl) throw error ?? new Error("failed to sign url");
  return data.signedUrl;
}

export async function reorderSlots(orderedIds: string[]): Promise<void> {
  // Sequential to keep RLS simple; small N.
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("shop_featured_slots")
      .update({ position: i })
      .eq("id", orderedIds[i]);
    if (error) throw error;
  }
}

function extractKey(url: string | null): string | null {
  if (!url) return null;
  // Signed URLs look like /storage/v1/object/sign/shop-featured/<key>?token=...
  const m = url.match(/\/shop-featured\/([^?]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}
