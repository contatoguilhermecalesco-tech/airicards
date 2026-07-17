import { supabase } from "@/integrations/supabase/client";
import { PROFILES, type Profile } from "@/lib/profile";
import type { Card, Deck } from "@/lib/flashcards-store";
import { createCard, createDeck } from "@/lib/flashcards-store";

export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "deck";
}

export function buildShareUrl(ownerId: string, deckName: string): string {
  const path = `/deck/${ownerId}/${slugify(deckName)}`;
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}

export function findProfileById(id: string): Profile | undefined {
  return PROFILES.find((p) => p.id.toLowerCase() === id.toLowerCase());
}

type RemoteState = { decks: Deck[]; cards: Card[] };

export async function fetchSharedDeck(
  ownerId: string,
  slug: string,
): Promise<{ owner: Profile; deck: Deck; cards: Card[] } | null> {
  const owner = findProfileById(ownerId);
  if (!owner) return null;

  const { data, error } = await supabase
    .from("profile_data")
    .select("data")
    .eq("profile_id", owner.id)
    .maybeSingle();
  if (error || !data) return null;

  const state = (data.data ?? { decks: [], cards: [] }) as RemoteState;
  const deck = state.decks.find((d) => slugify(d.name) === slug);
  if (!deck) return null;
  const cards = state.cards.filter((c) => c.deckId === deck.id);
  return { owner, deck, cards };
}

export function importSharedDeck(deck: Deck, cards: Card[]): string {
  const newDeck = createDeck(deck.name, deck.description, deck.color);
  for (const c of cards) {
    createCard(newDeck.id, c.front, c.back);
  }
  return newDeck.id;
}
