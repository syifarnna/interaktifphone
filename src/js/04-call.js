const CALL_ABORT = { abort: 'call-aborted' };

function startCall(opts){
  opts = opts || {};
  if (CALL_BUSY) return Promise.resolve('busy');
  CALL_BUSY = true;
  ensureAudio();
  const contactId = opts.contactId || 'jo';
  const c = CONTACTS[contactId];
  const el = $('call');
  const kindLabel = opts.kind === 'voice' ? 'Panggilan suara' : 'Panggilan video';
  el.classList.remove('hidden');
  el.innerHTML = `
    <div class="call-bg"></div>
    <div class="call-shade"></div>
    <div class="call-inner">
      <div class="call-status" id="callStatus">${kindLabel} masuk</div>
      <div class="call-name">${esc(c.name)}</div>
      <div class="call-sub" id="callSub">seluler</div>
      <img class="call-photo" id="callPhoto" src="${c.img || IMG.jo}" alt="Foto ${esc(c.name)}">
      <div class="call-transcript" id="callTranscript"></div>
      <div class="call-choices" id="callChoices"></div>
      <div class="call-controls" id="callControls"></div>
    </div>`;

  return new Promise(resolve => {
    let answered = false;
    let finished = false;
    let seconds = 0;
    let timer = null;
    let autoMiss = null;
    let abortResolve = null;
    let pendingChoice = null;
    const abortPromise = new Promise(res => { abortResolve = res; });
    const state = { aborted: false };

    const sub = $('callSub');
    const transcript = $('callTranscript');
    const choicesEl = $('callChoices');
    const controls = $('callControls');

    function paintIncomingControls(){
      controls.innerHTML = `
        <button class="cbtn" onclick="declineCall()" aria-label="Tolak">
          <span class="cb red"><svg viewBox="0 0 24 24"><path d="M12 9.5c-3.2 0-6.1.9-8.6 2.5-.4.3-.6.7-.5 1.2l.5 2.1c.1.5.6.8 1.1.7l2.8-.6c.5-.1.8-.5.8-1v-1.6c1.2-.4 2.5-.6 3.9-.6s2.7.2 3.9.6v1.6c0 .5.3.9.8 1l2.8.6c.5.1 1-.2 1.1-.7l.5-2.1c.1-.5-.1-.9-.5-1.2A16 16 0 0 0 12 9.5Z" transform="rotate(135 12 12)"/></svg></span>
          <span>Tolak</span>
        </button>
        <button class="cbtn" onclick="answerCall()" aria-label="Jawab">
          <span class="cb green call-ring"><svg viewBox="0 0 24 24"><path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.24 1.02l-2.21 2.2Z"/></svg></span>
          <span>Jawab</span>
        </button>`;
    }

    function paintActiveControls(){
      controls.innerHTML = `
        <button class="cbtn" onclick="toggleMute(this)" aria-label="Bisukan">
          <span class="cb"><svg viewBox="0 0 24 24"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V22h2v-3.1A7 7 0 0 0 19 12h-2Z"/></svg></span>
          <span>Bisukan</span>
        </button>
        <button class="cbtn" onclick="hangupCall()" aria-label="Akhiri">
          <span class="cb red"><svg viewBox="0 0 24 24"><path d="M12 9.5c-3.2 0-6.1.9-8.6 2.5-.4.3-.6.7-.5 1.2l.5 2.1c.1.5.6.8 1.1.7l2.8-.6c.5-.1.8-.5.8-1v-1.6c1.2-.4 2.5-.6 3.9-.6s2.7.2 3.9.6v1.6c0 .5.3.9.8 1l2.8.6c.5.1 1-.2 1.1-.7l.5-2.1c.1-.5-.1-.9-.5-1.2A16 16 0 0 0 12 9.5Z" transform="rotate(135 12 12)"/></svg></span>
          <span>AKHIRI</span>
        </button>
        <button class="cbtn" onclick="toast('Simulasi panggilan')" aria-label="Speaker">
          <span class="cb"><svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4Zm12.5 3a4.5 4.5 0 0 1-2.5 4v-8a4.5 4.5 0 0 1 2.5 4Zm-2.5-8.8v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6Z"/></svg></span>
          <span>Speaker</span>
        </button>`;
    }

    function cleanup(result){
      if (finished) return;
      finished = true;
      state.aborted = true;
      if (abortResolve) abortResolve();
      if (pendingChoice) { try { pendingChoice(CALL_ABORT); } catch (e) {} }
      clearInterval(timer);
      clearTimeout(autoMiss);
      stopRingtone();
      el.style.opacity = '0';
      setTimeout(() => {
        el.classList.add('hidden');
        el.style.opacity = '';
        el.innerHTML = '';
        CALL_BUSY = false;
        resolve(result);
      }, 320);
    }

    function finishWith(result){
      if (finished) return;
      if (result === 'declined' || result === 'missed') {
        pushSystem(contactId, opts.missedLabel || (kindLabel + ' tak terjawab'));
        setTimeout(() => cleanup('declined'), 240);
      } else {
        cleanup('ended');
      }
    }

    window.declineCall = () => { if (!answered) finishWith('declined'); };
    window.answerCall = () => {
      if (answered || finished) return;
      answered = true;
      clearTimeout(autoMiss);
      stopRingtone();
      el.classList.add('chatting');
      $('callStatus').textContent = kindLabel;
      paintActiveControls();
      timer = setInterval(() => {
        seconds++;
        const s = $('callSub');
        if (s) s.textContent = String(Math.floor(seconds / 60)).padStart(2, '0') + '.' + String(seconds % 60).padStart(2, '0');
      }, 1000);
      runStory();
    };
    window.hangupCall = () => {
      if (!answered) { finishWith('declined'); return; }
      state.aborted = true;
      if (abortResolve) abortResolve();
      if (pendingChoice) { try { pendingChoice(CALL_ABORT); } catch (e) {} }
      cleanup('ended-by-user');
    };
    window.toggleMute = (btn) => {
      const cb = btn.querySelector('.cb');
      cb.classList.toggle('mute-off');
      const lbl = btn.querySelector('span:last-child');
      if (lbl) lbl.textContent = cb.classList.contains('mute-off') ? 'Bunyikan' : 'Bisukan';
    };

    const ctl = {
      say(who, text){
        return new Promise(async res => {
          if (state.aborted) return res();
          const line = document.createElement('div');
          line.className = 'c-line' + (who === 'me' ? ' me' : who === 'narr' ? ' narr' : '');
          const label = who === 'them' ? c.name : who === 'me' ? 'Kamu' : '';
          line.innerHTML = (label ? `<small>${esc(label)}</small>` : '') + esc(text);
          transcript.appendChild(line);
          transcript.scrollTop = transcript.scrollHeight;
          const dur = clamp(820 + text.length * 26, 1000, 3000);
          await Promise.race([sleep(dur), abortPromise]);
          res();
        });
      },
      choice(options){
        return new Promise(async (res, rej) => {
          if (state.aborted) return rej(CALL_ABORT);
          choicesEl.innerHTML = options.map((o, i) =>
            `<button class="c-choice" data-i="${i}">${esc(o.text)}</button>`).join('');
          const pick = (opt) => {
            choicesEl.innerHTML = '';
            pendingChoice = null;
            if (!state.aborted && opt.send !== false) {
              const line = document.createElement('div');
              line.className = 'c-line me';
              line.innerHTML = `<small>Kamu</small>${esc(opt.text)}`;
              transcript.appendChild(line);
              transcript.scrollTop = transcript.scrollHeight;
            }
            res(state.aborted ? CALL_ABORT : opt);
          };
          pendingChoice = (x) => rej(x);
          Array.from(choicesEl.children).forEach(btn => {
            btn.onclick = () => pick(options[Number(btn.dataset.i)]);
          });
        });
      },
      end(){
        if (finished) return Promise.resolve();
        $('callStatus').textContent = 'Panggilan berakhir';
        $('callChoices').innerHTML = '';
        return sleep(680).then(() => cleanup('ended'));
      },
      status(t){ $('callStatus').textContent = t; }
    };

    async function runStory(){
      try {
        await opts.run(ctl);
      } catch (e) {
        if (e !== CALL_ABORT) console.error(e);
      } finally {
        if (!finished) cleanup('ended');
      }
    }

    paintIncomingControls();
    startRingtone();
    vibrate([120, 80, 120]);
    autoMiss = setTimeout(() => { if (!answered) finishWith('missed'); }, 26000);
  });
}

function pushSystem(chatId, text){
  if (!S.chats[chatId]) S.chats[chatId] = [];
  pushMessage(chatId, { id: makeId(), from: 'sys', text, time: clockNow() }, { silentBanner: true });
}
