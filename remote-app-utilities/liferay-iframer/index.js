const initIframer = () => {
  if (layoutMode === 'view') {
    const iframe = fragmentElement.querySelector('iframe');
    if (iframe && configuration.url) {
      iframe.src = configuration.url;
    }
  }
};

initIframer();
