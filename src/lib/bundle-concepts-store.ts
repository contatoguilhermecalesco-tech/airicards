import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ConceptGalleryItem = {
  url: string;
  caption?: string | null;
  tag?: string | null;
};

export type BundleConcept = {
  id: string;
  title: string;
  tagline: string | null;
  concept: string;
  palette: string;
  splash_url: string | null;
  shop_bundle_id: string | null;
  gallery: ConceptGalleryItem[];
  created_at: string;
};

let items: BundleConcept[] = [];
let snapshot = { items };
const listeners = new Set<() => void>();
function emit() {
  snapshot = { items };
  listeners.forEach((l) => l());
}

async function fetchAll() {
  const { data, error } = await supabase
    .from("bundle_concepts" as any)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (!error && data) {
    items = data as unknown as BundleConcept[];
    emit();
  }
}

let channel: ReturnType<typeof supabase.channel> | null = null;

export async function initBundleConcepts() {
  if (typeof window === "undefined") return;
  await fetchAll();
  if (channel) {
    void supabase.removeChannel(channel);
    channel = null;
  }
  channel = supabase
    .channel("bundle-concepts-live")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "bundle_concepts" },
      () => {
        void fetchAll();
      },
    )
    .subscribe();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
const SERVER: typeof snapshot = { items: [] };

export function useBundleConcepts() {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => SERVER,
  );
}

type Input = {
  title: string;
  tagline?: string | null;
  concept: string;
  palette: string;
  splash_url?: string | null;
  shop_bundle_id?: string | null;
  gallery?: ConceptGalleryItem[];
};

function normalizeGallery(g?: ConceptGalleryItem[]): ConceptGalleryItem[] {
  if (!Array.isArray(g)) return [];
  return g
    .filter((it) => it && typeof it.url === "string" && it.url.trim().length > 0)
    .map((it) => ({
      url: it.url.trim(),
      caption: it.caption?.trim() || null,
      tag: it.tag?.trim() || null,
    }));
}

export async function createBundleConcept(input: Input) {
  const { data, error } = await supabase
    .from("bundle_concepts" as any)
    .insert({
      title: input.title.trim(),
      tagline: input.tagline?.trim() || null,
      concept: input.concept.trim(),
      palette: input.palette || "#a855f7",
      splash_url: input.splash_url?.trim() || null,
      shop_bundle_id: input.shop_bundle_id?.trim() || null,
      gallery: normalizeGallery(input.gallery),
    })
    .select("*")
    .single();
  if (error) throw error;
  await fetchAll();
  return data as unknown as BundleConcept;
}

export async function updateBundleConcept(id: string, input: Input) {
  const { data, error } = await supabase
    .from("bundle_concepts" as any)
    .update({
      title: input.title.trim(),
      tagline: input.tagline?.trim() || null,
      concept: input.concept.trim(),
      palette: input.palette || "#a855f7",
      splash_url: input.splash_url?.trim() || null,
      shop_bundle_id: input.shop_bundle_id?.trim() || null,
      gallery: normalizeGallery(input.gallery),
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  await fetchAll();
  return data as unknown as BundleConcept;
}

export async function deleteBundleConcept(id: string) {
  const { error } = await supabase
    .from("bundle_concepts" as any)
    .delete()
    .eq("id", id);
  if (error) throw error;
  await fetchAll();
}
