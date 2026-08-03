import { createFileRoute, Link } from "@tanstack/react-router";
import { useWallet } from "@/lib/wallet-store";
import { PowerupShelf } from "@/components/PowerupShelf";
import { ChevronLeft, Zap, Sparkles, Shield, Package } from "lucide-react";

export const Route = createFileRoute("/inventory")({
  component: InventoryPage,
});

const GLASS_BASE =
  "relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.045] backdrop-blur-md backdrop-saturate-125 shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_16px_40px_-24px_rgba(0,0,0,0.55)]";

function GlassHighlight() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
    />
  );
}

function InventoryPage() {
  const wallet = useWallet();

  return (
    <main className="relative mx-auto min-h-screen max-w-md px-5 pt-8 pb-24 sm:max-w-xl">
      {/* Ambient aurora */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px]"
        style={{
          background:
            "radial-gradient(55% 55% at 50% 0%, rgba(167,139,250,0.15), transparent 65%), radial-gradient(45% 55% at 92% 6%, rgba(167,139,250,0.1), transparent 70%)",

        }}
      />

      <header className="flex flex-col space-y-4">
        <Link
          to="/"
          className="group flex w-fit items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Voltar
        </Link>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-[32px] font-semibold tracking-tight text-foreground">
              Inventário
            </h1>
            <p className="text-[14px] text-muted-foreground">
              Gerencie seus itens consumíveis e bônus ativos.
            </p>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-2xl border border-primary/30 bg-primary/10 text-primary shadow-[0_0_20px_-5px_rgba(167,139,250,0.4)]">
            <Package className="h-6 w-6" strokeWidth={2.25} />
          </div>
        </div>
      </header>

      <div className="mt-10 space-y-8">
        {/* Seção de Power-ups */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Zap className="h-4 w-4 text-primary" strokeWidth={2.5} />
            <h2 className="text-[13px] font-bold uppercase tracking-[0.15em] text-foreground/90">
              Power-ups
            </h2>
          </div>
          
          <div className={`${GLASS_BASE} p-6`}>
            <GlassHighlight />
            <PowerupShelf wallet={wallet} />
          </div>
        </section>

        {/* Guia de Ajuda */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Sparkles className="h-4 w-4 text-amber-400" strokeWidth={2.5} />
            <h2 className="text-[13px] font-bold uppercase tracking-[0.15em] text-foreground/90">
              Como funciona?
            </h2>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <HelpItem 
              icon={<Zap className="h-4 w-4 text-primary" />}
              title="Ativação"
              desc="Clique em um item para ativá-lo. Ele será consumido do seu estoque."
            />
            <HelpItem 
              icon={<Shield className="h-4 w-4 text-emerald-400" />}
              title="Persistência"
              desc="Uma vez ativo, o benefício durará por toda a sua próxima sessão de revisão."
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function HelpItem({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5">
        {icon}
      </div>
      <div>
        <h3 className="text-[14px] font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground/80">{desc}</p>
      </div>
    </div>
  );
}
