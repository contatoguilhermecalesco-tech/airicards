import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import seller from "@/assets/airi-emotes/airi-shop-seller.png";
import blackFridayArt from "@/assets/airi-emotes/airi-shop-blackfriday.png";
import { setSetting, useAppSettings, type ShopMascotMode } from "@/lib/app-settings";

const OPTIONS: { key: ShopMascotMode; label: string; hint: string; img?: string }[] = [
  { key: "normal", label: "Airi da Loja", hint: "Vendedora misteriosa de sempre.", img: seller },
  { key: "black", label: "Airi Black Friday", hint: "Tesoura e sacolas, clima de promoção.", img: blackFridayArt },
  { key: "auto", label: "Automático", hint: "Black Friday só quando houver item com selo Black ativo." },
];

export function ShopMascotAdminSection() {
  const { shop_mascot } = useAppSettings();
  const [busy, setBusy] = useState<ShopMascotMode | null>(null);

  async function choose(mode: ShopMascotMode, label: string) {
    if (mode === shop_mascot) return;
    setBusy(mode);
    try {
      await setSetting("shop_mascot", mode);
      toast.success(`Loja agora mostra: ${label}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4 pt-4">
      <p className="text-sm text-muted-foreground">
        Escolha qual Airi aparece no topo da Loja. Muda na hora para Guilherme e Arlayne.
      </p>
      <div className="grid gap-2 sm:grid-cols-3">
        {OPTIONS.map((o) => {
          const active = shop_mascot === o.key;
          return (
            <button
              key={o.key}
              disabled={busy !== null}
              onClick={() => choose(o.key, o.label)}
              aria-pressed={active}
              className={`flex min-h-[88px] flex-col items-start gap-2 rounded-2xl border p-3 text-left transition ${
                active ? "border-primary bg-primary/15" : "border-border bg-muted/30 hover:border-primary/40"
              }`}
            >
              {o.img ? (
                <img src={o.img} alt="" className="h-24 w-full object-contain" />
              ) : (
                <div className="flex h-24 w-full items-center justify-center gap-1">
                  <img src={seller} alt="" className="h-20 w-20 object-contain opacity-70" />
                  <span className="text-muted-foreground">⇄</span>
                  <img src={blackFridayArt} alt="" className="h-20 w-24 object-contain opacity-70" />
                </div>
              )}
              <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                {busy === o.key && <Loader2 className="h-4 w-4 animate-spin" />}
                {o.label}
                {active && <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">ativo</span>}
              </span>
              <span className="text-[12px] text-muted-foreground">{o.hint}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
