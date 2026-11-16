(function () {
  const mapWrap = document.getElementById('map-wrap');
  const map = window.__nycMap || window.map;
  if (!mapWrap || !map) {
    return;
  }

  const storyError = ensureNode('stories-error', 'div', 'aria-live', 'polite');
  const storyStatus = ensureNode('story-status', 'div', 'aria-live', 'polite');
  const storyOverlay = ensureStoryOverlay();
  injectStoryStyles();
  let storyGroups = [];
  let storyMarkers = [];
  let storyButtons = [];
  let storyPromise = null;
  let currentGroup = null;
  let activeCard = null;
  let activePin = null;
  let storyData = null;

  function ensureNode(testId, tagName, attrName, attrValue) {
    let node = document.querySelector(`[data-testid="${testId}"]`);
    if (!node) {
      node = document.createElement(tagName);
      node.setAttribute('data-testid', testId);
      if (attrName && attrValue) {
        node.setAttribute(attrName, attrValue);
      }
      const anchor = mapWrap.nextSibling;
      if (mapWrap.parentNode) {
        if (anchor) {
          mapWrap.parentNode.insertBefore(node, anchor);
        } else {
          mapWrap.parentNode.appendChild(node);
        }
      }
    }
    return node;
  }

  function ensureStoryOverlay() {
    let overlay = document.getElementById('story-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'story-overlay';
      overlay.setAttribute('style', 'position:absolute; inset:0; z-index:651; pointer-events:none;');
      mapWrap.appendChild(overlay);
    }
    return overlay;
  }

  function injectStoryStyles() {
    if (document.getElementById('story-styles')) {
      return;
    }
    const style = document.createElement('style');
    style.id = 'story-styles';
    style.textContent = [
      '[data-testid="story-card"] { position:fixed; top:1rem; right:1rem; bottom:1rem; width:360px; max-width:calc(100vw - 2rem); background:#fff; padding:1rem; box-shadow:0 8px 16px rgba(0,0,0,0.2); overflow:auto; z-index:1000; box-sizing:border-box; }',
      '@media (max-width: 600px) { [data-testid="story-card"] { left:0; right:0; bottom:0; top:auto; width:auto; max-width:none; max-height:60vh; } }',
      '[data-testid="story-pin"]:focus-visible, [data-testid="story-card"] button:focus-visible, [data-testid="story-card"] a:focus-visible, [data-testid="era-option"]:focus-visible { outline:2px solid #222; outline-offset:2px; }',
    ].join('\n');
    document.head.appendChild(style);
  }

  function setStoryError(message) {
    storyError.textContent = message;
    storyError.style.display = 'block';
  }

  function clearStoryError() {
    storyError.textContent = '';
    storyError.style.display = 'none';
  }

  function setStatusText(text) {
    storyStatus.textContent = text;
  }

  function getStoryCountLabel(count) {
    return count === 1 ? '1 story' : `${count} stories`;
  }

  function closeCard(restoreFocus) {
    if (activeCard && activeCard.parentNode) {
      activeCard.parentNode.removeChild(activeCard);
    }

    activeCard = null;
    currentGroup = null;

    if (restoreFocus && activePin) {
      activePin.focus();
    }

    activePin = null;
    setStatusText('');
  }

  function getFocusableElements(cardElement) {
    const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    return Array.from(cardElement.querySelectorAll(selector)).filter((element) => {
      const tabIndex = element.getAttribute('tabindex');
      const disabled = element.disabled || element.getAttribute('aria-disabled') === 'true';
      return !disabled && !(tabIndex === '-1') && !element.hasAttribute('hidden');
    });
  }

  function handleCardKeydown(event) {
    if (!activeCard) {
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      closeCard(true);
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const focusables = getFocusableElements(activeCard);
    if (!focusables.length) {
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (!activeCard.contains(document.activeElement)) {
      event.preventDefault();
      first.focus();
      return;
    }
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function buildCard(group) {
    const card = document.createElement('div');
    card.setAttribute('data-testid', 'story-card');
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'true');

    const titleId = `story-card-title-${group.id}`;
    const title = document.createElement('h2');
    title.setAttribute('data-testid', 'story-card-title');
    title.id = titleId;
    title.textContent = group.name;
    card.appendChild(title);

    if (group.approx) {
      const approx = document.createElement('div');
      approx.setAttribute('data-testid', 'story-approx');
      approx.textContent = 'approx.';
      card.appendChild(approx);
    }

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.setAttribute('data-testid', 'story-card-close');
    closeButton.setAttribute('aria-label', 'Close');
    closeButton.textContent = 'Close';
    closeButton.addEventListener('click', () => {
      closeCard(true);
    });
    card.appendChild(closeButton);

    group.stories.forEach((story) => {
      const item = document.createElement('article');
      item.setAttribute('data-testid', 'story-item');

      const hook = document.createElement('p');
      hook.setAttribute('data-testid', 'story-hook');
      hook.textContent = story.hook || '';
      item.appendChild(hook);

      const text = document.createElement('p');
      text.setAttribute('data-testid', 'story-text');
      text.textContent = story.text && String(story.text).trim().length > 0 ? story.text : 'Full story coming.';
      item.appendChild(text);

      const source = document.createElement('p');
      source.setAttribute('data-testid', 'story-source');
      source.textContent = story.source || '';
      item.appendChild(source);

      if (typeof story.link === 'string' && story.link.startsWith('https://')) {
        const link = document.createElement('a');
        link.setAttribute('data-testid', 'story-link');
        link.href = story.link;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'Read the page';
        item.appendChild(link);
      }

      card.appendChild(item);
    });

    const attribution = document.createElement('div');
    attribution.setAttribute('data-testid', 'story-attribution');
    attribution.textContent = storyData && storyData.attribution ? storyData.attribution : '';
    card.appendChild(attribution);

    card.setAttribute('aria-labelledby', titleId);

    const parent = mapWrap.parentNode;
    if (parent) {
      parent.insertBefore(card, mapWrap.nextSibling);
    }

    const focusable = getFocusableElements(card);
    if (focusable.length) {
      focusable[0].focus();
    }

    activeCard = card;
    document.addEventListener('keydown', handleCardKeydown);
    setStatusText(`Showing ${getStoryCountLabel(group.stories.length)} at ${group.name}`);
    closeButton.focus();
    return card;
  }

  function openStoryCard(group, pin) {
    if (activeCard && currentGroup && currentGroup.id === group.id) {
      return;
    }

    if (activeCard && activeCard.parentNode) {
      activeCard.parentNode.removeChild(activeCard);
    }

    activePin = pin;
    currentGroup = group;
    activeCard = buildCard(group);
  }

  function removeStoryMarkers() {
    storyMarkers.forEach((marker) => {
      map.removeLayer(marker);
    });
    storyMarkers = [];

    storyButtons.forEach((button) => {
      if (button.parentNode) {
        button.parentNode.removeChild(button);
      }
    });
    storyButtons = [];
    storyOverlay.innerHTML = '';
  }

  function createStoryButton(group) {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('data-testid', 'story-pin');
    button.setAttribute('data-point-id', group.id);
    button.setAttribute('aria-label', `${group.name}, ${getStoryCountLabel(group.stories.length)}`);
    button.setAttribute('tabindex', '0');
    button.style.cssText = 'position:absolute; width:28px; height:28px; border:none; border-radius:50%; background:transparent; pointer-events:auto; cursor:pointer; z-index:651;';
    button.addEventListener('click', () => openStoryCard(group, button));
    button.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openStoryCard(group, button);
      }
    });
    return button;
  }

  function positionStoryButtons() {
    storyButtons.forEach((button, index) => {
      const group = storyGroups[index];
      if (!group) {
        return;
      }

      const point = map.latLngToContainerPoint([group.lat, group.lng]);
      button.style.left = `${point.x - 14}px`;
      button.style.top = `${point.y - 14}px`;
    });
  }

  function renderStoryPins(groups) {
    if (!Array.isArray(groups) || !groups.length) {
      removeStoryMarkers();
      return;
    }

    storyGroups = groups;
    removeStoryMarkers();

    groups.forEach((group) => {
      const marker = L.marker([group.lat, group.lng], { keyboard: false, interactive: false });
      storyMarkers.push(marker);
      marker.addTo(map);

      const button = createStoryButton(group);
      storyButtons.push(button);
      storyOverlay.appendChild(button);
    });

    positionStoryButtons();
    if (typeof window.__nycMap === 'object') {
      ['move', 'zoom', 'resize'].forEach((eventName) => {
        map.on(eventName, positionStoryButtons);
      });
    }
  }

  function loadStories() {
    if (!storyPromise) {
      storyPromise = fetch('/content/stories.v1.json', { cache: 'no-store' })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`Stories request failed: ${response.status}`);
          }

          const payload = await response.json();
          if (!payload || !Array.isArray(payload.groups)) {
            throw new Error('Stories payload is invalid');
          }

          storyData = payload;
          return payload;
        })
        .catch((error) => {
          console.error('[story-fetch]', error);
          setStoryError('Unable to load 1877 stories.');
          storyData = null;
          removeStoryMarkers();
          closeCard(false);
          storyPromise = null;
          return null;
        });
    }

    return storyPromise.then((payload) => {
      if (!payload || !Array.isArray(payload.groups)) {
        return null;
      }

      if (!window.__nycGetEra || window.__nycGetEra() !== '1877') {
        return payload;
      }

      clearStoryError();
      renderStoryPins(payload.groups);
      return payload;
    });
  }

  function handleEraChange(newEra) {
    if (newEra !== '1877') {
      closeCard(false);
      removeStoryMarkers();
      return;
    }

    loadStories();
  }


  window.__nycOnEra(handleEraChange);

  if (window.__nycGetEra && window.__nycGetEra() === '1877') {
    loadStories();
  }
})();
