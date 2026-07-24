import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

/**
 * Wave 2 — Data Layer:
 * - `staleTime: 30s` reaproveita cache entre navegações rápidas, evitando
 *   refetches em cliques back/forward.
 * - `gcTime: 5min` preserva dados para navegação intra-app sem inflar memória.
 * - `retry: 1` limita tentativas para falhas de rede transitórias sem cascatear
 *   requests em modo offline (o próprio Supabase client já retenta internamente).
 * - `refetchOnWindowFocus: false` no mobile evita gasto de bateria quando o
 *   usuário volta ao app; a maioria dos dados já se atualiza por realtime.
 *
 * Wave 3 — Resilience:
 * - `defaultPreload: "intent"` + `defaultPreloadDelay: 60` faz o TanStack
 *   pré-carregar rotas quando o usuário passa o mouse/toque, deixando a
 *   navegação percebida instantânea sem prefetch agressivo.
 * - `defaultPreloadStaleTime: 0` mantém o Query como fonte de verdade para
 *   frescor do dado (o Router só cuida do bundle da rota).
 */
export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadDelay: 60,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
