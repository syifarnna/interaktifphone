document.addEventListener('DOMContentLoaded', () => {
  $('homeIndicator').addEventListener('click', goHome);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') goHome();
    if (CURRENT_SCREEN === 'pass') {
      if (e.key >= '0' && e.key <= '9') pressDigit(e.key);
      return;
    }
  });
  // keypad buttons use inline handlers
  $('torchBtn').addEventListener('click', toggleTorch);
  $('flashlight').addEventListener('click', toggleTorch);
  loadWeather();
  renderClock();
  setInterval(() => bumpClock(1), 60000);
  renderHome();
});
