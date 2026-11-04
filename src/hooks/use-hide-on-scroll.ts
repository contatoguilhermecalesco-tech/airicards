import { useEffect, useState } from "react";

/**
 * Retorna `true` quando a barra deve ficar escondida:
 * some ao rolar para baixo e volta ao rolar para cima (ou perto do topo/fim).
 */
export function useHideOnScroll({ threshold = 8, topOffset = 64, disabled = false } = {}) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (disabled) {
      setHidden(false);
      return;
    }
    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
      ticking = false;
      // Ignora enquanto a página está travada (ex.: painel aberto com body fixed).
      if (document.body.style.position === "fixed") return;
      const y = Math.max(0, window.scrollY);
      const maxY = document.documentElement.scrollHeight - window.innerHeight;
      const delta = y - lastY;
      if (y < topOffset) {
        setHidden(false);
      } else if (y >= maxY - 4) {
        // Chegou ao fim da página: mostra de novo para facilitar a navegação.
        setHidden(false);
      } else if (delta > threshold) {
        setHidden(true);
      } else if (delta < -threshold) {
        setHidden(false);
      } else {
        return;
      }
      lastY = y;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold, topOffset, disabled]);

  return hidden;
}
