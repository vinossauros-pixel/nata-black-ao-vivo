// ============================================
// AO VIVO COM BLACK MEMBERS · player TV
// ============================================

(function () {
  // ---------- Hashes das senhas (SHA-256) ----------
  // CALLSECRETA = entrada normal (modo público)
  // NATA5K      = entrada DEV (botões liberados, sem cadeado)
  const HASH_PUBLIC = "27076cec1040414bd0fc55e88748f39c178f9c9924b64cd24c0eabf7be4d373e";
  const HASH_DEV    = "8797d80e3cfa552ae9c9213c1f42f83e1b8b93d891fadeba97e3b28b814113f9";

  let DEV_MODE = false;

  // ---------- Anti-snoop (bloqueio leve) ----------
  document.addEventListener('contextmenu', e => { if (!DEV_MODE) e.preventDefault(); });
  document.addEventListener('keydown', e => {
    if (DEV_MODE) return;
    if (e.key === 'F12') { e.preventDefault(); return; }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && ['I','J','C'].includes(e.key.toUpperCase())) e.preventDefault();
    if ((e.ctrlKey || e.metaKey) && e.key.toUpperCase() === 'U') e.preventDefault();
  });

  // ---------- Hash helper ----------
  async function sha256(str) {
    const buf = new TextEncoder().encode(str);
    const digest = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(digest))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // ---------- Lock screen ----------
  const lockEl = document.getElementById('lock');
  const lockForm = document.getElementById('lock-form');
  const lockInput = document.getElementById('lock-input');
  const lockError = document.getElementById('lock-error');

  lockForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const value = lockInput.value.trim().toUpperCase();
    const hash = await sha256(value);

    if (hash === HASH_DEV) {
      DEV_MODE = true;
      enterApp();
      enableDevMode();
      return;
    }
    if (hash === HASH_PUBLIC) {
      enterApp();
      return;
    }
    // Errada
    lockError.hidden = false;
    lockInput.value = "";
    lockInput.focus();
    lockEl.querySelector('.lock-inner').animate(
      [{ transform: 'translateX(0)' }, { transform: 'translateX(-10px)' }, { transform: 'translateX(10px)' }, { transform: 'translateX(0)' }],
      { duration: 400 }
    );
    setTimeout(() => { lockError.hidden = true; }, 3000);
  });

  function enterApp() {
    lockEl.style.display = 'none';
    document.getElementById('splash').hidden = false;
  }

  function enableDevMode() {
    document.body.classList.add('dev-mode');
    document.getElementById('dev-badge').hidden = false;
    // Destrava botões
    document.querySelectorAll('.mt-btn').forEach(b => b.dataset.locked = "false");
  }

  // Foca no input ao abrir
  setTimeout(() => lockInput.focus(), 300);

  // ============================================
  // RESTO DO APP (carregado depois da senha)
  // ============================================

  const playlist = window.PLAYLIST || [];
  const tickerMessages = window.TICKER_MESSAGES || ["NATA BLACK"];
  const insights = window.BLACK_INSIGHTS || [];
  const censoredRanges = window.CENSORED_RANGES || [];
  const hostVideoSrc = window.HOST_VIDEO || "";

  const splash = document.getElementById('splash');
  const startBtn = document.getElementById('splash-start');
  const tv = document.getElementById('tv');
  const player = document.getElementById('player');
  const fader = document.getElementById('fader');
  const ltEl = document.getElementById('lower-third');
  const ltTitle = document.getElementById('lt-title');
  const nextTitle = document.getElementById('next-title');
  const clockEl = document.getElementById('clock');
  const dateEl = document.getElementById('date');
  const tickerTrack = document.getElementById('ticker-track');
  const onlineCount = document.getElementById('online-count');
  const insightEl = document.getElementById('insight');
  const insightTag = document.getElementById('insight-tag');
  const insightText = document.getElementById('insight-text');
  const hostPip = document.getElementById('host-pip');
  const hostVideo = document.getElementById('host-video');
  const memberModal = document.getElementById('member-modal');
  const mmClose = document.getElementById('mm-close');
  const memberTools = document.querySelector('.member-tools');
  const commentBox = document.getElementById('comment-box');
  const commentInput = document.getElementById('comment-input');
  const commentDisplay = document.getElementById('comment-display');
  const cdText = document.getElementById('cd-text');
  const devCam = document.getElementById('dev-cam');
  const devCamVideo = document.getElementById('dev-cam-video');

  let index = 0;

  // ---------- Relógio ----------
  function pad(n) { return String(n).padStart(2, '0'); }
  function updateClock() {
    const now = new Date();
    clockEl.textContent = pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
    const dias = ['DOM','SEG','TER','QUA','QUI','SEX','SÁB'];
    const meses = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
    dateEl.textContent = dias[now.getDay()] + ' · ' + pad(now.getDate()) + ' ' + meses[now.getMonth()] + ' ' + now.getFullYear();
  }
  setInterval(updateClock, 1000);
  updateClock();

  // ---------- Contador online (13-32, média 17-25, picos ocasionais) ----------
  let baseOnline = 17 + Math.floor(Math.random() * 9); // começa entre 17 e 25
  function updateOnline() {
    let drift;
    const r = Math.random();
    if (r < 0.08) {
      // 8% de chance de pico (mais intenso)
      drift = Math.random() < 0.5 ? -(2 + Math.floor(Math.random() * 3)) : (2 + Math.floor(Math.random() * 4));
    } else {
      // movimento sutil normal: -1, 0, +1
      drift = Math.floor(Math.random() * 3) - 1;
    }
    let next = baseOnline + drift;

    // Atração suave pra média (17-25)
    if (next > 25 && Math.random() < 0.55) next -= 1;
    if (next < 17 && Math.random() < 0.55) next += 1;

    // Clamp 13-32
    baseOnline = Math.max(13, Math.min(32, next));
    onlineCount.textContent = baseOnline;
  }
  setInterval(updateOnline, 3500);
  updateOnline();

  // ---------- Ticker ----------
  function buildTicker() {
    const sep = '   ◆   ';
    const text = tickerMessages.join(sep) + sep;
    tickerTrack.textContent = (text + text + text).toUpperCase();
  }
  buildTicker();

  // ---------- Black Insights rotacionando ----------
  let insightIndex = 0;
  function showInsight() {
    if (insights.length === 0) return;
    const it = insights[insightIndex];
    insightTag.textContent = it.tag;
    insightText.textContent = it.text;
    insightEl.classList.add('show');
    setTimeout(() => insightEl.classList.remove('show'), 6500);
    insightIndex = (insightIndex + 1) % insights.length;
  }
  // Primeiro aparece após 3s, depois a cada 12s
  setTimeout(() => {
    showInsight();
    setInterval(showInsight, 12000);
  }, 3000);

  // ---------- Player ----------
  function loadCurrent(isFirst) {
    if (playlist.length === 0) {
      ltTitle.textContent = 'Nenhuma aula configurada';
      nextTitle.textContent = 'Edite PLAYLIST em index.html';
      return;
    }

    const item = playlist[index];
    const next = playlist[(index + 1) % playlist.length];

    ltTitle.textContent = item.title;
    nextTitle.textContent = next.title;

    // Primeiro play: sem fade pra não perder user activation
    if (isFirst) {
      player.src = item.file;
      player.load();
      const p = player.play();
      if (p && p.catch) p.catch(err => {
        console.warn('autoplay:', err);
        showPlayFallback();
      });
      showLowerThird();
      return;
    }

    // Trocas seguintes: fade preto suave
    fader.classList.add('show');
    setTimeout(() => {
      player.src = item.file;
      player.load();
      const p = player.play();
      if (p && p.catch) p.catch(err => console.warn('play:', err));
      setTimeout(() => fader.classList.remove('show'), 150);
      showLowerThird();
    }, 350);
  }

  // Fallback: se autoplay foi bloqueado, mostra botão grande de play
  function showPlayFallback() {
    let fb = document.getElementById('play-fallback');
    if (!fb) {
      fb = document.createElement('button');
      fb.id = 'play-fallback';
      fb.textContent = '▶  TOQUE PARA ASSISTIR';
      fb.style.cssText = `
        position: absolute; top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        background: var(--gold); color: var(--black);
        border: none; padding: 22px 44px;
        font-family: 'Inter', sans-serif; font-weight: 900;
        letter-spacing: 4px; font-size: 18px; cursor: pointer;
        z-index: 40; box-shadow: 0 0 60px rgba(212,175,55,0.5);
      `;
      document.querySelector('.stage').appendChild(fb);
      fb.addEventListener('click', () => {
        player.play().then(() => fb.remove()).catch(e => console.warn(e));
      });
    }
  }

  function showLowerThird() {
    ltEl.classList.add('show');
    clearTimeout(showLowerThird._t);
    showLowerThird._t = setTimeout(() => ltEl.classList.remove('show'), 8000);
  }

  // Próximo vídeo quando termina
  player.addEventListener('ended', () => {
    index = (index + 1) % playlist.length;
    loadCurrent();
  });

  // Erro: pula pra próximo
  player.addEventListener('error', () => {
    console.warn('Erro:', playlist[index] && playlist[index].file);
    setTimeout(() => {
      index = (index + 1) % playlist.length;
      loadCurrent();
    }, 2000);
  });

  // Censura — pula trechos
  player.addEventListener('timeupdate', () => {
    for (const r of censoredRanges) {
      if (player.currentTime >= r.from && player.currentTime < r.to) {
        player.currentTime = r.to;
        break;
      }
    }
  });

  // Mostra lower-third de novo se passar o mouse na parte de baixo
  document.addEventListener('mousemove', (e) => {
    if (e.clientY > window.innerHeight * 0.7 && !tv.hidden) {
      showLowerThird();
    }
  });

  // ---------- Host PIP ----------
  function setupHostPip() {
    if (!hostVideoSrc) return;
    hostVideo.src = hostVideoSrc;
    hostVideo.addEventListener('loadeddata', () => {
      hostPip.hidden = false;
      hostVideo.play().catch(() => {});
    });
    hostVideo.addEventListener('error', () => {
      // Se não existir o arquivo, esconde silenciosamente
      hostPip.hidden = true;
    });
    hostVideo.load();
  }

  // ---------- Botões Black Member ----------
  function showBlackMemberModal() {
    memberModal.querySelector('.mm-tag').textContent = 'ACESSO RESTRITO';
    memberModal.querySelector('.mm-title').innerHTML = 'FUNÇÃO EXCLUSIVA<br/>BLACK MEMBER 5K';
    memberModal.querySelector('.mm-text').innerHTML =
      'Esta interação é liberada apenas para membros do tier <strong>BLACK 5K</strong>.<br/>Você está assistindo no nível público.';
    memberModal.hidden = false;
  }

  document.querySelectorAll('.mt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      const locked = btn.dataset.locked === "true";

      if (locked) {
        showBlackMemberModal();
        return;
      }

      // DEV MODE - botões funcionam
      if (action === 'pause') {
        if (player.paused) { player.play(); btn.querySelector('.mt-text').textContent = 'PAUSAR'; }
        else { player.pause(); btn.querySelector('.mt-text').textContent = 'CONTINUAR'; }
      }
      if (action === 'comment') {
        commentBox.hidden = !commentBox.hidden;
        if (!commentBox.hidden) commentInput.focus();
      }
      if (action === 'camera') toggleCam();
      if (action === 'mic')    toggleMic();
    });
  });

  mmClose.addEventListener('click', () => memberModal.hidden = true);
  memberModal.addEventListener('click', (e) => {
    if (e.target === memberModal) memberModal.hidden = true;
  });

  // Comentário do dev
  commentInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && commentInput.value.trim()) {
      cdText.textContent = commentInput.value.trim();
      commentDisplay.hidden = false;
      commentInput.value = "";
      commentBox.hidden = true;
      clearTimeout(commentInput._t);
      commentInput._t = setTimeout(() => commentDisplay.hidden = true, 8000);
    }
    if (e.key === 'Escape') commentBox.hidden = true;
  });

  // Câmera
  let camStream = null;
  async function toggleCam() {
    if (camStream) {
      camStream.getTracks().forEach(t => t.stop());
      camStream = null;
      devCam.hidden = true;
      return;
    }
    try {
      camStream = await navigator.mediaDevices.getUserMedia({ video: true });
      devCamVideo.srcObject = camStream;
      devCam.hidden = false;
    } catch (err) {
      alert('Não foi possível acessar a câmera: ' + err.message);
    }
  }

  // Microfone (visualmente: muda cor do botão; tecnicamente abre stream)
  let micStream = null;
  async function toggleMic() {
    const btn = document.querySelector('.mt-btn[data-action="mic"]');
    if (micStream) {
      micStream.getTracks().forEach(t => t.stop());
      micStream = null;
      btn.style.background = '';
      return;
    }
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      btn.style.background = 'rgba(225, 6, 0, 0.3)';
    } catch (err) {
      alert('Não foi possível acessar o microfone: ' + err.message);
    }
  }

  // ---------- Chat ----------
  const chatEl = document.getElementById('chat');
  const chatBody = document.getElementById('chat-body');
  const chatForm = document.getElementById('chat-form');
  const chatName = document.getElementById('chat-name');
  const chatInput = document.getElementById('chat-input');
  const chatToggle = document.getElementById('chat-toggle');
  const chatCount = document.getElementById('chat-count');
  const middleEl = document.querySelector('.middle');
  const fakeChatPool = (window.FAKE_CHAT || []).slice();

  // Lê nome salvo
  try {
    const saved = localStorage.getItem('chat_name');
    if (saved) chatName.value = saved;
  } catch(e) {}

  let chatMsgCount = 0;
  function appendMsg(user, text, kind) {
    const div = document.createElement('div');
    div.className = 'chat-msg' + (kind ? ' ' + kind : '');
    const u = document.createElement('span');
    u.className = 'chat-user';
    u.textContent = user + ':';
    const t = document.createElement('span');
    t.className = 'chat-text';
    t.textContent = ' ' + text;
    div.appendChild(u); div.appendChild(t);
    chatBody.appendChild(div);
    // Limita a 80 mensagens visíveis
    while (chatBody.children.length > 80) chatBody.removeChild(chatBody.firstChild);
    chatBody.scrollTop = chatBody.scrollHeight;
    chatMsgCount++;
    chatCount.textContent = chatMsgCount > 999 ? '999+' : chatMsgCount;
  }

  // Mensagens fake entram em ritmo natural
  let fakeIdx = 0;
  function dropFakeMsg() {
    if (fakeChatPool.length === 0) return;
    // pega aleatório, mas evita repetir o último
    const m = fakeChatPool[Math.floor(Math.random() * fakeChatPool.length)];
    appendMsg(m.user, m.text);
  }
  // Burst inicial pra parecer chat ativo
  function initialBurst() {
    for (let i = 0; i < 6; i++) {
      setTimeout(() => dropFakeMsg(), i * 350);
    }
  }
  function scheduleNextFake() {
    const delay = 2500 + Math.random() * 9000; // entre 2.5s e 11.5s
    setTimeout(() => {
      dropFakeMsg();
      scheduleNextFake();
    }, delay);
  }

  // Submit do chat (qualquer pessoa pode comentar)
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = chatName.value.trim() || 'anônimo';
    const text = chatInput.value.trim();
    if (!text) return;
    try { localStorage.setItem('chat_name', name); } catch(e) {}
    const isYou = DEV_MODE && name.toLowerCase() === chatName.value.toLowerCase();
    appendMsg(name, text, DEV_MODE ? 'dev' : 'you');
    chatInput.value = '';
  });

  // Toggle desktop (recolher chat)
  chatToggle.addEventListener('click', () => {
    middleEl.classList.toggle('chat-collapsed');
    chatEl.classList.toggle('collapsed-state');
  });

  // FAB mobile pra abrir/fechar chat
  if (window.matchMedia('(max-width: 768px)').matches) {
    const fab = document.createElement('button');
    fab.className = 'chat-mobile-fab';
    fab.innerHTML = '💬<span class="badge" id="chat-fab-badge" hidden>!</span>';
    document.body.appendChild(fab);
    fab.addEventListener('click', () => {
      chatEl.classList.toggle('open');
      const badge = document.getElementById('chat-fab-badge');
      if (badge) badge.hidden = true;
    });
    // Notifica de mensagem nova quando fechado
    const origAppend = appendMsg;
    // (badge animation simples via mutationObserver poderia ir aqui — mantive simples)
  }

  // Inicia chat
  setTimeout(() => {
    initialBurst();
    scheduleNextFake();
  }, 500);

  // ---------- Volume ----------
  const volMute = document.getElementById('vol-mute');
  const volIcon = document.getElementById('vol-icon');
  const volDown = document.getElementById('vol-down');
  const volUp = document.getElementById('vol-up');
  const volBar = document.querySelector('.vol-bar');
  const volFill = document.getElementById('vol-fill');
  const volPct = document.getElementById('vol-pct');

  let lastVolume = 1;
  function updateVolUI() {
    const v = player.muted ? 0 : player.volume;
    volFill.style.width = (v * 100) + '%';
    volPct.textContent = Math.round(v * 100) + '%';
    if (player.muted || v === 0) volIcon.textContent = '🔇';
    else if (v < 0.34)           volIcon.textContent = '🔈';
    else if (v < 0.67)           volIcon.textContent = '🔉';
    else                          volIcon.textContent = '🔊';
  }
  function setVolume(v) {
    v = Math.max(0, Math.min(1, v));
    player.volume = v;
    if (v > 0) {
      player.muted = false;
      lastVolume = v;
    }
    updateVolUI();
  }
  volUp.addEventListener('click', () => setVolume((player.muted ? 0 : player.volume) + 0.1));
  volDown.addEventListener('click', () => setVolume((player.muted ? 0 : player.volume) - 0.1));
  volMute.addEventListener('click', () => {
    if (player.muted || player.volume === 0) {
      player.muted = false;
      if (player.volume === 0) player.volume = lastVolume || 1;
    } else {
      lastVolume = player.volume;
      player.muted = true;
    }
    updateVolUI();
  });
  // Click direto na barra → seta proporcional
  volBar.addEventListener('click', (e) => {
    const rect = volBar.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    setVolume(ratio);
  });
  // Atalhos teclado
  document.addEventListener('keydown', (e) => {
    if (tv.hidden) return;
    if (e.key === 'ArrowUp')   { e.preventDefault(); setVolume((player.muted ? 0 : player.volume) + 0.05); }
    if (e.key === 'ArrowDown') { e.preventDefault(); setVolume((player.muted ? 0 : player.volume) - 0.05); }
    if (e.key.toLowerCase() === 'm') { volMute.click(); }
  });
  // Sincroniza UI quando vídeo carrega
  player.addEventListener('loadedmetadata', updateVolUI);
  updateVolUI();

  // ---------- Drawer de Aulas ----------
  const lessonsBtn = document.getElementById('lessons-btn');
  const drawer = document.getElementById('lessons-drawer');
  const drawerClose = document.getElementById('ld-close');
  const drawerOverlay = drawer.querySelector('.ld-overlay');
  const lessonsGrid = document.getElementById('lessons-grid');
  const nlTitle = document.getElementById('nl-title');
  const nlTeaser = document.getElementById('nl-teaser');
  const nlMeta = document.getElementById('nl-meta');
  const cdD = document.getElementById('cd-d');
  const cdH = document.getElementById('cd-h');
  const cdM = document.getElementById('cd-m');
  const cdS = document.getElementById('cd-s');

  const nextLesson = window.NEXT_FREE_LESSON || null;
  const library = window.LESSONS_LIBRARY || [];

  // Popula próxima aula
  if (nextLesson) {
    nlTitle.textContent = nextLesson.title;
    nlTeaser.textContent = '"' + nextLesson.teaser + '"';
    const dt = new Date(nextLesson.datetime);
    const dias = ['DOMINGO','SEGUNDA','TERÇA','QUARTA','QUINTA','SEXTA','SÁBADO'];
    nlMeta.textContent =
      dias[dt.getDay()] + ' · ' +
      pad(dt.getDate()) + '/' + pad(dt.getMonth()+1) + '/' + dt.getFullYear() +
      ' · ' + pad(dt.getHours()) + 'H' + pad(dt.getMinutes());
  }

  // Countdown
  function updateCountdown() {
    if (!nextLesson) return;
    const target = new Date(nextLesson.datetime).getTime();
    const now = Date.now();
    let diff = Math.max(0, target - now);
    const days = Math.floor(diff / 86400000); diff -= days * 86400000;
    const hours = Math.floor(diff / 3600000); diff -= hours * 3600000;
    const mins = Math.floor(diff / 60000); diff -= mins * 60000;
    const secs = Math.floor(diff / 1000);
    cdD.textContent = pad(days);
    cdH.textContent = pad(hours);
    cdM.textContent = pad(mins);
    cdS.textContent = pad(secs);
  }
  setInterval(updateCountdown, 1000);
  updateCountdown();

  // Render grid
  function renderLibrary() {
    lessonsGrid.innerHTML = library.map(l => `
      <article class="lesson-card" data-status="${l.status}">
        <div class="lc-num">${l.num}</div>
        <div class="lc-status" data-s="${l.status}">${
          l.status === 'locked' ? '🔒 BLACK' :
          l.status === 'free' ? '✓ LIBERADA' : '● PRÓXIMA'
        }</div>
        <div class="lc-body">
          <div class="lc-title">${l.title}</div>
          <div class="lc-teaser">${l.teaser}</div>
          <div class="lc-date">${l.date}</div>
        </div>
        <div class="lc-thumb-overlay">
          <div class="lc-lock-icon">🔒</div>
          <div class="lc-lock-text">APENAS BLACK MEMBERS</div>
        </div>
      </article>
    `).join('');

    lessonsGrid.querySelectorAll('.lesson-card').forEach(card => {
      card.addEventListener('click', () => {
        const status = card.dataset.status;
        if (status === 'locked' && !DEV_MODE) {
          memberModal.hidden = false;
        } else {
          // free / dev — abre modal de "iniciar aula"
          memberModal.hidden = false;
          memberModal.querySelector('.mm-tag').textContent = 'AULA LIBERADA';
          memberModal.querySelector('.mm-title').innerHTML = card.querySelector('.lc-title').textContent;
          memberModal.querySelector('.mm-text').innerHTML = 'Esta aula está liberada para visualização.<br/>Em produção, isso abriria o player da aula.';
        }
      });
    });
  }
  renderLibrary();

  function openDrawer() { drawer.hidden = false; }
  function closeDrawer() { drawer.hidden = true; }

  lessonsBtn.addEventListener('click', openDrawer);
  drawerClose.addEventListener('click', closeDrawer);
  drawerOverlay.addEventListener('click', closeDrawer);

  // CTA "RESERVAR VAGA"
  document.querySelector('.nl-cta').addEventListener('click', () => {
    memberModal.hidden = false;
    memberModal.querySelector('.mm-tag').textContent = 'RESERVA CONFIRMADA';
    memberModal.querySelector('.mm-title').innerHTML = 'VAGA<br/>GARANTIDA';
    memberModal.querySelector('.mm-text').innerHTML =
      'Você foi adicionado à lista da próxima aula gratuita.<br/>Aviso será enviado pelo Discord.';
  });

  // ---------- Start ----------
  startBtn.addEventListener('click', () => {
    splash.style.display = 'none';
    tv.hidden = false;
    // Garante que nenhum modal/overlay esteja ativo
    memberModal.hidden = true;
    if (drawer) drawer.hidden = true;
    setTimeout(() => memberTools.classList.add('show'), 1200);
    loadCurrent(true); // primeiro play sem fade
    setupHostPip();
  });

  // Atalhos de teclado
  document.addEventListener('keydown', (e) => {
    if (tv.hidden) return;
    if (e.key === ' ' && !DEV_MODE) {
      e.preventDefault();
      index = (index + 1) % playlist.length;
      loadCurrent();
    }
    if (e.key.toLowerCase() === 'l') showLowerThird();
    if (e.key.toLowerCase() === 'i') showInsight();
  });
})();
