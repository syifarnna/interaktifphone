function openWhatsApp(arg){
  mountApp('light', 'wa-list', `
    <div class="wa">
      <div class="wa-head">
        <span>WhatsApp</span>
        <span class="wa-head-actions">
          <button onclick="toast('Fitur belum tersedia')"><svg viewBox="0 0 24 24"><path d="M12 2a3 3 0 0 1 3 3v1H9V5a3 3 0 0 1 3-3ZM7 8h10a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2Z"/></svg></button>
        </span>
      </div>
      <div class="wa-search">
        <label><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input id="waSearch" placeholder="Cari chat" oninput="waSetQuery(this.value)"></label>
      </div>
      <div class="wa-filters">
        <button class="wa-filter active" onclick="waSetFilter('semua')">Semua</button>
        <button class="wa-filter" onclick="waSetFilter('unread')">Belum dibaca</button>
      </div>
      <div class="wa-list" id="waList">${waListHTML()}</div>
    </div>`);
  if (arg) setTimeout(() => openChat(arg), 120);
}

function waListHTML(){
  const q = (WA_QUERY || '').toLowerCase();
  return CONTACT_ORDER.filter(id => {
    const c = CONTACTS[id];
    if (!c) return false;
    if (q && !c.name.toLowerCase().includes(q)) return false;
    if (WA_FILTER === 'unread' && !S.unread[id]) return false;
    return true;
  }).map(id => {
    const c = CONTACTS[id];
    const msgs = S.chats[id] || [];
    const last = msgs[msgs.length - 1];
    const unread = S.unread[id] || 0;
    return `<button class="wa-row${unread ? ' unread' : ''}" onclick="openChat('${id}')">
      <span class="wa-avatar">${contactAvatarInner(id)}</span>
      <span class="wa-main">
        <span class="wa-top"><b>${esc(c.name)}</b><small>${last ? esc(last.time) : ''}</small></span>
        <span class="wa-bot">${last ? esc(last.text) : ''}${unread ? `<span class="badge">${unread}</span>` : ''}</span>
      </span>
    </button>`;
  }).join('');
}

function openPhoneApp(){
  mountApp('light', 'phone-app', `
    <div class="app-inner">
      ${appBackBtn('Kembali')}
      <div class="phone-grid">
        <button class="phone-btn" onclick="dialPad('1')">1</button>
        <button class="phone-btn" onclick="dialPad('2')">2</button>
        <button class="phone-btn" onclick="dialPad('3')">3</button>
        <button class="phone-btn" onclick="dialPad('4')">4</button>
        <button class="phone-btn" onclick="dialPad('5')">5</button>
        <button class="phone-btn" onclick="dialPad('6')">6</button>
        <button class="phone-btn" onclick="dialPad('7')">7</button>
        <button class="phone-btn" onclick="dialPad('8')">8</button>
        <button class="phone-btn" onclick="dialPad('9')">9</button>
        <button class="phone-btn" onclick="dialPad('*')">*</button>
        <button class="phone-btn" onclick="dialPad('0')">0</button>
        <button class="phone-btn" onclick="dialPad('#')">#</button>
      </div>
      <div class="dial-display" id="dialDisplay"></div>
      <button class="call-btn" onclick="startDialCall()">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="#fff"><path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.24 1.02l-2.21 2.2Z"/></svg>
      </button>
    </div>`);
}

let DIAL_NUM = '';
function dialPad(k){
  ensureAudio();
  DIAL_NUM += k;
  const el = $('dialDisplay');
  if (el) el.textContent = DIAL_NUM;
}

function startDialCall(){
  if (!DIAL_NUM) return;
  const num = DIAL_NUM;
  DIAL_NUM = '';
  const el = $('dialDisplay');
  if (el) el.textContent = '';
  toast('Memanggil ' + num + '...');
}

function openNotes(){
  mountApp('light', 'notes-app', `
    <div class="app-inner">
      ${appBackBtn('Kembali')}
      <h2>Catatan</h2>
      <div class="notes-list">
        ${S.notes.length ? S.notes.map((n, i) => `
          <div class="note-card">
            <div class="note-date">${esc(n.date)}</div>
            <div class="note-text">${esc(n.text)}</div>
          </div>`).join('') : '<div class="note-empty">Belum ada catatan.</div>'}
      </div>
      <button class="fab" onclick="addNotePrompt()" aria-label="Tambah catatan">+</button>
    </div>`);
}

function addNotePrompt(){
  const text = prompt('Tulis catatan baru:');
  if (!text) return;
  S.notes.push({ date: clockNow(), text });
  saveState();
  openNotes();
}

function openCalendar(){
  const day = [14, 15, 15, 16, 17][clamp(S.chapter, 0, 4)];
  mountApp('light', 'calendar-app', `
    <div class="app-inner">
      ${appBackBtn('Kembali')}
      <h2>Kalender</h2>
      <div class="cal-card">
        <div class="cal-month">Mei 2026</div>
        <div class="cal-day">${day}</div>
        <div class="cal-event">${chapterInfo().date}</div>
      </div>
    </div>`);
}

function openMemos(){
  mountApp('light', 'memos-app', `
    <div class="app-inner">
      ${appBackBtn('Kembali')}
      <h2>Memo Suara</h2>
      <div class="memo-list">
        <div class="memo-empty">Belum ada rekaman.</div>
      </div>
      <button class="fab record-btn" onclick="recordMemo()" aria-label="Rekam memo">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="#ff453a"><circle cx="12" cy="12" r="8"/></svg>
      </button>
    </div>`);
}

function recordMemo(){
  toast('Merekam...');
  setTimeout(() => toast('Rekaman disimpan.'), 2000);
}

function openPhotos(){
  mountApp('dark', 'photos-app', `
    <div class="app-inner photos-dark">
      ${appBackBtn('Kembali')}
      <h2>Foto</h2>
      <div class="photo-tabs">
        <button class="photo-tab${PHOTO_FILTER === 'semua' ? ' active' : ''}" onclick="setPhotoFilter('semua')">Semua</button>
        <button class="photo-tab${PHOTO_FILTER === 'kita' ? ' active' : ''}" onclick="setPhotoFilter('kita')">Kita</button>
        <button class="photo-tab${PHOTO_FILTER === 'jogja' ? ' active' : ''}" onclick="setPhotoFilter('jogja')">Jogja</button>
        <button class="photo-tab${PHOTO_FILTER === 'kamera' ? ' active' : ''}" onclick="setPhotoFilter('kamera')">Kamera</button>
      </div>
      <div class="photo-grid" id="photoGrid">${photoGridHTML()}</div>
    </div>`);
}

function setPhotoFilter(f){
  PHOTO_FILTER = f;
  const g = $('photoGrid');
  if (g) g.innerHTML = photoGridHTML();
  $$('.photo-tab').forEach(b => b.classList.toggle('active', b.textContent.toLowerCase() === f));
}

function photoGridHTML(){
  const all = [IMG.g1, IMG.g2, IMG.g3, IMG.g4, IMG.g5, IMG.g6, IMG.g7, IMG.g8, IMG.g9];
  const kita = [IMG.g1, IMG.g2, IMG.g3];
  const jogja = [IMG.g4, IMG.g5, IMG.g6, IMG.g7, IMG.g8];
  const kamera = S.cameraShots.length ? S.cameraShots : [IMG.g9];
  let src = all;
  if (PHOTO_FILTER === 'kita') src = kita;
  else if (PHOTO_FILTER === 'jogja') src = jogja;
  else if (PHOTO_FILTER === 'kamera') src = kamera;
  return src.map((s, i) => `<button class="photo-thumb" onclick="openViewer('${s}', ${i})"><img src="${s}" alt=""></button>`).join('');
}

function openViewer(src, idx){
  VIEWER_STATE = { src, idx };
  const v = $('viewer');
  v.classList.remove('hidden');
  v.innerHTML = `<img src="${src}" alt="">`;
  v.onclick = closeViewer;
}

function closeViewer(){
  VIEWER_STATE = null;
  const v = $('viewer');
  v.classList.add('hidden');
  v.innerHTML = '';
  v.onclick = null;
}

function openSafari(){
  mountApp('light', 'safari-app', `
    <div class="app-inner">
      ${appBackBtn('Kembali')}
      <div class="safari-bar">
        <div class="safari-url">opencode.ai/search</div>
      </div>
      <div class="safari-content">
        <p>Halaman simulasi Safari.</p>
      </div>
    </div>`);
}

function openCamera(){
  mountApp('dark', 'camera-app', `
    <div class="app-inner camera-full">
      <video id="camVideo" autoplay playsinline muted></video>
      <div class="cam-controls">
        <button class="shutter-btn" onclick="takePhoto()" aria-label="Ambil foto"></button>
        <button class="flip-btn" onclick="flipCamera()" aria-label="Putar kamera">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="#fff"><path d="M12 5V2L8 6l4 4V7c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0 0 20 13c0-4.42-3.58-8-8-8Zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 8.74A7.93 7.93 0 0 0 4 13c0 4.42 3.58 8 8 8v3l4-4-4-4v3Z"/></svg>
        </button>
      </div>
    </div>`);
  startCamera();
}

async function startCamera(){
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: CAMERA_FACING },
      audio: false
    });
    CAMERA_STREAM = stream;
    const v = $('camVideo');
    if (v) v.srcObject = stream;
  } catch (e) {
    toast('Kamera tidak dapat diakses.');
  }
}

function stopCamera(){
  if (CAMERA_STREAM) {
    CAMERA_STREAM.getTracks().forEach(t => t.stop());
    CAMERA_STREAM = null;
  }
  const v = $('camVideo');
  if (v) v.srcObject = null;
}

function flipCamera(){
  CAMERA_FACING = CAMERA_FACING === 'user' ? 'environment' : 'user';
  stopCamera();
  startCamera();
}

function takePhoto(){
  const v = $('camVideo');
  if (!v) return;
  const canvas = document.createElement('canvas');
  canvas.width = v.videoWidth || 640;
  canvas.height = v.videoHeight || 480;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(v, 0, 0);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  S.cameraShots.push(dataUrl);
  saveState();
  toast('Foto disimpan.');
}

function openMusic(){
  mountApp('dark', 'music-app', `
    <div class="app-inner music-dark">
      ${appBackBtn('Kembali')}
      <div class="music-art">
        <img src="${IMG.g9}" alt="Artwork">
      </div>
      <div class="music-info">
        <div class="music-title">Lagu Kenangan</div>
        <div class="music-artist">Jo & Shein</div>
      </div>
      <div class="music-progress">
        <div class="music-bar" style="width: ${MUSIC_POS}%"></div>
      </div>
      <div class="music-controls">
        <button onclick="musicPrev()" aria-label="Sebelumnya">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="#fff"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
        </button>
        <button onclick="musicToggle()" aria-label="Putar/Jeda" id="musicPlayBtn">
          <svg viewBox="0 0 24 24" width="36" height="36" fill="#fff" id="musicPlayIcon"><path d="M8 5v14l11-7z"/></svg>
        </button>
        <button onclick="musicNext()" aria-label="Selanjutnya">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="#fff"><path d="M16 18h2V6h-2zm-10 0 8.5-6L6 6z"/></svg>
        </button>
      </div>
    </div>`);
}

let MUSIC_PLAYING = false;
function musicToggle(){
  MUSIC_PLAYING = !MUSIC_PLAYING;
  const btn = $('musicPlayBtn');
  const icon = $('musicPlayIcon');
  if (MUSIC_PLAYING) {
    btn.innerHTML = '<svg viewBox="0 0 24 24" width="36" height="36" fill="#fff"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
    startMusicTimer();
  } else {
    btn.innerHTML = '<svg viewBox="0 0 24 24" width="36" height="36" fill="#fff"><path d="M8 5v14l11-7z"/></svg>';
    stopMusicTimer();
  }
}

function startMusicTimer(){
  stopMusicTimer();
  MUSIC_TIMER = setInterval(() => {
    MUSIC_POS = (MUSIC_POS + 1) % 100;
    const bar = $('.music-bar');
    if (bar) bar.style.width = MUSIC_POS + '%';
  }, 1000);
}

function stopMusicTimer(){
  if (MUSIC_TIMER) { clearInterval(MUSIC_TIMER); MUSIC_TIMER = null; }
}

function musicPrev(){ MUSIC_POS = 0; }
function musicNext(){ MUSIC_POS = 0; }
