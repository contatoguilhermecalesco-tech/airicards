import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

export type BundleConcept = {
  id: string;
  title: string;
  tagline: string | null;
  concept: string;
  palette: string;
  splash_url: string | null;
  shop_bundle_id: string | null;
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
    .from("bundle_concepts" as never)
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
};

export async function createBundleConcept(input: Input) {
  const { data, error } = await supabase
    .from("bundle_concepts" as never)
    .insert({
      title: input.title.trim(),
      tagline: input.tagline?.trim() || null,
      concept: input.concept.trim(),
      palette: input.palette || "#a855f7",
      splash_url: input.splash_url?.trim() || null,
      shop_bundle_id: input.shop_bundle_id?.trim() || null,
    })
    .select("*")
    .single();
  if (error) throw error;
  await fetchAll();
  return data as unknown as BundleConcept;
}

export async function updateBundleConcept(id: string, input: Input) {
  const { data, error } = await supabase
    .from("bundle_concepts" as never)
    .update({
      title: input.title.trim(),
      tagline: input.tagline?.trim() || null,
      concept: input.concept.trim(),
      palette: input.palette || "#a855f7",
      splash_url: input.splash_url?.trim() || null,
      shop_bundle_id: input.shop_bundle_id?.trim() || null,
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
    .from("bundle_concepts" as never)
    .delete()
    .eq("id", id);
  if (error) throw error;
  await fetchAll();
}
