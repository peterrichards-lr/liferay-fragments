const initHeroVideo = () => {
  const enableDebug = configuration.enableDebug;

  const getVideoSource = (videoSelectorConfg, removeEmbed = true) => {
    const el = document.createElement('div'); // Using div instead of html
    el.innerHTML = videoSelectorConfg.html;
    const iframe = el.querySelector('iframe');
    if (enableDebug) console.debug('iframe', iframe);
    if (!iframe) return null;
    var src = iframe.getAttribute('src');
    if (enableDebug) console.debug('src', src);
    if (removeEmbed && src) {
      src = src.replace('&videoEmbed=true', '');
      if (enableDebug) console.debug('src', src);
    }
    return src;
  };

  const videoJson = configuration.video;
  if (!videoJson) return;

  const videoSelectorConfg = JSON.parse(videoJson);
  const videoSource = getVideoSource(videoSelectorConfg);
  const video = fragmentElement.querySelector('.myvid');

  if (videoSource && video) {
    const source = document.createElement('source');
    source.setAttribute('src', videoSource);
    source.setAttribute('type', 'video/mp4');
    video.appendChild(source);
    video.load();
  }

  const useCustomControlss =
    configuration.controls && configuration.useCustomControls;
  if (useCustomControlss && video) {
    const ppbutton = fragmentElement.querySelector('.vidbutton');
    if (ppbutton) {
      const playPause = () => {
        if (video.paused) {
          video.play();
          ppbutton.innerHTML =
            '<svg class="lexicon-icon lexicon-icon-sites" role="presentation" viewBox="0 0 512 512"><use xlink:href="/o/dialect-theme/images/clay/icons.svg#pause"></use></svg>';
          ppbutton.setAttribute('aria-pressed', false);
          ppbutton.setAttribute('aria-label', 'Pause');
        } else {
          video.pause();
          ppbutton.innerHTML =
            '<svg class="lexicon-icon lexicon-icon-sites" role="presentation" viewBox="0 0 512 512"><use xlink:href="/o/dialect-theme/images/clay/icons.svg#play"></use></svg>';
          ppbutton.setAttribute('aria-pressed', true);
          ppbutton.setAttribute('aria-label', 'Play');
        }
      };

      ppbutton.addEventListener('click', playPause);
      ppbutton.addEventListener('keydown', (event) => {
        if (event.key === ' ' || event.key === 'Enter') {
          event.preventDefault();
          playPause();
        }
      });
    }
  }
};

initHeroVideo();
