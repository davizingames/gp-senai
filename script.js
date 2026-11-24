document.addEventListener('DOMContentLoaded', () => {
  // 1. CONTADOR DE TEMPO (Lê a data definida no HTML)
  const timerGrid = document.getElementById('timerGrid');
  const startDate = new Date(timerGrid.dataset.startDate);

  function updateCounter() {
    const diff = Math.max(0, new Date() - startDate);
    document.getElementById('days').textContent = Math.floor(diff / (1000 * 60 * 60 * 24));
    document.getElementById('hours').textContent = String(Math.floor((diff / (1000 * 60 * 60)) % 24)).padStart(2, '0');
    document.getElementById('minutes').textContent = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, '0');
    document.getElementById('seconds').textContent = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');
  }
  updateCounter();
  setInterval(updateCounter, 1000);

  // 2. GALERIA E LIGHTBOX COM BUSCA AUTOMÁTICA DE EXTENSÕES E NOMES
  const cards = Array.from(document.querySelectorAll('.photo-card'));
  const modal = document.getElementById('lightboxModal');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxTitle = document.getElementById('lightboxTitle');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxIndex = document.getElementById('lightboxIndex');
  let validIndices = [];
  let currentPhotoPos = 0;

  function buildCandidatePaths(originalSrc) {
    const candidates = new Set();
    candidates.add(originalSrc);
    candidates.add(encodeURI(originalSrc));

    const baseName = originalSrc.replace(/\.[^/.]+$/, '');
    const cleanBase = baseName.replace(/\.[^/.]+$/, '');
    const bases = new Set([baseName, cleanBase]);

    [baseName, cleanBase].forEach((b) => {
      bases.add(b.replace(/\s+\(/g, '('));
      bases.add(b.replace(/[\s()]/g, ''));
      bases.add(b.replace(/[()]/g, '').replace(/\s+/g, ' ').trim());
      bases.add(b.replace(/[()]/g, '').replace(/\s+/g, '_'));
    });

    const extensions = ['.jpg', '.JPG', '.jpeg', '.JPEG', '.png', '.PNG', '.webp'];

    bases.forEach((b) => {
      extensions.forEach((ext) => {
        candidates.add(b + ext);
        candidates.add(encodeURI(b + ext));
      });
    });

    return Array.from(candidates);
  }

  cards.forEach((card, index) => {
    const frame = card.querySelector('.photo-frame');
    const img = frame.querySelector('img');
    const srcAttr = img.getAttribute('src');

    const registerValid = () => {
      if (!validIndices.includes(index)) {
        validIndices.push(index);
        validIndices.sort((a, b) => a - b);
        frame.addEventListener('click', () => openLightbox(index));
      }
    };

    const showMissingPlaceholder = () => {
      img.remove();
      const missing = document.createElement('div');
      missing.className = 'photo-missing';
      missing.innerHTML = `<span>📷 Foto ${index + 1}</span><span>Não encontrada:</span><code>${srcAttr}</code>`;
      frame.appendChild(missing);
    };

    const candidates = buildCandidatePaths(srcAttr);
    let attempt = 0;

    function tryNextCandidate() {
      if (attempt >= candidates.length) {
        showMissingPlaceholder();
        return;
      }

      const candidateSrc = candidates[attempt++];
      const tester = new Image();

      tester.onload = () => {
        if (tester.naturalWidth > 0) {
          img.src = candidateSrc;
          registerValid();
        } else {
          tryNextCandidate();
        }
      };

      tester.onerror = () => {
        tryNextCandidate();
      };

      tester.src = candidateSrc;
    }

    tryNextCandidate();
  });

  function openLightbox(cardIndex) {
    currentPhotoPos = validIndices.indexOf(cardIndex);
    if (currentPhotoPos === -1) return;
    renderLightbox();
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function renderLightbox() {
    const cardIndex = validIndices[currentPhotoPos];
    const card = cards[cardIndex];
    lightboxImg.src = card.querySelector('img').src;
    lightboxTitle.textContent = card.querySelector('.photo-title').textContent;
    lightboxCaption.textContent = card.querySelector('.photo-caption').textContent;
    lightboxIndex.textContent = `Memória #${cardIndex + 1} de ${cards.length}`;
  }

  function navigateLightbox(step) {
    if (!validIndices.length) return;
    currentPhotoPos = (currentPhotoPos + step + validIndices.length) % validIndices.length;
    renderLightbox();
  }

  function closeLightbox() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }

  document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
  document.getElementById('lightboxPrev').addEventListener('click', () => navigateLightbox(-1));
  document.getElementById('lightboxNext').addEventListener('click', () => navigateLightbox(1));
  modal.addEventListener('click', (e) => { if (e.target === modal) closeLightbox(); });

  let touchStartX = 0;
  const swipeArea = document.getElementById('lightboxSwipeArea');
  swipeArea.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
  swipeArea.addEventListener('touchend', (e) => {
    const diffX = e.changedTouches[0].screenX - touchStartX;
    if (Math.abs(diffX) > 45) navigateLightbox(diffX < 0 ? 1 : -1);
  }, { passive: true });

  // 3. ALTERNADOR DE MOTIVOS (Lê os <li> direto do HTML)
  const reasonItems = Array.from(document.querySelectorAll('#reasonsList .reason-item'));
  const reasonCounter = document.getElementById('reasonCounter');
  let reasonIndex = 0;

  document.getElementById('nextReasonBtn').addEventListener('click', () => {
    reasonItems[reasonIndex].classList.remove('active');
    reasonIndex = (reasonIndex + 1) % reasonItems.length;
    reasonItems[reasonIndex].classList.add('active');
    reasonCounter.textContent = `Motivo #${reasonIndex + 1}`;
  });

  // 4. CHUVA DE CORAÇÕES AZUIS E ACORDE MUSICAL
  const canvas = document.getElementById('particlesCanvas');
  const ctx = canvas.getContext('2d');
  let particles = [];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function playSoftChord() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      [261.63, 329.63, 392.0, 493.88].forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.08);
        gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.04, audioCtx.currentTime + i * 0.08 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.6);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + i * 0.08);
        osc.stop(audioCtx.currentTime + 1.7);
      });
    } catch (e) {}
  }

  document.getElementById('loveRainBtn').addEventListener('click', () => {
    playSoftChord();
    const symbols = ['💙', '🩵', '✨', '💎', '🦋'];
    for (let i = 0; i < 42; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 140,
        size: 16 + Math.random() * 16,
        speedY: 2 + Math.random() * 3.5,
        speedX: (Math.random() - 0.5) * 1.8,
        symbol: symbols[Math.floor(Math.random() * symbols.length)],
        alpha: 1
      });
    }
  });

  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.y += p.speedY;
      p.x += p.speedX;
      if (p.y > canvas.height - 60) p.alpha -= 0.03;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.font = `${p.size}px serif`;
      ctx.fillText(p.symbol, p.x, p.y);
    });
    particles = particles.filter((p) => p.alpha > 0 && p.y < canvas.height + 30);
    requestAnimationFrame(animateParticles);
  }
  animateParticles();
});