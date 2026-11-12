<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Atualizações operacionais usam tabelas e leituras próprias, separadas das notificações pessoais, para manter contadores e estados independentes.
- Comentários sociais retornam a linha criada e atualizam o feed local imediatamente; o tempo real sincroniza os demais perfis.
- Exclusões de cartas e decks mantêm marcadores sincronizados para impedir restauração por caches ou dispositivos desatualizados.
- Links compartilhados de Patch Notes usam o domínio público estável para funcionar fora da prévia.
- Focus emotes share AiriMascot configuration across study screens; daily briefings are Home-mounted, profile-scoped local reminders that wait for other dialogs, never changing study completion.
- Home and Streak use the shared airi-streak-mood resolver to keep mascot state selection consistent.
- Shop mascot balance states use a shared pure resolver; purchase celebrations appear only after confirmed success and never grant currency or items.
- Desafio Relâmpago: regras puras em src/lib/lightning-challenge.ts; jogado 1x/dia por perfil via localStorage, prêmio só ao vencer.
- Admin rank overrides are built by pure rules in src/lib/rank-override.ts and stamp adminOverrideAt, which beats the higher-totalEarned merge so stale devices cannot undo them.
