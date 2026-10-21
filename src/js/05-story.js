function storyCard(opts){
  return new Promise(resolve => {
    const el = $('storycard');
    el.classList.remove('hidden');
    el.innerHTML = `
      <div class="sc-card">
        <div class="sc-kicker">${esc(opts.kicker || '')}</div>
        <h2>${esc(opts.title || '')}</h2>
        <p>${esc(opts.text || '')}</p>
        <button class="sc-btn" id="scMain">${esc(opts.btn || 'Lanjut')}</button>
        ${opts.ghost ? `<button class="sc-btn ghost" id="scGhost">${esc(opts.ghost)}</button>` : ''}
      </div>`;
    const done = (v) => {
      el.classList.add('hidden');
      el.innerHTML = '';
      resolve(v);
    };
    $('scMain').onclick = () => done('main');
    if (opts.ghost) $('scGhost').onclick = () => done('ghost');
  });
}

function deliver(chatId, text, delay, extra){
  setTimeout(() => {
    const m = msg('them', text, clockNow(), extra || {});
    pushMessage(chatId, m);
    bumpClock(1);
  }, delay || 0);
}

/* ---------------- ACT 1: malam ulang tahun ---------------- */

async function runCall1(c){
  await c.say('them', 'Halo? Akhirnya.');
  await c.say('me', 'Aku tunggu dari jam 9 tau.');
  await c.say('them', 'Iya iya, sorry. Tadi rapatnya molor. Gimana hari ini?');
  const a = await c.choice([
    { text: 'Biasa aja. Kamu gimana, capek?', value: 'biasa' },
    { text: 'Aku nunggu lama, Jo.', value: 'nunggu' }
  ]);
  if (a.value === 'biasa') {
    await c.say('them', 'Lumayan. Tapi gapapa.');
    await c.say('them', 'Kamu udah makan?');
    await c.say('me', 'Udah.');
  } else {
    await c.say('them', 'Maaf banget. Beneran baru kelar.');
    await c.say('me', 'Iya.');
    await c.say('them', 'Besok aku usahain pulang lebih cepat deh.');
  }
  await c.say('them', 'Eh, aku ngantuk nih. Besok pagi harus berangkat awal.');
  const b = await c.choice([
    { text: 'Jo... hari ini tanggal berapa?', value: 'tanya' },
    { text: 'Kamu lupa sesuatu ya?', value: 'pancing' },
    { text: '...', value: 'diem', send: false }
  ]);
  if (b.value === 'tanya') {
    await c.say('them', 'Tanggal? 14... kenapa?');
    await c.say('me', 'Gak. Lupa aja tanya.');
  } else if (b.value === 'pancing') {
    await c.say('them', 'Lupa apa? ... Tanggal 14 kan? Kenapa?');
    await c.say('me', 'Gak apa-apa.');
  } else {
    await sleep(1000);
    await c.say('them', 'Shein?');
    await c.say('me', 'Nanti aja. Aku cuma... udah.');
  }
  await c.say('them', 'Oke. Love you.');
  const d = await c.choice([
    { text: '...Iya. Love you juga.', value: 'iya' },
    { text: 'Jo, tunggu.', value: 'tunggu' }
  ]);
  if (d.value === 'tunggu') {
    await c.say('them', 'Kenapa?');
    await c.say('me', 'Nanti aja. Tidur.');
    await c.say('them', 'Oke. Love you. Mimpi indah ya.');
  }
  await c.end();
}

async function sceneNight(){
  if (S.flags.call1Done || CHAT_RUNNING.night) return;
  CHAT_RUNNING.night = true;
  await sleep(1000);
  if (!isChatOpen('jo')) { CHAT_RUNNING.night = false; return; }
  const res = await startCall({
    contactId: 'jo',
    kind: 'video',
    incoming: true,
    run: runCall1,
    missedLabel: 'Panggilan video tak terjawab'
  });
  S.flags.call1Done = true;
  saveState();
  CHAT_RUNNING.night = false;
  if (res === 'declined') {
    await sleep(500);
    pushMessage('jo', msg('them', 'shein? please angkat', clockNow()));
    bumpClock(1);
    await sleep(1200);
    pushMessage('jo', msg('them', 'aku tunggu ya. besok aku telpon lagi', clockNow()));
    bumpClock(1);
  }
  await sleep(500);
  await storyCard({
    kicker: '14 MEI, 22.47',
    title: 'Ulang tahunmu.',
    text: res === 'declined'
      ? 'Kamu tidak mengangkat. Tapi kamu tetap menunggu, sampai layar meredup.'
      : 'Dia mengucapkan selamat malam. Bukan selamat ulang tahun.',
    btn: 'Lanjut'
  });
  await advanceMorning();
}

async function advanceMorning(){
  S.flags.call1Done = true;
  setChapter(1);
  if (!S.flags.morningMsgs) {
    S.flags.morningMsgs = true;
    S.chats.jo.push(msg('them', 'pagi', '07.38'));
    S.chats.jo.push(msg('them', 'kamu inget gak hari ini tanggal berapa?', '07.40'));
    S.unread.jo = (S.unread.jo || 0) + 2;
  }
  saveNow();
  closeKeyboard();
  ACTIVE_CHAT = null;
  await timeSkip('Jumat, 15 Mei', 'Pagi setelahnya', 'Ada pesan yang belum kamu baca.');
  showScreen('lock');
}

/* ---------------- ACT 1b: pagi, dia sadar ---------------- */

async function sceneMorning(){
  if (S.chapter !== 1 || S.flags.revealDone || CHAT_RUNNING.morning) return;
  CHAT_RUNNING.morning = true;
  await sleep(700);
  if (!isChatOpen('jo')) { CHAT_RUNNING.morning = false; return; }

  const a = await askChat('jo', [
    { text: '15 Mei. kenapa?', value: 'tanggal' },
    { text: 'kamu lupa ya?', value: 'lupa' },
    { text: 'kenapa emangnya?', value: 'kenapa' }
  ]);
  if (a.value === 'tanggal') {
    await incoming('jo', '15 mei...');
    await incoming('jo', 'eh.');
  } else if (a.value === 'lupa') {
    await incoming('jo', 'lupa apa?');
    await sleep(700);
    await incoming('jo', 'tunggu.');
  } else {
    await incoming('jo', 'enggak, cuma nanya');
    await incoming('jo', 'tunggu deh.');
  }
  await sleep(600);
  await incoming('jo', 'Shein... maaf. aku lupa. beneran lupa. maaf ya.');

  const b = await askChat('jo', [
    { text: 'gapapa. aku udah biasa.', value: 'biasa' },
    { text: 'kamu lupa ulang tahunku, Jo.', value: 'lupa' },
    { text: '...', value: 'diem', send: false }
  ]);
  if (b.value === 'biasa') {
    await incoming('jo', 'jangan gitu. aku minta maaf.');
    await incoming('jo', 'aku sadar. aku salah.');
  } else if (b.value === 'lupa') {
    await incoming('jo', 'aku tau. aku salah. beneran minta maaf.');
  } else {
    await sleep(800);
    await incoming('jo', 'shein?');
    await incoming('jo', 'please jangan diem.');
  }
  await incoming('jo', 'aku telepon ya. please.');
  await sleep(900);

  const res = await startCall({
    contactId: 'jo',
    kind: 'voice',
    incoming: true,
    run: runCall2,
    missedLabel: 'Panggilan suara tak terjawab'
  });
  S.flags.revealDone = true;
  if (res === 'declined') {
    await sleep(500);
    pushMessage('jo', msg('them', 'aku telepon lagi nanti ya. aku beneran minta maaf', clockNow()));
    bumpClock(1);
  }
  S.flags.morningCallDone = true;
  saveState();
  CHAT_RUNNING.morning = false;

  deliver('dinda', 'shein, aku udah di depan. buka dong', 1200);
  S.chats.dinda.push(msg('them', 'shein, aku udah di depan. buka dong', clockNow()));
  bumpClock(1);
  S.unread.dinda = (S.unread.dinda || 0) + 1;
  saveState();
  setTimeout(() => { bannerMsg('dinda', 'shein, aku udah di depan. buka dong', 'sekarang'); }, 2600);
}

async function runCall2(c){
  await c.say('them', 'Shein, aku beneran minta maaf. Aku gak sengaja lupa. Aku janji gak bakal lagi.');
  await c.choice([
    { text: 'Masalahnya bukan lupa, Jo.', value: 'bukan' },
    { text: 'Kamu gak pernah prioritasin aku.', value: 'prioritas' },
    { text: 'Aku capek nunggu kamu terus.', value: 'capek' }
  ]);
  await c.say('them', 'Itu gak benar. Aku sayang kamu.');
  await c.choice([
    { text: 'Sayang tapi lupa ulang tahunku?', value: 'ultah' },
    { text: 'Kamu cuma inget kalau aku ngingetin.', value: 'inget' },
    { text: 'Aku butuh lebih dari "love you" tiap malam.', value: 'lebih' }
  ]);
  await c.say('them', 'Apa yang kamu mau? Bilang.');
  await c.choice([
    { text: 'Aku gak tau. Mungkin aku yang terlalu banyak minta.', value: 'gaktau' },
    { text: 'Aku pengen kamu usaha, bukan cuma janji.', value: 'usaha' }
  ]);
  await c.say('them', 'Shein, jangan gitu.');
  await c.say('me', 'Aku capek, Jo. Aku capek jadi yang selalu ngalah.');
  await c.say('me', 'Udah. Istirahat aja.');
  await c.end();
}

/* ---------------- ACT 1c: Dinda ---------------- */

async function sceneDinda(){
  if (S.chapter !== 1 || !S.flags.revealDone || S.flags.dindaTalk) return;
  if (SCENE_BUSY) return;
  SCENE_BUSY = true;
  try {
    await sleep(900);
    if (!isChatOpen('dinda')) return;
    await incoming('dinda', 'shein? aku udah di depan. buka dong');
    const a = await askChat('dinda', [
      { text: 'masuk aja, pintu gak dikunci', value: 'masuk' },
      { text: 'aku lagi males ketemu orang', value: 'males' }
    ]);
    if (a.value === 'males') await incoming('dinda', 'aku tetep masuk ya. bawa kue nih');
    else await incoming('dinda', 'oke, aku masuk ya. bawa kue nih');
    await sleep(500);
    await incoming('dinda', 'dia beneran lupa?');
    const b = await askChat('dinda', [
      { text: 'beneran. katanya rapat.', value: 'rapat' },
      { text: 'aku gak mau bahas dia.', value: 'gakmau' }
    ]);
    if (b.value === 'rapat') await incoming('dinda', 'rapat bisa diinget, ulang tahun kamu enggak?');
    else await incoming('dinda', 'oke. tapi jangan dipendem sendirian.');
    await incoming('dinda', 'kamu udah bilang belum ke dia?');
    const c = await askChat('dinda', [
      { text: 'belum. aku lagi kesel.', value: 'belum' },
      { text: 'udah. aku bilang aku capek.', value: 'udah' }
    ]);
    if (c.value === 'belum') {
      await incoming('dinda', 'jangan diam-diam. nanti makin parah.');
      await incoming('dinda', 'kamu gak harus nahan semuanya sendirian.');
    } else {
      await incoming('dinda', 'bagus. walaupun dia tetep salah.');
      await incoming('dinda', 'tapi kamu juga harus dengerin dia nanti.');
    }
    await incoming('dinda', 'aku ngerti kamu capek. 8 bulan LDR bukan waktu yang sebentar.');
    await incoming('dinda', 'kue-nya aku taruh meja ya. jangan lupa makan.');
    const d = await askChat('dinda', [
      { text: 'makasih, Din. aku butuh itu.', value: 'makasih' },
      { text: 'nanti aja. aku mau sendiri dulu.', value: 'sendiri' }
    ]);
    if (d.value === 'makasih') await incoming('dinda', 'selalu. aku di sini.');
    else await incoming('dinda', 'oke. aku di kamar sebelah kalau kamu butuh.');
    S.flags.dindaTalk = true;
    saveState();
    toast('Malam semakin larut.');
    scheduleEveningCall();
  } finally {
    SCENE_BUSY = false;
  }
}

function scheduleEveningCall(){
  if (S.flags.eveningScheduled || S.flags.argueDone) return;
  S.flags.eveningScheduled = true;
  saveState();
  setTimeout(maybeEveningCall, 9000);
}

async function maybeEveningCall(){
  if (S.chapter !== 1 || S.flags.argueDone || CALL_BUSY || S.flags.eveningStarted) return;
  S.flags.eveningStarted = true;
  setChapter(2);
  saveState();
  if (CURRENT_SCREEN === 'pass') { hidePass(); }
  const res = await startCall({
    contactId: 'jo',
    kind: 'video',
    incoming: true,
    run: runCall3,
    missedLabel: 'Panggilan video tak terjawab'
  });
  S.flags.argueDone = true;
  saveState();
  if (res === 'declined') {
    deliver('jo', 'shein, please. jangan gini', 600);
    deliver('jo', 'aku salah. aku tau', 2400);
  }
  deliver('jo', 'shein', 1200);
  deliver('jo', 'jangan matiin teleponku kayak gitu', 3200);
  deliver('jo', 'aku minta maaf. beneran.', 5200);
  deliver('jo', 'aku sayang kamu.', 7200);
  S.unread.jo = (S.unread.jo || 0) + 5;
  saveState();
  await sleep(2200);
  await storyCard({
    kicker: '15 MEI, 23.58',
    title: 'Kamu belum membalas.',
    text: 'Pesan-pesan itu masih tergeletak di layar. Kamu mematikan lampu kamar, tapi matamu belum bisa tidur.',
    btn: 'Lanjut'
  });
  await advanceDay3();
}

async function runCall3(c){
  await c.say('them', 'Shein... aku beneran minta maaf. Aku gak sengaja lupa. Aku janji gak bakal lagi.');
  await c.choice([
    { text: 'Masalahnya bukan lupa, Jo.', value: 'bukan' },
    { text: 'Kamu gak pernah prioritasin aku.', value: 'prioritas' }
  ]);
  await c.say('them', 'Itu gak benar. Aku sayang kamu.');
  await c.choice([
    { text: 'Sayang tapi lupa ulang tahunku?', value: 'ultah' },
    { text: 'Kamu cuma inget kalau aku ngingetin.', value: 'inget' }
  ]);
  await c.say('them', 'Apa yang kamu mau? Bilang.');
  await c.choice([
    { text: 'Aku gak tau. Mungkin aku yang terlalu banyak minta.', value: 'gaktau' },
    { text: 'Aku pengen kamu usaha, bukan cuma janji.', value: 'usaha' }
  ]);
  await c.say('them', 'Shein, jangan gitu.');
  await c.say('me', 'Aku capek, Jo. Aku capek jadi yang selalu ngalah.');
  await c.say('me', 'Udah. Istirahat aja.');
  await c.end();
}

/* ---------------- ACT 2: dia datang ---------------- */

async function advanceDay3(){
  S.flags.argueDone = true;
  setChapter(3);
  if (!S.flags.ch3msgs) {
    S.flags.ch3msgs = true;
    S.chats.dinda.push(msg('them', 'shein... ada yang nunggu di bawah. jangan kaget.', '15.12'));
    S.chats.bayu.push(msg('them', 'Shein, Jo ambil cuti dan ke Jogja. Tolong dengerin dia dulu ya.', '14.58'));
    S.unread.dinda = (S.unread.dinda || 0) + 1;
    S.unread.bayu = (S.unread.bayu || 0) + 1;
  }
  saveNow();
  closeKeyboard();
  ACTIVE_CHAT = null;
  await timeSkip('Sabtu, 16 Mei', 'Seseorang di bawah', 'Hujan turun sejak sore.');
  showScreen('lock');
}

async function sceneArrivalChat(){
  if (S.chapter !== 3 || S.flags.arrivalSeen) return;
  if (SCENE_BUSY) return;
  SCENE_BUSY = true;
  try {
    await sleep(700);
    if (!isChatOpen('dinda')) return;
    await incoming('dinda', 'shein, aku serius. ada cowok bawa bunga di depan kos.');
    await sleep(500);
    const m = msg('them', 'itu jo kan?', clockNow(), { image: IMG.g4 });
    pushMessage('dinda', m);
    bumpClock(1);
    await sleep(600);
    const a = await askChat('dinda', [
      { text: 'aku turun.', value: 'turun' },
      { text: 'bilang aku gak ada.', value: 'diam' }
    ]);
    if (a.value === 'diam') {
      await incoming('dinda', 'dia gak percaya. dia masih di bawah, kehujanan.');
      await incoming('dinda', 'shein, please. dia kedinginan.');
      await askChat('dinda', [
        { text: 'oke. aku turun.', value: 'turun' },
        { text: '...', value: 'diem', send: false }
      ]);
      await incoming('dinda', 'aku bukain pintu ya. maaf.');
    } else {
      await incoming('dinda', 'bawa payung. hujan deras banget.');
    }
    S.flags.arrivalSeen = true;
    saveState();
  } finally {
    SCENE_BUSY = false;
  }
  await sleep(700);
  await storyCard({
    kicker: '16 MEI, 16.42',
    title: 'Kamu membuka pintu.',
    text: 'Hujan, bunga, dan seseorang yang kamu kenal terlalu baik.',
    btn: 'Keluar'
  });
  await sceneRain();
}

function sceneEngine(kind, opts){
  const el = kind === 'scene' ? $('scene') : $('call');
  SCENE_BUSY = true;
  el.classList.remove('hidden');
  el.innerHTML = `
    <div class="scene-bg"></div>
    <div class="scene-rain"></div>
    <div class="scene-rain b"></div>
    <div class="scene-inner">
      <div class="scene-kicker">${esc(opts.kicker)}</div>
      <div class="scene-title">${esc(opts.title)}</div>
      <div class="scene-sub">${esc(opts.sub || '')}</div>
      <div class="scene-lines" id="sceneLines"></div>
      <div class="scene-choices" id="sceneChoices"></div>
      <div class="scene-tap">ketuk untuk lanjut</div>
    </div>`;
  const lines = $('sceneLines');
  const choicesEl = $('sceneChoices');
  return new Promise(resolve => {
    const finish = () => {
      el.style.opacity = '0';
      setTimeout(() => {
        el.classList.add('hidden');
        el.style.opacity = '';
        el.innerHTML = '';
        SCENE_BUSY = false;
        resolve();
      }, 600);
    };
    const ctl = {
      say(who, text, ms){
        return new Promise(async res => {
          const line = document.createElement('div');
          line.className = 's-line' + (who === 'me' ? ' me' : who === 'narr' ? ' narr' : '');
          const label = who === 'them' ? 'Jo' : who === 'me' ? 'Kamu' : '';
          line.innerHTML = (label ? `<small>${esc(label)}</small>` : '') + esc(text);
          lines.appendChild(line);
          lines.scrollTop = lines.scrollHeight;
          await sleep(ms != null ? ms : clamp(900 + text.length * 30, 1200, 3600));
          res();
        });
      },
      choice(options){
        return new Promise(res => {
          choicesEl.innerHTML = options.map((o, i) =>
            `<button class="s-choice" data-i="${i}">${esc(o.text)}</button>`).join('');
          Array.from(choicesEl.children).forEach(btn => {
            btn.onclick = () => {
              const opt = options[Number(btn.dataset.i)];
              choicesEl.innerHTML = '';
              if (opt.send !== false) {
                const line = document.createElement('div');
                line.className = 's-line me';
                line.innerHTML = `<small>Kamu</small>${esc(opt.text)}`;
                lines.appendChild(line);
                lines.scrollTop = lines.scrollHeight;
              }
              res(opt);
            };
          });
        });
      },
      close: finish
    };
    (async () => {
      try { await opts.run(ctl); } catch (e) { console.error(e); }
      finish();
    })();
  });
}

async function sceneRain(){
  if (S.flags.rainDone) return;
  S.flags.rainDone = true;
  saveState();
  let ending = 'A';
  await sceneEngine('scene', {
    kicker: '16 MEI, 16.44',
    title: 'Di depan pintu',
    sub: 'Jogja, hujan',
    run: async (c) => {
      await c.say('narr', 'Hujan turun deras. Dia berdiri di depan pintu, basah kuyup, bunga di tangan.');
      await c.say('them', 'Hai.');
      await c.say('me', 'Jo? Kamu dari mana?');
      await c.say('them', 'Dari Jakarta. Terbang pagi.');
      await c.say('me', 'Kamu gila. Kamu kerja.');
      await c.say('them', 'Aku ambil cuti. Aku gak tahan, Shein.');
      await c.say('them', 'Happy belated birthday. Aku minta maaf. Beneran.');
      await c.say('narr', 'Air matamu jatuh sebelum sempat kamu tahan.');
      await c.say('them', 'Aku gak cuma minta maaf. Aku mau kamu tau, kamu penting buat aku. Lebih penting dari kerja, dari rapat, dari apapun.');
      await c.say('them', 'Aku salah lupa ulang tahun kamu. Aku salah gak dengerin kamu. Tapi aku gak mau kehilangan kamu.');
      const ans = await c.choice([
        { text: 'Aku maafin kamu, Jo.', value: 'A' },
        { text: 'Aku butuh waktu, Jo.', value: 'B' }
      ]);
      ending = ans.value;
      if (ending === 'A') {
        await c.say('me', 'Aku gak mau putus. Aku cuma capek ngerasa sendirian.');
        await c.say('them', 'Kamu gak sendirian. Aku ada. Walau jauh, aku ada.');
        await c.say('narr', 'Kamu memeluknya di tengah hujan. Untuk pertama kalinya setelah sekian lama, kamu merasa ditemukan.');
      } else {
        await c.say('me', 'Aku belum bisa maafin kamu sekarang. Tapi jangan pulang dulu.');
        await c.say('them', 'Aku nunggu. Selama kamu butuh.');
        await c.say('narr', 'Kamu duduk bersamanya di teras, mendengar hujan perlahan berhenti. Belum selesai, tapi setidaknya dia di sini.');
      }
      await sleep(700);
    }
  });
  showEnding(ending);
}

/* ---------------- ENDING ---------------- */

function showEnding(kind){
  S.ended = kind;
  saveNow();
  const isA = kind === 'A';
  const el = $('ending');
  el.classList.remove('hidden');
  el.innerHTML = `
    <div class="end-kicker">Tamat</div>
    <h2>${isA ? 'Pelukan di Tengah Hujan' : 'Waktu yang Kamu Minta'}</h2>
    <div class="end-tag">Ending ${isA ? '1 dari 2' : '2 dari 2'}</div>
    <p>${isA
      ? 'Kamu memilih memaafkan. Bukan karena semuanya langsung baik-baik saja, tapi karena dia akhirnya datang. Bukan cuma dengan kata-kata, tapi dengan 500 kilometer dan tubuh yang basah kuyup.'
      : 'Kamu memilih memberi waktu. Bukan karena berhenti sayang, tapi karena kamu butuh memastikan dia benar-benar berubah. Dia tinggal. Menunggu. Dan itu sudah cukup untuk malam ini.'}</p>
    <p class="end-quote">"LDR itu bukan soal jarak. Tapi soal usaha."</p>
    <div class="end-actions">
      <button class="end-btn" onclick="openEpilogue()">Baca epilog</button>
      <button class="end-btn ghost" onclick="resetStory()">Main lagi dari awal</button>
    </div>
    <div class="end-credit">Dari Jakarta ke Jogja &middot; cerita interaktif</div>`;
  sfxNotif();
}

function openEpilogue(){
  const kind = S.ended || 'A';
  $('ending').classList.add('hidden');
  $('ending').innerHTML = '';
  setChapter(4);
  showScreen('home');
  renderHome();
  if (!S.flags.epilogueMsgs) {
    S.flags.epilogueMsgs = true;
    S.chats.jo.push(msg('them', kind === 'A' ? 'pagi. kopi di dapur, aku bikin dua.' : 'pagi. aku masih di teras. gak buru-buru.', '08.10'));
    S.unread.jo = (S.unread.jo || 0) + 1;
    saveState();
  }
  setTimeout(() => {
    openApp('whatsapp');
    setTimeout(() => { openChat('jo'); epilogueChat(); }, 150);
  }, 350);
}

async function epilogueChat(){
  if (S.flags.epilogueDone) return;
  S.flags.epilogueDone = true;
  saveState();
  await sleep(900);
  const a = await askChat('jo', [
    { text: 'Aku turun sebentar lagi.', value: 'turun' },
    { text: 'Pelan-pelan. aku masih ngantuk.', value: 'ngantuk' }
  ]);
  if (a.value === 'turun') {
    await incoming('jo', 'oke. pelan-pelan. hujan udah berhenti.');
    await incoming('jo', 'eh, bunganya masih di meja. kamu mau bawa ke Malioboro?');
  } else {
    await incoming('jo', 'oke, bos. aku tunggu di dapur.');
    await incoming('jo', 'teh hangat juga udah aku siapin.');
  }
  const b = await askChat('jo', [
    { text: 'Jo, makasih udah datang.', value: 'makasih' },
    { text: 'Kamu gak boleh lupa lagi ya.', value: 'ingat' }
  ]);
  if (b.value === 'makasih') {
    await incoming('jo', 'makasih juga udah maafin aku.');
    await incoming('jo', 'aku catat tanggalnya di kalender. beneran.');
  } else {
    await incoming('jo', 'aku catat. ulang tahun, anniversary, semuanya.');
    await incoming('jo', 'kalau lupa lagi, aku terbang lagi ke Jogja.');
  }
  await incoming('jo', 'sampai kapan pun, kamu penting buat aku.');
  pushSystem('jo', 'Percakapan ini diakhiri. Terima kasih sudah membaca.');
  toast('Cerita selesai. Kamu bisa mulai lagi kapan saja.', 3400);
}
