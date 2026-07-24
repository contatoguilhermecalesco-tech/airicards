import { supabase } from "@/integrations/supabase/client";
import {
  createCard,
  createDeck,
  type Card,
  type CardMode,
  type Deck,
} from "@/lib/flashcards-store";
import { slugify } from "@/lib/share";

export type PublishedDeckRow = {
  id: string;
  owner_profile_id: string;
  owner_name: string;
  slug: string;
  name: string;
  description: string;
  color_key: string;
  card_count: number;
  cards: PublishedCard[];
  likes: number;
  imports: number;
  price: number;
  created_at: string;
  updated_at: string;
};

export type PublishedCard = {
  front: string;
  back: string;
  mode?: CardMode;
  targetWord?: string;
  source?: string;
};

/**
 * Publica ou atualiza um deck no marketplace (upsert por owner_profile_id + slug).
 */
export async function publishDeck(input: {
  ownerId: string;
  ownerName: string;
  deck: Deck;
  cards: Card[];
  price?: number;
}): Promise<PublishedDeckRow> {
  const payload: PublishedCard[] = input.cards.map((c) => ({
    front: c.front,
    back: c.back,
    ...(c.mode ? { mode: c.mode } : {}),
    ...(c.targetWord ? { targetWord: c.targetWord } : {}),
    ...(c.source ? { source: c.source } : {}),
  }));

  const row = {
    owner_profile_id: input.ownerId,
    owner_name: input.ownerName,
    slug: slugify(input.deck.name),
    name: input.deck.name,
    description: input.deck.description ?? "",
    color_key: input.deck.color ?? "lavender",
    card_count: payload.length,
    cards: payload,
    price: Math.max(0, Math.floor(input.price ?? 0)),
  };

  const { data, error } = await supabase
    .from("published_decks")
    .upsert(row, { onConflict: "owner_profile_id,slug" })
    .select("*")
    .single();

  if (error || !data) throw error ?? new Error("Falha ao publicar deck");
  return data as unknown as PublishedDeckRow;
}

export async function unpublishDeck(ownerId: string, deckName: string) {
  const slug = slugify(deckName);
  const { error } = await supabase
    .from("published_decks")
    .delete()
    .eq("owner_profile_id", ownerId)
    .eq("slug", slug);
  if (error) throw error;
}

export async function findPublishedDeck(
  ownerId: string,
  deckName: string,
): Promise<PublishedDeckRow | null> {
  const slug = slugify(deckName);
  const { data, error } = await supabase
    .from("published_decks")
    .select("*")
    .eq("owner_profile_id", ownerId)
    .eq("slug", slug)
    .maybeSingle();
  if (error) return null;
  return (data as unknown as PublishedDeckRow | null) ?? null;
}

export async function listPublishedDecks(): Promise<PublishedDeckRow[]> {
  const { data, error } = await supabase
    .from("published_decks")
    .select("*")
    .order("likes", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(120);
  if (error || !data) return [];
  return data as unknown as PublishedDeckRow[];
}

/** Incrementa curtidas atomicamente via read+update (RLS permissiva). */
export async function likePublishedDeck(id: string): Promise<number | null> {
  const { data: current, error: readErr } = await supabase
    .from("published_decks")
    .select("likes")
    .eq("id", id)
    .maybeSingle();
  if (readErr || !current) return null;
  const next = (current.likes ?? 0) + 1;
  const { error: updErr } = await supabase
    .from("published_decks")
    .update({ likes: next })
    .eq("id", id);
  if (updErr) return null;
  return next;
}

/** Importa o deck público como cópia na biblioteca do usuário atual. */
export async function importPublishedDeck(row: PublishedDeckRow): Promise<string> {
  const newDeck = createDeck(row.name, row.description || undefined, row.color_key);
  for (const c of row.cards) {
    createCard(newDeck.id, c.front, c.back, {
      mode: c.mode,
      targetWord: c.targetWord,
      source: c.source,
    });
  }
  // best-effort: bump imports counter
  try {
    await supabase
      .from("published_decks")
      .update({ imports: (row.imports ?? 0) + 1 })
      .eq("id", row.id);
  } catch {
    /* ignore */
  }
  return newDeck.id;
}
