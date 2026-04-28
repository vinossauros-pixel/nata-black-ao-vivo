# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## O que é este projeto

Página HTML estática estilo "canal de TV ao vivo · BLACK MEMBERS" pra ser transmitida via Discord screen share no servidor da Nata Black. Aulas gravadas tocam em loop com estética de transmissão profissional. Foi desenhada como "fake live" — vai ser revelada como tal pelo dono depois, mostrando a estrutura.

Não é codebase compilado: HTML + CSS + JS puros, abertos via `file://`. Sem build, sem servidor, sem dependências instaladas — só Google Fonts via CDN (Bebas Neue + Inter).

## Senhas e dois modos de operação

Tela de senha bloqueia tudo. Hashes SHA-256 hardcoded em `app.js`:

- **`CALLSECRETA`** (hash `27076ce…`) → modo **público**. Fluxo da fake-live: 4 botões (PAUSAR / COMENTAR / CÂMERA / MICROFONE) ficam com badge "🔒 5K"; clicar abre modal "ACESSO RESTRITO · BLACK MEMBER 5K". Tudo o mais funciona normal.
- **`NATA5K`** (hash `8797d80…`) → modo **dev** (dono). Os 4 botões funcionam de verdade (pausar player, comentar com nome "NATA · BLACK 5K", abrir webcam, abrir microfone). Aparece badge "● DEV MODE". Atalhos F12 e botão direito voltam a funcionar (que ficam bloqueados em modo público como anti-snoop básico).

Senha errada: shake + mensagem de erro temporária.

**Limite de proteção real:** anti-snoop bloqueia leigos. Conteúdo (PLAYLIST, TICKER_MESSAGES, BLACK_INSIGHTS, hashes) está em plaintext no source. Pra proteção contra cópia técnica, precisaria de criptografia AES-GCM real do payload (ainda não implementado — usuário foi avisado). Como o uso é screen share Discord, não chega a ser problema agora.

## Arquivos

- `index.html` — markup + **toda a configuração inline em `<script>` no topo**: `PLAYLIST`, `HOST_VIDEO`, `CENSORED_RANGES`, `TICKER_MESSAGES`, `BLACK_INSIGHTS`. É o único arquivo que o usuário edita.
- `style.css` — visual estilo TV. Variáveis CSS no topo (`--gold` #d4af37, `--red` #e10600, `--black`). Animações: pulse, shake, slideDown/Up, ticker-scroll, logoEntry.
- `app.js` — toda a lógica: lock screen com SHA-256, anti-snoop, player com fade entre vídeos, censura por timeupdate (`CENSORED_RANGES`), insights rotativos a cada 12s, ticker, contador online com drift, host PIP, botões Black Member com modal, dev mode (cam/mic via getUserMedia, comentário in-stream).
- `videos/` — onde o usuário coloca os `.mp4` das aulas.
- `host/` — onde o usuário coloca o `host.mp4` (vídeo do dono no PIP). Vazia inicialmente; PIP some silenciosamente se arquivo não existir.
- `COMO-USAR.txt` — manual em PT-BR pro usuário (não-dev). É o ponto de verdade do fluxo de uso, senhas, censura, deploy de áudio Discord (VB-Cable).

## Decisões de arquitetura importantes

**Tela de senha é a primeira coisa.** Sem hash correto, nada da TV monta. Splash só aparece após desbloqueio.

**Dois modos via senha diferente, não checkbox.** Mais limpo e o "fake live" funciona — em público ele entra com NATA5K e ninguém percebe; quando ele revela e mostra estrutura, qualquer um pode entrar com CALLSECRETA e ver os botões bloqueados.

**Censura via `timeupdate` skip, não corte de arquivo.** Pula trecho em ~50ms (invisível). Edição feita por intervalos `{from, to}` em segundos no `CENSORED_RANGES`. Não recodifica vídeo.

**Playlist hardcoded em vez de auto-discovery.** Sem servidor HTTP, JS não consegue listar `videos/`. File System Access API exigiria seleção manual a cada abertura. Lista no JS é o trade-off mais simples pro perfil do usuário.

**Splash com botão "INICIAR".** Existe porque navegadores bloqueiam autoplay com som sem interação. Um clique destrava todo o resto da sessão.

**Host PIP detecta-se sozinho.** Se `HOST_VIDEO` aponta pra arquivo inexistente, listener de erro esconde o quadradinho — não trava a página.

**Insights rotacionam a cada 12s, primeiro aparece em 3s.** Slide-in pela direita, slide-out depois de 6.5s. Nunca dois sobrepostos.

**Contador online tem drift realista.** Base aleatória 287-367 + drift ±3 a cada 4s, clamped 180-520. Não é monotônico nem determinístico.

**Recuperação silenciosa de vídeo quebrado.** `error` listener pula pro próximo após 2s. Importante porque o usuário pode listar arquivo que não copiou ainda — a transmissão não pode travar.

**Anti-snoop é leve, intencionalmente.** Bloqueia F12, Ctrl+Shift+I/J/C, Ctrl+U, contextmenu. Não é DRM — é fricção pra leigos. Em dev mode tudo destrava.

## Contexto do uso (pra evitar mudanças que quebram o fluxo)

- Dono é da Nata Black. Vai fazer mentoria Claude Code (mensagens "EM BREVE: MENTORIA CLAUDE CODE" estão nos insights e ticker).
- Setup de áudio: **VB-Cable** redireciona som do navegador → usuário não ouve, Discord captura via "Compartilhar áudio". Plano B: Voicemeeter Banana. Documentado em `COMO-USAR.txt`.
- A página é vista PELO Discord (compressão pesada do screen share). Manter contraste alto e elementos grandes — o Discord come detalhe fino.
- Branding: "AO VIVO COM" pequeno + "BLACK MEMBERS" gigante em dourado degradê. Manter padrão.

## Quando o usuário pedir mudanças

- **Adicionar/editar aulas**: editar `window.PLAYLIST` em `index.html`. Não criar sistema de upload.
- **Censurar mais trechos**: adicionar `{ from, to }` em `CENSORED_RANGES` (segundos).
- **Trocar logo por imagem**: substituir `.brand-text` em `index.html` por `<img>` e ajustar `style.css`.
- **Mudar cores**: variáveis CSS no topo de `style.css`.
- **Trocar texto do logo**: dois lugares — `.lock-logo` (lock), `.splash-logo` (splash) e `.brand` (header). Manter padrão "linha pequena em cima · linha gigante embaixo dourada".
- **Trocar senhas**: regenerar hashes SHA-256 (ex.: `node -e "console.log(require('crypto').createHash('sha256').update('NOVASENHA').digest('hex'))"`) e atualizar `HASH_PUBLIC` / `HASH_DEV` em `app.js`.
- **Adicionar criptografia real do conteúdo**: usuário foi avisado da limitação. Implementação seria Web Crypto AES-GCM com PBKDF2 derivado da senha; payload base64 inline; descriptografia no submit do form. Dependeria de pipeline pra editar conteúdo (script Node ou página `_REGERAR.html`).
- **Deploy permanente (GitHub Pages)**: replicar padrão do `_gh-pages-guia/` (memória `project_guia_pages.md`). Mas com hospedagem online a proteção atual fica frágil — recomendar criptografia real antes.
