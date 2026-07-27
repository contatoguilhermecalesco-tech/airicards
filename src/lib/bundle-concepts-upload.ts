import { supabase } from "@/integrations/supabase/client";

const BUCKET = "bundle-concepts";
const SIGN_EXPIRY_SECONDS = 60 * 60 * 24 * 365 * 10; // ~10 years

/**
 * Upload an image for a bundle concept and return a long-lived signed URL
 * ready to be stored in `bundle_concepts.splash_url`.
 */
export async function uploadConceptImage(file: File): Promise<string> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const key = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(key, file, { upsert: false, contentType: file.type || undefined });
  if (upErr) throw upErr;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(key, SIGN_EXPIRY_SECONDS);
  if (error || !data?.signedUrl) throw error ?? new Error("failed to sign url");
  return data.signedUrl;
}
