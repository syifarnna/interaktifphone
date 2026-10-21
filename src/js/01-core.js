'use strict';

const $ = (id) => document.getElementById(id);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

const IMG = {
  lock: '__IMG_WALL_LOCK__',
  home: '__IMG_WALL_HOME__',
  chatbg: '__IMG_CHATBG__',
  jo: '__IMG_JO__',
  shein: '__IMG_SHEIN__',
  dinda: '__IMG_DINDA__',
  bayu: '__IMG_BAYU__',
  calljo: '__IMG_JO_CALL__',
  g1: '__IMG_G1__', g2: '__IMG_G2__', g3: '__IMG_G3__',
  g4: '__IMG_G4__', g5: '__IMG_G5__', g6: '__IMG_G6__',
  g7: '__IMG_G7__', g8: '__IMG_G8__', g9: '__IMG_G9__'
};

const CONTACTS = {
  jo:    { name: 'Jo',    sub: 'online',                    img: IMG.jo,    color: '#2f80ed' },
  dinda: { name: 'Dinda', sub: 'online',                    img: IMG.dinda, color: '#e14a95' },
  bayu:  { name: 'Bayu',  sub: 'terakhir dilihat 14.52',    img: IMG.bayu,  color: '#6657df' },
  mama:  { name: 'Mama',  sub: 'terakhir dilihat 21.05',    initial: 'M',   color: '#c78b3b' }
};
const CONTACT_ORDER = ['jo', 'dinda', 'bayu', 'mama'];

const CHAPTERS = [
  { date: 'Kamis, 14 Mei',  minute: 22 * 60 + 15 },
  { date: 'Jumat, 15 Mei',  minute: 7 * 60 + 40 },
  { date: 'Jumat, 15 Mei',  minute: 23 * 60 + 10 },
  { date: 'Sabtu, 16 Mei',  minute: 15 * 60 + 20 },
  { date: 'Minggu, 17 Mei', minute: 8 * 60 + 10 }
];

const SAVE_KEY = 'jakarta-jogja.v1';
let S = loadState();
let CURRENT_SCREEN = 'lock';
let ACTIVE_CHAT = null;
let CURRENT_APP = null;
let PENDING_CHOICES = {};
let TORCH = false;
let PHOTO_FILTER = 'semua';
let VIEWER_STATE = null;
let CALL_BUSY = false;
let SCENE_BUSY = false;
let SAVE_TIMER = null;
let WEATHER_DATA = null;
let CAMERA_STREAM = null;
let CAMERA_FACING = 'user';
let CAMERA_PREVIEW = null;
let MUSIC_TIMER = null;
let MUSIC_POS = 0;
let BANNER_TIMER = null;
let BANNER_ACTION = null;
let TOAST_TIMER = null;
let pendingUnlockAction = null;
let passEntry = '';
let passAttempts = 0;

function makeId(){ return 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function msg(from, text, time, extra){ return Object.assign({ id: makeId(), from, text, time }, extra || {}); }

function seedChats(){
  return {
    jo: [
      msg('them', 'udah makan?', '13.42'),
      msg('me', 'udah dong. kamu?', '13.50'),
      msg('them', 'baru selesai rapat. makan nanti. jangan lupa istirahat ya', '13.51'),
      msg('me', 'iya, pak', '13.52'),
      msg('me', 'nanti malam jadi telpon?', '21.40'),
      msg('them', 'jadi. aku rapat dulu ya. maksimal jam 10', '21.44'),
      msg('them', 'telpon sekarang ya? aku baru selesai', '22.16'),
      msg('me', 'udah siap belum? aku udah mandi dari tadi', '22.15')
    ],
    dinda: [
      msg('them', 'shein, happy birthday ya. besok aku ke kos, kue udah aku pesen', '21.58'),
      msg('me', 'makasih din. kamu gak usah repot-repot', '22.02'),
      msg('them', 'diem. udah, besok sore ya', '22.03')
    ],
    bayu: [
      msg('them', 'shein, jo tadi lembur lagi. katanya mau telpon kamu abis ini', '21.30')
    ],
    mama: [
      msg('them', 'Nak, sudah makan? Jangan lupa istirahat.', '20.15'),
      msg('me', 'Udah, Ma. Mama juga jangan begadang.', '20.20')
    ]
  };
}

function defaultState(){
  return {
    v: 1,
    chapter: 0,
    minute: CHAPTERS[0].minute,
    chats: seedChats(),
    unread: { jo: 1, dinda: 0, bayu: 1, mama: 0 },
    flags: {},
    notes: [],
    cameraShots: [],
    ended: null,
    epilogue: false
  };
}

function loadState(){
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.v !== 1) return defaultState();
    const base = defaultState();
    return Object.assign(base, parsed, {
      chats: Object.assign(base.chats, parsed.chats || {}),
      unread: Object.assign(base.unread, parsed.unread || {}),
      flags: parsed.flags || {},
      notes: parsed.notes || [],
      cameraShots: parsed.cameraShots || []
    });
  } catch (e) { return defaultState(); }
}

function saveState(){
  clearTimeout(SAVE_TIMER);
  SAVE_TIMER = setTimeout(() => {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {}
  }, 180);
}
function saveNow(){ try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} }

function resetStory(){
  try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
  location.reload();
}

function fmtMin(m){
  m = ((Math.round(m) % 1440) + 1440) % 1440;
  return String(Math.floor(m / 60)).padStart(2, '0') + '.' + String(m % 60).padStart(2, '0');
}
function clockNow(){ return fmtMin(S.minute); }
function bumpClock(n){ S.minute = (S.minute + (n || 1)) % 1440; renderClock(); }
function chapterInfo(){ return CHAPTERS[clamp(S.chapter, 0, CHAPTERS.length - 1)]; }

function renderClock(){
  const t = fmtMin(S.minute);
  $('sbTime').textContent = t;
  $('lockClock').textContent = t;
  $('lockDate').textContent = chapterInfo().date;
}

function setChapter(n){
  S.chapter = clamp(n, 0, 4);
  S.minute = CHAPTERS[S.chapter].minute;
  renderClock();
  renderLockNotifs();
  saveState();
}

function setStatusTheme(light){
  $('statusbar') && $('statusbar').classList.toggle('light', !!light);
  $('homeIndicator') && $('homeIndicator').classList.toggle('light', !!light);
}

function showScreen(name){
  const ids = ['lock', 'pass', 'home', 'appPage'];
  ids.forEach(id => $(id).classList.toggle('hidden', id !== name));
  CURRENT_SCREEN = name;
  const homeVisible = name === 'home' || name === 'appPage';
  $('wallLock').classList.toggle('hidden', homeVisible);
  $('wallHome').classList.toggle('hidden', !homeVisible);
  if (!homeVisible) setStatusTheme(false);
  if (name === 'lock') {
    $('lock').classList.remove('slide-up');
    renderLockNotifs();
    renderClock();
  }
  if (name === 'home') { ACTIVE_CHAT = null; CURRENT_APP = null; setStatusTheme(false); }
}

function showPass(after){
  if (CALL_BUSY || SCENE_BUSY) return;
  pendingUnlockAction = typeof after === 'function' ? after : null;
  passEntry = '';
  passAttempts = 0;
  $('passError').textContent = '';
  renderDots();
  renderKeypad();
  showScreen('pass');
  setStatusTheme(false);
}
function hidePass(){
  pendingUnlockAction = null;
  passEntry = '';
  showScreen(S.chapter >= 0 ? 'lock' : 'lock');
}
function renderDots(){
  const dots = $('dots');
  if (!dots) return;
  dots.innerHTML = Array.from({ length: 4 }, (_, i) =>
    `<div class="dot${i < passEntry.length ? ' filled' : ''}"></div>`).join('');
}

function pressDigit(n){
  if (passEntry.length >= 4) return;
  ensureAudio();
  passEntry += String(n);
  renderDots();
  if (passEntry.length === 4) setTimeout(checkPass, 130);
}
function backDigit(){
  if (!passEntry.length) return;
  passEntry = passEntry.slice(0, -1);
  renderDots();
}
function renderKeypad(){
  const kp = $('keypad');
  if (!kp) return;
  const rows = [
    [{n:'1',l:''},{n:'2',l:'ABC'},{n:'3',l:'DEF'}],
    [{n:'4',l:'GHI'},{n:'5',l:'JKL'},{n:'6',l:'MNO'}],
    [{n:'7',l:'PQRS'},{n:'8',l:'TUV'},{n:'9',l:'WXYZ'}]
  ];
  let html = '';
  rows.forEach(r => r.forEach(k => {
    html += `<button class="key" onclick="pressDigit('${k.n}')" aria-label="Angka ${k.n}"><span class="key-number">${k.n}</span><span class="key-letters">${k.l}</span></button>`;
  }));
  html += `<div class="key key-empty"></div>`;
  html += `<button class="key" onclick="pressDigit('0')" aria-label="Angka 0"><span class="key-number">0</span><span class="key-letters"></span></button>`;
  html += `<button class="key key-back" onclick="backDigit()" aria-label="Hapus"><svg viewBox="0 0 24 24"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z"/><path d="M18 9l-6 6M12 9l6 6"/></svg></button>`;
  kp.innerHTML = html;
}

function checkPass(){
  if (passEntry === '2907') {
    passEntry = '';
    $('passError').textContent = '';
    showScreen('home');
    const action = pendingUnlockAction;
    pendingUnlockAction = null;
    onUnlocked();
    if (action) setTimeout(action, 220);
    saveState();
  } else {
    passAttempts++;
    passEntry = '';
    renderDots();
    $('passError').textContent = passAttempts >= 3
      ? 'Petunjuk: tanggal yang paling kamu tunggu.'
      : 'Kode sandi salah. Coba lagi.';
    const pass = $('pass');
    pass.classList.remove('shake');
    void pass.offsetWidth;
    pass.classList.add('shake');
    try { navigator.vibrate && navigator.vibrate(40); } catch (e) {}
    setTimeout(() => pass.classList.remove('shake'), 450);
  }
}

function giveHint(){
  $('passError').textContent = 'Petunjuk: 14/05. Ulang tahunmu.';
}

function onUnlocked(){
  if (S.chapter === 1 && !S.flags.hintMorning) {
    S.flags.hintMorning = true; saveState();
    setTimeout(() => bannerMsg('jo', 'kamu inget gak hari ini tanggal berapa?', 'sekarang'), 1400);
  } else if (S.chapter === 3 && !S.flags.hintArrival) {
    S.flags.hintArrival = true; saveState();
    setTimeout(() => bannerMsg('dinda', 'shein... ada yang nunggu di bawah.', 'sekarang'), 1600);
  }
}

function goHome(){
  stopCamera();
  closeViewer();
  closeKeyboard();
  if (CALL_BUSY || SCENE_BUSY) return;
  if (!S.ended) {
    // keep story state; simply return to springboard
  }
  showScreen('home');
  renderHome();
  setStatusTheme(false);
}

function lockPhone(){
  if (CALL_BUSY || SCENE_BUSY) return;
  closeKeyboard();
  stopCamera();
  showScreen('lock');
}

function toggleTorch(){
  TORCH = !TORCH;
  $('flashlight').classList.toggle('on', TORCH);
  $('torchBtn').classList.toggle('on', TORCH);
  try { navigator.vibrate && navigator.vibrate(10); } catch (e) {}
}

function openCameraQuick(){
  unlockThen(() => openApp('camera'));
}

function unlockThen(fn){
  if (CURRENT_SCREEN === 'lock' || CURRENT_SCREEN === 'pass') {
    showPass(() => { showScreen('home'); fn(); });
  } else {
    fn();
  }
}

function toast(text, ms){
  const el = $('toast');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(TOAST_TIMER);
  TOAST_TIMER = setTimeout(() => el.classList.remove('show'), ms || 2200);
}

function lockNotifsData(){
  const list = [];
  if (S.chapter === 0) {
    list.push({ who: 'Dinda', chat: 'dinda', text: 'Shein, happy birthday ya. Besok aku ke kos, kue udah aku pesen.', time: '21.58' });
    list.push({ who: 'Jo', chat: 'jo', text: 'Telpon sekarang ya? Aku baru selesai.', time: '22.16' });
  } else if (S.chapter === 1) {
    list.push({ who: 'Dinda', chat: 'dinda', text: 'shein, aku ke kos sore ini ya. kue udah dipesen.', time: '07.10' });
    list.push({ who: 'Jo', chat: 'jo', text: 'kamu inget gak hari ini tanggal berapa?', time: '07.40' });
  } else if (S.chapter === 2) {
    list.push({ who: 'Dinda', chat: 'dinda', text: 'kamu gimana? udah tidur?', time: '23.50' });
    list.push({ who: 'Jo', chat: 'jo', text: 'shein, aku minta maaf. beneran.', time: '23.34' });
  } else if (S.chapter === 3) {
    list.push({ who: 'Dinda', chat: 'dinda', text: 'shein... ada yang nunggu di bawah. jangan kaget.', time: '15.12' });
    list.push({ who: 'Bayu', chat: 'bayu', text: 'Shein, Jo ambil cuti dan ke Jogja. Tolong dengerin dia dulu ya.', time: '14.58' });
  }
  return list;
}

function contactAvatarInner(id, cls){
  const c = CONTACTS[id];
  if (!c) return '';
  if (c.img) return `<img src="${c.img}" alt="">`;
  return `<span style="display:grid;place-items:center;width:100%;height:100%;background:${c.color}">${esc(c.initial || c.name[0])}</span>`;
}

function renderLockNotifs(){
  const wrap = $('lockNotifs');
  if (!wrap) return;
  const data = lockNotifsData();
  if (!data.length) { wrap.innerHTML = ''; return; }
  wrap.innerHTML = data.map(n => {
    const c = CONTACTS[n.chat] || {};
    return `<button class="lock-notif" onclick="openNotif('${n.chat}')" aria-label="Buka pesan dari ${esc(n.who)}">
      <span class="nt-ic wa">${contactAvatarInner(n.chat)}</span>
      <span class="nt-main">
        <span class="nt-top"><span>WhatsApp</span><small>${esc(n.time)}</small></span>
        <span class="nt-body"><b>${esc(n.who)}</b><span>${esc(n.text)}</span></span>
      </span>
    </button>`;
  }).join('');
}

function openNotif(chatId){
  unlockThen(() => {
    openApp('whatsapp');
    setTimeout(() => openChat(chatId), 120);
  });
}

function bannerMsg(chatId, text, time, opts){
  opts = opts || {};
  const c = CONTACTS[chatId] || { name: 'Pesan', color: '#2b2d36' };
  const el = $('banner');
  el.innerHTML = `
    <span class="bn-ic${opts.sys ? ' sys' : ''}">${opts.sys ? '' : contactAvatarInner(chatId)}</span>
    <span class="bn-main">
      <span class="bn-top"><span>${opts.sys ? 'iPhone' : 'WhatsApp'}</span><small>${esc(time || 'sekarang')}</small></span>
      <span class="bn-body"><b>${esc(c.name)}</b> &middot; ${esc(text)}</span>
    </span>`;
  BANNER_ACTION = () => {
    if (opts.sys && opts.action) { opts.action(); return; }
    unlockThen(() => { openApp('whatsapp'); setTimeout(() => openChat(chatId), 120); });
  };
  el.classList.add('show');
  el.onclick = () => { el.classList.remove('show'); if (BANNER_ACTION) BANNER_ACTION(); };
  clearTimeout(BANNER_TIMER);
  BANNER_TIMER = setTimeout(hideBanner, opts.sticky ? 8000 : 5000);
  if (!opts.silent) sfxNotif();
}

function hideBanner(){ $('banner').classList.remove('show'); }

let audioCtx = null;
function ensureAudio(){
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { audioCtx = null; }
  }
  if (audioCtx && audioCtx.state === 'suspended') { try { audioCtx.resume(); } catch (e) {} }
  return audioCtx;
}
function tone(freq, start, dur, vol){
  const ac = ensureAudio();
  if (!ac) return;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = 'sine';
  o.frequency.value = freq;
  o.connect(g); g.connect(ac.destination);
  const t0 = ac.currentTime + start;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(vol || 0.08, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.start(t0); o.stop(t0 + dur + 0.02);
}
function sfxNotif(){
  tone(880, 0, 0.16, 0.05);
  tone(1174.7, 0.14, 0.24, 0.045);
}
function sfxSend(){
  tone(620, 0, 0.08, 0.03);
}
let RING_TIMER = null;
function startRingtone(){
  stopRingtone();
  const play = () => {
    tone(659.3, 0, 0.32, 0.06);
    tone(783.99, 0.36, 0.32, 0.06);
  };
  play();
  RING_TIMER = setInterval(play, 1400);
}
function stopRingtone(){ if (RING_TIMER) { clearInterval(RING_TIMER); RING_TIMER = null; } }

function vibrate(pattern){ try { navigator.vibrate && navigator.vibrate(pattern); } catch (e) {} }

function timeSkip(kicker, title, sub, duration){
  return new Promise(resolve => {
    const el = $('timeskip');
    $('tsKicker').textContent = kicker || '';
    $('tsTitle').textContent = title || '';
    $('tsSub').textContent = sub || '';
    el.classList.add('show');
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      el.classList.remove('show');
      el.onclick = null;
      setTimeout(resolve, 380);
    };
    el.onclick = finish;
    setTimeout(finish, duration || 2800);
  });
}

async function loadWeather(){
  const fallback = { temp: 27, cond: 'Hujan ringan', min: 24, max: 30 };
  renderWeather(fallback, true);
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6500);
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=-7.7956&longitude=110.3695'
      + '&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min'
      + '&timezone=Asia%2FJakarta&forecast_days=1';
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return;
    const d = await res.json();
    if (!d || !d.current) return;
    WEATHER_DATA = d;
    renderWeather({
      temp: Math.round(d.current.temperature_2m),
      cond: weatherText(d.current.weather_code),
      min: Math.round(d.daily.temperature_2m_min[0]),
      max: Math.round(d.daily.temperature_2m_max[0]),
      code: d.current.weather_code
    }, false);
  } catch (e) {}
}

function weatherText(code){
  if (code === 0) return 'Cerah';
  if (code <= 2) return 'Cerah berawan';
  if (code === 3) return 'Berawan';
  if (code === 45 || code === 48) return 'Berkabut';
  if (code >= 51 && code <= 57) return 'Gerimis';
  if (code >= 61 && code <= 67) return 'Hujan';
  if (code >= 80 && code <= 82) return 'Hujan deras';
  if (code >= 95) return 'Hujan petir';
  return 'Berawan';
}
function weatherIcon(code){
  if (code === 0) return `<svg width="40" height="40" viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="8" fill="#ffd166"/><g stroke="#ffd166" stroke-width="2" stroke-linecap="round"><path d="M20 5v4M20 31v4M5 20h4M31 20h4M9.4 9.4l2.8 2.8M27.8 27.8l2.8 2.8M30.6 9.4l-2.8 2.8M12.2 27.8l-2.8 2.8"/></g></svg>`;
  if (code >= 51) return `<svg width="44" height="40" viewBox="0 0 44 40" fill="none"><path d="M12 25a7 7 0 0 1 .8-13.9A9.5 9.5 0 0 1 31 13a6.5 6.5 0 0 1 1 12.9" fill="#dfe8f5" opacity=".92"/><g stroke="#7fb6ff" stroke-width="2.2" stroke-linecap="round"><path d="M15 30l-2 5M23 30l-2 5M31 30l-2 5"/></g></svg>`;
  return `<svg width="44" height="40" viewBox="0 0 44 40" fill="none"><path d="M12 26a7.5 7.5 0 0 1 .7-15A10 10 0 0 1 32 13.6 7 7 0 0 1 33 27.6" fill="#e9eef6" opacity=".95"/></svg>`;
}
function renderWeather(data, fallback){
  const t = $('wTemp'), c = $('wCond'), r = $('wRange'), i = $('wIcon'), u = $('wUpdated');
  if (!t) return;
  t.textContent = data.temp + '\u00B0';
  c.textContent = data.cond;
  r.textContent = data.min + '\u00B0 / ' + data.max + '\u00B0 \u00B7 prakiraan';
  i.innerHTML = weatherIcon(data.code == null ? 61 : data.code);
  u.textContent = fallback ? 'LURING' : 'LIVE';
}

function setBgImage(){
  // wallpapers are set via CSS tokens
}

function updateWeatherOnHome(){ if (WEATHER_DATA) loadWeather(); }
