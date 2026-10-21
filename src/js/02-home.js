const APPS = [
  { id: 'calendar', name: 'Kalender' },
  { id: 'memos',    name: 'Memo Suara' },
  { id: 'notes',    name: 'Catatan' },
  { id: 'photos',   name: 'Foto' },
  { id: 'music',    name: 'Musik' }
];
const DOCK = [
  { id: 'phone',    name: 'Telepon' },
  { id: 'whatsapp', name: 'WhatsApp' },
  { id: 'safari',   name: 'Safari' },
  { id: 'camera',   name: 'Kamera' }
];

function wAIcon(){ return `<span class="ic ic-wa"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.3 11.6a8.4 8.4 0 0 1-12.5 7.3L3 20l1.2-4.7a8.4 8.4 0 1 1 16.1-3.7Z"/><path d="M8.6 8.5c.5 3 3.1 5.6 6.1 6.4l1.6-1.6-2.2-1.2-.9 1c-1.1-.5-2-1.4-2.5-2.5l1-.9-1.2-2.2Z" fill="#fff" stroke="none"/></svg></span>`; }
function notesIcon(){ return `<span class="ic ic-notes"><span class="paper"><i></i><i></i><i></i><i></i></span></span>`; }
function photosIcon(){
  const petals = Array.from({length: 8}, (_, i) => `<ellipse cx="30" cy="16" rx="5.5" ry="11" fill="${['#ffcd00','#ff9f0a','#ff375f','#bf5af2','#0a84ff','#32d74b','#66d4cf','#ff6482'][i]}" transform="rotate(${i * 45} 30 30)" opacity="${i % 2 ? .82 : .92}"/>`).join('');
  return `<span class="ic ic-photos"><svg width="46" height="46" viewBox="0 0 60 60">${petals}<circle cx="30" cy="30" r="6.5" fill="#fff" opacity=".9"/></svg></span>`;
}
function musicIcon(){ return `<span class="ic ic-music"><svg width="30" height="30" viewBox="0 0 24 24" fill="#fff"><path d="M20 4.3v9.9a3.4 3.4 0 1 1-1.6-2.9V7.1L10 9v7.6a3.4 3.4 0 1 1-1.6-2.9V6.6L20 4.3ZM18.4 17.6a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6ZM8.4 19.8a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6Z"/></svg></span>`; }
function phoneIcon(){ return `<span class="ic ic-phone"><svg width="32" height="32" viewBox="0 0 24 24" fill="#fff"><path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.24 1.02l-2.21 2.2Z"/></svg></span>`; }
function safariIcon(){ return `<span class="ic ic-safari"><svg width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="19" stroke="#fff" stroke-width="2" opacity=".9"/><path d="M32 16l-5.2 10.8L16 32l5.2-10.8L32 16Z" fill="#fff"/><circle cx="24" cy="24" r="2.2" fill="#0a6fe8"/></svg></span>`; }
function cameraIcon(){ return `<span class="ic ic-camera"><svg width="35" height="35" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.5"><rect x="3" y="6.5" width="18" height="13.5" rx="2.6"/><path d="M8.5 6.5l1.4-2.8h4.2l1.4 2.8"/><circle cx="12" cy="13" r="4.2"/></svg></span>`; }
function memoIcon(){ return `<span class="ic ic-memo"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ff453a" stroke-width="2" stroke-linecap="round"><path d="M4 12h2M8 7v10M12 4v16M16 8v8M20 11v2"/></svg></span>`; }
function calendarIcon(){
  const day = [14, 15, 15, 16, 17][clamp(S.chapter, 0, 4)];
  return `<span class="ic ic-cal"><b>MEI</b><strong>${day}</strong></span>`;
}
function appIcon(id){
  switch (id) {
    case 'whatsapp': return wAIcon();
    case 'notes': return notesIcon();
    case 'photos': return photosIcon();
    case 'music': return musicIcon();
    case 'phone': return phoneIcon();
    case 'safari': return safariIcon();
    case 'camera': return cameraIcon();
    case 'memos': return memoIcon();
    case 'calendar': return calendarIcon();
    default: return '';
  }
}

function appHTML(a){
  return `<button class="app" onclick="openApp('${a.id}')" aria-label="Buka ${esc(a.name)}">
    <span class="appicon">${appIcon(a.id)}</span><span>${esc(a.name)}</span></button>`;
}

function renderHome(){
  const grid = $('appgrid'), dock = $('dock');
  if (!grid || !dock) return;
  grid.innerHTML = APPS.map(appHTML).join('');
  dock.innerHTML = DOCK.map(appHTML).join('');
}

function mountApp(theme, cls, html){
  closeKeyboard();
  stopCamera();
  closeViewer();
  const p = $('appPage');
  p.className = 'screen app-page ' + (cls || '') + (theme === 'dark' ? ' dark' : '');
  p.innerHTML = html;
  showScreen('appPage');
  setStatusTheme(theme !== 'dark');
  return p;
}

function appBackBtn(label){
  return `<button class="hbtn" onclick="goHome()" aria-label="Kembali"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>${esc(label || '')}</button>`;
}

function openApp(id, arg){
  CURRENT_APP = id;
  if (CURRENT_SCREEN === 'lock' || CURRENT_SCREEN === 'pass') {
    unlockThen(() => openApp(id, arg));
    return;
  }
  switch (id) {
    case 'whatsapp': openWhatsApp(arg); break;
    case 'phone': openPhoneApp(); break;
    case 'notes': openNotes(); break;
    case 'calendar': openCalendar(); break;
    case 'memos': openMemos(); break;
    case 'photos': openPhotos(); break;
    case 'safari': openSafari(); break;
    case 'camera': openCamera(); break;
    case 'music': openMusic(); break;
    default: toast('Aplikasi belum tersedia.');
  }
}
