let WA_FILTER = 'semua';
let WA_QUERY = '';
let KB_OPEN = false;
let CHAT_DRAFT = '';
let CHAT_RUNNING = {};

function openWhatsApp(arg){
  if (arg && CONTACTS[arg]) { openWaList(); openChat(arg); return; }
  openWaList();
}

function lastMsg(chatId){
  const arr = S.chats[chatId] || [];
  return arr.length ? arr[arr.length - 1] : null;
}
function chatPreview(chatId){
  const m = lastMsg(chatId);
  if (!m) return '';
  if (m.image) return m.text ? 'Foto \u00B7 ' + m.text : 'Foto';
  return m.text || '';
}

function waListHTML(){
  const rows = CONTACT_ORDER.map(id => {
    const c = CONTACTS[id];
    const m = lastMsg(id);
    const unread = S.unread[id] || 0;
    if (WA_QUERY) {
      const hay = ((c.name || '') + ' ' + chatPreview(id)).toLowerCase();
      if (!hay.includes(WA_QUERY.toLowerCase())) return '';
    }
    if (WA_FILTER === 'unread' && !unread) return '';
    return `<button class="wa-row" onclick="openChat('${id}')">
      <span class="wa-avatar">${contactAvatarInner(id)}</span>
      <span class="wa-row-main">
        <span class="wa-row-name"><span>${esc(c.name)}</span><small>${esc(m ? m.time : '')}</small></span>
        <span class="wa-row-preview"><span>${m && m.from === 'me' ? '<span class="tick">\u2713\u2713</span>' : ''} ${esc(chatPreview(id))}</span>${unread ? `<span class="wa-badge">${unread}</span>` : ''}</span>
      </span>
    </button>`;
  }).join('');
  return rows || `<div class="wa-empty">Tidak ada chat.</div>`;
}

function openWaList(){
  ACTIVE_CHAT = null;
  closeKeyboard();
  mountApp('light', 'wa-page', `
    <div class="wa">
      <div class="wa-top">
        <div class="wa-titlebar">
          <h1>WhatsApp</h1>
          <span class="wa-tools">
            <svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="13" rx="3"/><circle cx="12" cy="12.5" r="3.4"/><path d="M9 6l1.2-2h3.6L15 6"/></svg>
            <svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M8 8h8v8"/></svg>
            <svg viewBox="0 0 24 24"><circle cx="12" cy="5.5" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="18.5" r="1.4" fill="currentColor" stroke="none"/></svg>
          </span>
        </div>
        <label class="wa-search">
          <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          <input id="waSearchInput" placeholder="Cari" autocomplete="off" value="${esc(WA_QUERY)}" oninput="waSetQuery(this.value)">
        </label>
        <div class="wa-filters">
          <button class="wa-filter ${WA_FILTER === 'semua' ? 'active' : ''}" onclick="waSetFilter('semua')">Semua</button>
          <button class="wa-filter ${WA_FILTER === 'unread' ? 'active' : ''}" onclick="waSetFilter('unread')">Belum dibaca</button>
        </div>
      </div>
      <div class="wa-list" id="waList">${waListHTML()}</div>
    </div>`);
}

function waSetFilter(f){ WA_FILTER = f; openWaList(); }
function waSetQuery(q){
  WA_QUERY = q;
  const l = $('waList');
  if (l) l.innerHTML = waListHTML();
}

function openChat(id){
  if (!CONTACTS[id]) return;
  ACTIVE_CHAT = id;
  S.unread[id] = 0;
  CHAT_DRAFT = '';
  KB_OPEN = false;
  saveState();
  renderChat(id);
  onChatOpened(id);
}

function isChatOpen(id){
  return CURRENT_SCREEN === 'appPage' && ACTIVE_CHAT === id && !!$('waConversation');
}

function renderChat(id){
  const c = CONTACTS[id];
  const messages = S.chats[id] || [];
  closeCameraStreamOnly();
  mountApp('light', 'wa-page', `
    <div class="wa">
      <div class="wa-chat" id="waChat">
        <div class="wa-chat-bg"></div>
        <div class="wa-chathead">
          <button class="wa-back" onclick="openWaList()" aria-label="Kembali ke daftar chat">
            <svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>
          </button>
          <span class="wa-avatar">${contactAvatarInner(id)}</span>
          <span class="wa-chat-title">
            <span class="wa-chatname">${esc(c.name)}</span>
            <span class="wa-chatstatus">${id === 'jo' && S.chapter >= 2 ? 'terakhir dilihat baru saja' : c.sub}</span>
          </span>
          <span class="wa-head-actions">
            <button onclick="waCallNotice('${id}')" aria-label="Panggilan video"><svg viewBox="0 0 24 24"><rect x="2.5" y="5.5" width="13.5" height="13" rx="2.2"/><path d="m16 10 5-3v10l-5-3"/></svg></button>
            <button onclick="waCallNotice('${id}')" aria-label="Panggilan telepon"><svg viewBox="0 0 24 24"><path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.2c1.1.4 2.3.6 3.6.6a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.6 21 3 13.4 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.3.2 2.5.6 3.6a1 1 0 0 1-.2 1l-2.3 2.2Z"/></svg></button>
          </span>
        </div>
        <div class="wa-convo" id="waConversation">
          <div class="wa-day">Hari ini</div>
          ${messages.map(m => bubbleHTML(m)).join('')}
        </div>
        <div class="wa-composer-wrap">
          <div class="wa-choices" id="waChoices"></div>
          <div class="wa-chat-note">Balas lewat pilihan yang tersedia saat cerita memintanya.</div>
        </div>
      </div>
    </div>`);
  // restore pending choices
  renderChoices(id);
  scrollConvo();
  const inp = $('chatInput');
  if (inp && KB_OPEN) { /* keyboard stays visually open */ }
}

function bubbleHTML(m){
  if (m.from === 'sys') return `<div class="wa-system">${esc(m.text)}</div>`;
  const mine = m.from === 'me';
  const img = m.image ? `<img class="wa-img" src="${m.image}" alt="Foto">` : '';
  return `<div class="wa-bubble${mine ? ' mine' : ''}${m.image ? ' has-img' : ''}">${img}${m.text ? esc(m.text) : ''}<span class="btime">${esc(m.time || '')}${mine ? ' <span class="tick">\u2713\u2713</span>' : ''}</span></div>`;
}

function kbKey(k){
  return `<button class="wa-kb-key" data-key="${k}" onclick="kbType('${k}')">${k}</button>`;
}
function kbType(k){
  ensureAudio();
  const field = $('chatInput');
  if (!field) return;
  field.value = (field.value || '') + k;
  CHAT_DRAFT = field.value;
  const btn = document.querySelector('.wa-kb-key[data-key="' + k + '"]');
  if (btn) { btn.classList.add('pressed'); setTimeout(() => btn.classList.remove('pressed'), 130); }
}
function kbBackspace(){
  const field = $('chatInput');
  if (!field) return;
  field.value = field.value.slice(0, -1);
  CHAT_DRAFT = field.value;
}
function kbShift(){
  toast('Huruf besar otomatis di awal kalimat.');
}
function openKeyboard(){
  ensureAudio();
  KB_OPEN = true;
  const chat = $('waChat');
  if (chat) chat.classList.add('kb-open');
  setTimeout(scrollConvo, 300);
}
function closeKeyboard(){
  KB_OPEN = false;
  const chat = $('waChat');
  if (chat) chat.classList.remove('kb-open');
}
function scrollConvo(){
  const c = $('waConversation');
  if (c) c.scrollTop = c.scrollHeight + 400;
}
function showTyping(){
  const c = $('waConversation');
  if (!c || $('waTyping')) return;
  const el = document.createElement('div');
  el.className = 'wa-typing';
  el.id = 'waTyping';
  el.innerHTML = '<i></i><i></i><i></i>';
  c.appendChild(el);
  scrollConvo();
}
function hideTyping(){
  const el = $('waTyping');
  if (el) el.remove();
}

function pushMessage(chatId, m, opts){
  opts = opts || {};
  if (!S.chats[chatId]) S.chats[chatId] = [];
  S.chats[chatId].push(m);
  if (m.from === 'them' && !isChatOpen(chatId)) {
    S.unread[chatId] = (S.unread[chatId] || 0) + 1;
    if (!opts.silentBanner) bannerMsg(chatId, m.text || 'Mengirim foto', m.time);
  }
  saveState();
  if (isChatOpen(chatId)) {
    if (opts.fullRender) { renderChat(chatId); return; }
    const c = $('waConversation');
    if (c) { c.insertAdjacentHTML('beforeend', bubbleHTML(m)); scrollConvo(); }
  }
}

function addMy(chatId, text, extra){
  const m = msg('me', text, clockNow(), extra || {});
  pushMessage(chatId, m, { silentBanner: true });
  sfxSend();
  bumpClock(1);
  return m;
}

function incoming(chatId, text, opts){
  return (async () => {
    opts = opts || {};
    await waitOpen(chatId);
    const dur = opts.typing != null ? opts.typing : clamp(520 + text.length * 20, 700, 2000);
    showTyping();
    await sleep(dur);
    hideTyping();
    const m = msg('them', text, opts.time || clockNow(), opts.extra || {});
    pushMessage(chatId, m, { fullRender: false });
    bumpClock(1);
    await sleep(opts.after != null ? opts.after : 260);
    return m;
  })();
}

function waitOpen(chatId){
  return new Promise(resolve => {
    const tick = () => {
      if (isChatOpen(chatId)) return resolve();
      setTimeout(tick, 280);
    };
    tick();
  });
}

function askChat(chatId, options){
  return new Promise(resolve => {
    PENDING_CHOICES[chatId] = { options, resolve };
    renderChoices(chatId);
  });
}
function renderChoices(chatId){
  if (ACTIVE_CHAT !== chatId) return;
  const wrap = $('waChoices');
  if (!wrap) return;
  const p = PENDING_CHOICES[chatId];
  if (!p) { wrap.innerHTML = ''; return; }
  wrap.innerHTML = p.options.map((o, i) =>
    `<button class="wa-choice" onclick="chooseReply('${chatId}',${i})">${esc(o.text)}</button>`).join('');
  setTimeout(scrollConvo, 80);
}
function chooseReply(chatId, idx){
  const p = PENDING_CHOICES[chatId];
  if (!p) return;
  const opt = p.options[idx];
  if (!opt) return;
  delete PENDING_CHOICES[chatId];
  renderChoices(chatId);
  if (opt.send !== false) addMy(chatId, opt.text);
  const inp = $('chatInput');
  if (inp) inp.value = '';
  CHAT_DRAFT = '';
  p.resolve(opt);
  scrollConvo();
}

function sendChat(){
  // Free typing disabled: replies only via template choices.
  return;
}

function waAttachNotice(){ toast('Lampiran tidak tersedia dalam simulasi.'); }
function waCallNotice(id){
  if (id === 'jo' && !S.ended) {
    toast('Jo akan menelepon di bagian cerita berikutnya.');
  } else {
    toast('Simulasi panggilan. Tidak ada sambungan sungguhan.');
  }
}

let TYPING_HINT = null;
function onChatOpened(id){
  S.unread[id] = 0;
  saveState();
  if (id === 'jo') {
    if (S.chapter === 0 && !S.flags.call1Done) sceneNight();
    else if (S.chapter === 1 && S.flags.revealDone && !S.flags.dindaTalk && !S.flags.call2Done) maybeEveningCall();
    else if (S.chapter === 3 && S.flags.arrivalSeen && !S.flags.rainDone) sceneRainGate();
  }
  if (id === 'dinda') {
    if (S.chapter === 1 && S.flags.revealDone && !S.flags.dindaTalk) sceneDinda();
    if (S.chapter === 3 && !S.flags.arrivalSeen) sceneArrivalChat();
  }
  if (id === 'bayu' && S.chapter === 3) {
    // messages already visible; nothing to trigger
  }
}

function closeCameraStreamOnly(){ /* camera handled in apps */ }
