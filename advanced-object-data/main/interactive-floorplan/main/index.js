function initInteractiveFloorplan() {
  const fragmentNode = fragmentElement;
  const container = fragmentNode.querySelector('.floorplan-container');
  const bgImg = fragmentNode.querySelector('.floorplan-bg');
  const pinsLayer = fragmentNode.querySelector('.pins-layer');
  const modal = fragmentNode.querySelector('.new-pin-modal');
  const form = fragmentNode.querySelector('.pin-form');
  const inputX = fragmentNode.querySelector('#pinX');
  const inputY = fragmentNode.querySelector('#pinY');
  const closeBtn = fragmentNode.querySelector('.close-modal');
  const closeBtn2 = fragmentNode.querySelector('.close-modal-btn');

  if (!container || layoutMode === 'edit') return;

  const erc = configuration.objectErc || 'MAP_PIN';
  const allowCreation = configuration.allowCreation;

  async function fetchPins() {
    try {
      const url = `/o/c/${erc.toLowerCase()}s`;
      const fallbackUrl = `/o/c/${erc.toLowerCase()}`;
      let res = await Liferay.Util.fetch(fallbackUrl);
      if (res.status === 404) res = await Liferay.Util.fetch(url);
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      return data.items || [];
    } catch (err) {
      console.error('Failed to fetch pins', err);
      return [];
    }
  }

  async function createPin(pinData) {
    try {
      const url = `/o/c/${erc.toLowerCase()}s`;
      const fallbackUrl = `/o/c/${erc.toLowerCase()}`;
      let res = await Liferay.Util.fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pinData),
      });
      if (res.status === 404) {
        res = await Liferay.Util.fetch(fallbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pinData),
        });
      }
      if (!res.ok) throw new Error('Create failed');
      return await res.json();
    } catch (err) {
      console.error('Failed to create pin', err);
      throw err;
    }
  }

  function renderPin(pin) {
    const pinEl = document.createElement('div');
    pinEl.className = 'map-pin';
    pinEl.style.left = `${pin.xCoord}%`;
    pinEl.style.top = `${pin.yCoord}%`;

    pinEl.innerHTML = `
			<span class="map-pin-icon"></span>
			<div class="map-pin-tooltip">
				<h4>${pin.title || 'Untitled'}</h4>
				<p>${pin.description || ''}</p>
			</div>
		`;
    pinsLayer.appendChild(pinEl);
  }

  async function init() {
    const pins = await fetchPins();
    pins.forEach(renderPin);

    if (allowCreation && modal && form) {
      bgImg.addEventListener('click', (e) => {
        const rect = bgImg.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        form.reset();
        inputX.value = x.toFixed(2);
        inputY.value = y.toFixed(2);
        modal.showModal();
      });

      const closeModal = () => modal.close();
      if (closeBtn) closeBtn.addEventListener('click', closeModal);
      if (closeBtn2) closeBtn2.addEventListener('click', closeModal);

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('.submit-pin');
        submitBtn.disabled = true;

        const formData = new FormData(form);
        const pinData = {
          title: formData.get('title'),
          description: formData.get('description'),
          xCoord: parseFloat(formData.get('xCoord')),
          yCoord: parseFloat(formData.get('yCoord')),
        };

        try {
          const newPin = await createPin(pinData);
          renderPin(newPin);
          modal.close();
        } catch (err) {
          alert('Failed to save pin. Check console for details.');
        } finally {
          submitBtn.disabled = false;
        }
      });
    }
  }

  init();
}

initInteractiveFloorplan();
