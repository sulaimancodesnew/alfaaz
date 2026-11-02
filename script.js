/* ============ EDIT HERE ============ */
const lyrics = [            // start/end in SECONDS of bg.mp3
  { text: "Baaghan vicho main te torrey tere layi gulaab ve", start: 12.0,  end: 17.0 },
  { text: "Main te bas kehnda rehnda, aap janab ve", start: 17.0,  end: 23.0 },
  { text: "Tu te taareyaan ton vi sohna ay", start: 23.0, end: 25.0 },
  { text: "Tere varga koi na hona ay", start: 25.0, end: 29.0 },
  { text: "Tu te taareyaan ton vi sohna ay", start: 29.0, end: 31.0 },
  { text: "Tere varga koi na hona ay", start: 31.0, end: 33.0 }
];
const CONFIG = {
  AUTO_SYNC: true,    // lyrics follow audio.currentTime
  MANUAL_NAV: true,   // show the "Next Line" button
  LOOP: false,        // loop the song
  DEV: new URLSearchParams(location.search).has('dev')  // open index.html?dev=1
};
/* =================================== */

const $ = s => document.querySelector(s);
const audio = $('#bgm'), lyricEl = $('#lyric'), mus = $('#mus'), dev = $('#dev');
const screens = [...document.querySelectorAll('.scr')];
let scene = 0, cur = -2, audioOK = true, swapT;
audio.loop = CONFIG.LOOP;
$('#next').hidden = !CONFIG.MANUAL_NAV;
dev.hidden = !CONFIG.DEV;
$('#dots').innerHTML = lyrics.map(() => '<i></i>').join('');
const dots = [...document.querySelectorAll('#dots i')];
const lastEnd = Math.max(...lyrics.map(l => l.end));

/* ---------- ambient particles (kept light for phones) ---------- */
const fx = $('#fx'), rnd = (a, b) => a + Math.random() * (b - a);
function spawn(cls, n, setup) {
  for (let i = 0; i < n; i++) {
    const e = document.createElement('i'); e.className = cls;
    const st = e.style;
    st.setProperty('--x', rnd(0, 100) + '%'); st.setProperty('--dl', -rnd(0, 16) + 's');
    setup(e, st); fx.appendChild(e);
  }
}
const lite = innerWidth < 600;
spawn('petal', lite ? 11 : 18, (e, s) => { s.setProperty('--s', rnd(10, 18) + 'px'); s.setProperty('--t', rnd(11, 19) + 's'); s.setProperty('--sw', rnd(-90, 90) + 'px'); });
spawn('hrt', lite ? 8 : 12, (e, s) => { e.textContent = '♥'; s.setProperty('--s', rnd(10, 22) + 'px'); s.setProperty('--t', rnd(12, 20) + 's'); s.setProperty('--sw', rnd(-50, 50) + 'px'); });
spawn('spk', lite ? 16 : 26, (e, s) => { s.setProperty('--y', rnd(0, 100) + '%'); s.setProperty('--s', rnd(2, 4) + 'px'); s.setProperty('--t', rnd(2.5, 6) + 's'); });

/* ---------- screens ---------- */
function go(n) {
  scene = n; document.body.dataset.s = n;
  screens.forEach(s => s.classList.toggle('active', +s.dataset.n === n));
  const v = $('#veil'); v.classList.remove('go'); void v.offsetWidth; v.classList.add('go');
  if (n === 2) enterLyrics();
}

/* ---------- lyrics ---------- */
function show(i) {
  if (i === cur) return; cur = i;
  clearTimeout(swapT); lyricEl.classList.remove('in');   // old line fades out first
  dots.forEach((d, k) => { d.classList.toggle('on', k === i); d.classList.toggle('done', k < i); });
  if (i < 0) return;
  swapT = setTimeout(() => { lyricEl.textContent = lyrics[i].text; lyricEl.classList.add('in'); }, 450);
}
function enterLyrics() {
  cur = -2; lyricEl.textContent = ''; lyricEl.classList.remove('in');
  if (audioOK && CONFIG.AUTO_SYNC) {
    if (audio.currentTime >= lastEnd) audio.currentTime = Math.max(0, lyrics[0].start - 1);
    if (audio.paused) audio.play().catch(() => {});
  } else show(0);
}
function sync() {                                   // driven by audio.currentTime only
  const t = audio.currentTime;
  if (CONFIG.DEV) dev.textContent = 't = ' + t.toFixed(2) + 's' + (audioOK ? '' : ' (no audio)');
  if (scene !== 2 || !audioOK || !CONFIG.AUTO_SYNC) return;
  if (t >= lastEnd) return go(3);
  show(lyrics.findIndex(l => t >= l.start && t < l.end));
}
(function loop() { sync(); requestAnimationFrame(loop); })();
audio.addEventListener('ended', () => { if (scene === 2) go(3); });

$('#next').onclick = () => {
  const n = cur + 1;
  if (n >= lyrics.length) return go(3);
  if (audioOK && CONFIG.AUTO_SYNC) { audio.currentTime = lyrics[n].start + 0.05; audio.play().catch(() => {}); }
  else show(n);
};
$('#replay').onclick = () => {
  if (audioOK && CONFIG.AUTO_SYNC) { audio.currentTime = lyrics[0].start; audio.play().catch(() => {}); }
  cur = -2; show(audioOK && CONFIG.AUTO_SYNC ? -1 : 0);
};

/* ---------- audio ---------- */
audio.addEventListener('error', () => { audioOK = false; mus.hidden = true; if (scene === 2) show(0); });
audio.addEventListener('play', () => mus.classList.add('playing'));
audio.addEventListener('pause', () => mus.classList.remove('playing'));
mus.onclick = () => audio.paused ? audio.play().catch(() => {}) : audio.pause();

/* ---------- buttons ---------- */
$('#open').onclick = () => {
  const p = audio.play(); if (p) p.catch(() => { audioOK = !audio.error; });
  mus.hidden = false; go(1);
};
$('#more').onclick = () => go(2);
$('#again').onclick = () => {
  if (audioOK) { audio.currentTime = 0; audio.play().catch(() => {}); }
  cur = -2; go(0);
};
