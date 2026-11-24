/* =====================  НАСТРОЙКИ  ===================== */
const CONFIG = {
  music: 'music.mp3',          // ← путь к музыкальному файлу (положи рядом с index.html)
  volume: 0.7,                 // итоговая громкость 0..1
  fadeInMs: 1600,              // плавное нарастание звука
  caption: 'Люблю тебя, викусен' // финальная подпись
};
/* ======================================================= */

const $ = (s) => document.querySelector(s);
const stage = $('#stage'), world = $('#world'), card = $('#card');
const heartsLayer = $('#hearts');
const PALETTE = ['#ff6fa5', '#ff8fb8', '#ffa6c9', '#ff5d93', '#ffc2da', '#ff7fd0'];
const rnd = (a, b) => a + Math.random() * (b - a);
const timers = [];
const at = (ms, fn) => timers.push(setTimeout(fn, ms));

/* ---------- звёзды на тёмном фоне ---------- */
for (let i = 0; i < 46; i++) {
  const s = document.createElement('i');
  s.className = 'star';
  s.style.cssText = `left:${rnd(0, 100)}%;top:${rnd(0, 100)}%;animation-delay:${rnd(0, 3)}s;animation-duration:${rnd(2.5, 5)}s`;
  $('#stars').appendChild(s);
}

/* ---------- звёзды ночного неба ---------- */
(function(){let o='';for(let i=0;i<90;i++){const x=rnd(0,1600),y=rnd(0,560),r=rnd(.8,2.2);
o+=`<circle class="wst" cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(1)}" fill="#fff" style="animation-delay:${rnd(0,3).toFixed(1)}s"/>`;}
$('#wstars').innerHTML=o;})();

/* ---------- город (генерируется один раз) ---------- */
(function buildCity() {
  let seed = 7;
  const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const layer = (id, fill, minW, maxW, minH, maxH, windows) => {
    let x = -20, out = '';
    while (x < 1620) {
      const w = minW + r() * (maxW - minW), h = minH + r() * (maxH - minH), y = 830 - h;
      out += `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" fill="${fill}"/>`;
      if (r() > .65) out += `<rect x="${(x + w / 2 - 2).toFixed(0)}" y="${(y - 26).toFixed(0)}" width="4" height="26" fill="${fill}"/>`;
      if (windows) {
        for (let wy = y + 14; wy < 800; wy += 22)
          for (let wx = x + 10; wx < x + w - 12; wx += 18)
            if (r() > .5) out += `<rect class="win" style="animation-delay:${(r() * 4).toFixed(1)}s" x="${wx.toFixed(0)}" y="${wy.toFixed(0)}" width="6" height="9" rx="1" fill="#ffe7a8"/>`;
      }
      x += w + 2 + r() * 6;
    }
    $(id).innerHTML = out;
  };
  layer('#far', 'url(#gFar)', 50, 110, 140, 340, false);
  layer('#near', 'url(#gNear)', 70, 140, 80, 250, true);
})();

/* ---------- сердечки ---------- */
function spawnHeart(kind, o = {}) {
  if (document.hidden || heartsLayer.children.length > 90) return;
  const h = document.createElement('span');
  h.className = 'heart ' + kind;
  h.textContent = '♥';
  const vw = innerWidth, vh = innerHeight;
  const size = o.size || rnd(10, 30);
  h.style.fontSize = size + 'px';
  h.style.color = PALETTE[(Math.random() * PALETTE.length) | 0];
  h.style.left = (o.x ?? rnd(0, vw)) + 'px';
  h.style.top = (o.y ?? 0) + 'px';
  h.style.setProperty('--dur', (o.dur || rnd(7, 15)) + 's');
  h.style.setProperty('--o', (o.op || rnd(.35, .95)).toFixed(2));
  h.style.setProperty('--dx', (o.dx ?? rnd(-60, 60)) + 'px');
  h.style.setProperty('--dy', (o.dy ?? -vh * .35) + 'px');
  h.style.setProperty('--rot', (o.rot ?? rnd(-200, 200)) + 'deg');
  h.addEventListener('animationend', () => h.remove());
  heartsLayer.appendChild(h);
}

let rainTimer = null;
const startRain = () => { rainTimer = setInterval(() => spawnHeart('fall', { rot: Math.random() > .5 ? rnd(-260, 260) : rnd(-20, 20) }), 280); };

function burst(n) {
  const cx = innerWidth / 2, cy = innerHeight / 2;
  for (let i = 0; i < n; i++) {
    const a = rnd(0, Math.PI * 2), d = rnd(120, Math.min(innerWidth, innerHeight) * .7);
    spawnHeart('burst', { x: cx, y: cy, size: rnd(8, 24), dx: Math.cos(a) * d, dy: Math.sin(a) * d, dur: rnd(1.8, 3.2), rot: rnd(-90, 90) });
  }
}

/* Сердечки между персонажами — «как в Minecraft» */
let streamOn = false, streamT0 = 0, kissing = false;
function streamLoop() {
  if (!streamOn) return;
  const el = $('#anchor').getBoundingClientRect();
  const k = Math.min(1, (Date.now() - streamT0) / 8000);
  const n = kissing ? 3 : 1;
  for (let i = 0; i < n; i++)
    spawnHeart('up', {
      x: el.left + rnd(-26, 26) * (innerWidth < 600 ? .7 : 1), y: el.top + rnd(-10, 40),
      size: (kissing ? rnd(36, 70) : rnd(24, 44)) * (innerWidth < 600 ? .75 : 1), dx: rnd(-70, 70), dy: -rnd(innerHeight * .18, innerHeight * (kissing ? .5 : .32)),
      dur: rnd(3.5, 6), rot: rnd(-35, 35), op: 1
    });
  setTimeout(streamLoop, kissing ? 150 : 750 - 600 * k);
}

/* ---------- блики ---------- */
function startBokeh() {
  const box = $('#bokeh');
  for (let i = 0; i < 12; i++) {
    const b = document.createElement('i'), s = rnd(60, 180);
    b.className = 'bk';
    b.style.cssText = `left:${rnd(0, 100)}%;top:${rnd(5, 85)}%;width:${s}px;height:${s}px;animation-delay:${rnd(0, 9)}s;animation-duration:${rnd(7, 12)}s`;
    box.appendChild(b);
  }
}

/* ---------- музыка ---------- */
let audio = null;
function startMusic() {
  audio = new Audio(CONFIG.music);
  audio.loop = true;
  audio.volume = 0;
  const p = audio.play();
  const fade = () => {
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / CONFIG.fadeInMs);
      audio.volume = CONFIG.volume * k * k * (3 - 2 * k); // smoothstep
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if (p && p.then) p.then(fade).catch(() => { /* файла нет или браузер запретил — сайт продолжит без звука */ });
  else fade();
  audio.addEventListener('error', () => $('#sound').classList.remove('on'));
}
$('#sound').addEventListener('click', (e) => {
  if (!audio) return;
  audio.muted = !audio.muted;
  e.currentTarget.classList.toggle('off', audio.muted);
});

/* ---------- сценарий ---------- */
let started = false;
function play() {
  if (started) return;
  started = true;
  const btn = $('#openBtn');
  btn.disabled = true;

  // Сцена 2: открытие
  card.classList.add('glow');                 // кнопка гаснет, карточка светится
  startMusic();
  $('#sound').classList.add('on');

  at(1500, () => {                            // карточка разламывается
    ['l', 'r'].forEach((side) => {
      const c = card.cloneNode(true);
      c.removeAttribute('id');
      c.classList.add('half', side);
      c.classList.remove('glow');
      c.querySelector('button').remove();
      stage.appendChild(c);
      c.addEventListener('animationend', () => c.remove());
    });
    card.classList.add('hidden');
  });
  at(2600, () => {                            // из центра вылетает сердце
    $('#bigheart').classList.add('pop');
    burst(26);
  });
  at(3400, startRain);
  at(3800, () => { burst(14); startBokeh(); });

  // Сцена 4: ночной город и персонажи (через ~1.5 с после появления сердца)
  at(4100, () => { world.classList.add('show'); $('#bigheart').classList.add('leave'); });
  at(6500, () => world.classList.add('zoom'));         // камера приближается
  at(11500, () => stage.classList.add('turn'));        // поворачиваются друг к другу
  at(14000, () => stage.classList.add('approach'));    // сближаются
  at(17500, () => { streamOn = true; streamT0 = Date.now(); streamLoop(); });
  at(27000, () => { kissing = true; stage.classList.add('kiss'); burst(16); }); // поцелуй
  at(39000, () => { world.classList.remove('zoom'); world.classList.add('zoomfar'); kissing = false; });

  // Финал
  at(45000, () => {
    const cap = $('#caption');
    cap.textContent = CONFIG.caption;
    cap.classList.add('on');
  });
  at(49000, () => $('#replay').classList.add('on'));
}

btn_init();
function btn_init() {
  $('#openBtn').addEventListener('click', play);
}

/* Повторный запуск: перезагрузка страницы возвращает к карточке (музыка снова стартует только по кнопке) */
$('#replay').addEventListener('click', () => {
  timers.forEach(clearTimeout);
  clearInterval(rainTimer);
  streamOn = false;
  if (audio) audio.pause();
  location.reload();
});
