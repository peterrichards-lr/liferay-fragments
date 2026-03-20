/**
 * Liferay Fragment Commons: Event Bus
 * Standardizes fragment-to-fragment communication with support for:
 * 1. Namespacing/Topics
 * 2. Sticky Events (Replay for hydration race conditions)
 * 3. Consistent payload structures
 * 4. Debugging/Logging
 */
window.Liferay = window.Liferay || {};
window.Liferay.Fragment = window.Liferay.Fragment || {};
window.Liferay.Fragment.Commons = window.Liferay.Fragment.Commons || {};

if (!window.Liferay.Fragment.Commons.EventBus) {
  const _state = {
    subscribers: {},
    stickyEvents: {},
    debug: new URLSearchParams(window.location.search).has('debugFragments'),
  };

  const _log = (message, data) => {
    if (_state.debug) {
      console.log(`[Fragment EventBus] ${message}`, data || '');
    }
  };

  window.Liferay.Fragment.Commons.EventBus = {
    /**
     * Publish an event to a specific topic.
     * @param {string} topic - The event name (e.g., 'filterUpdate').
     * @param {Object} data - The payload.
     * @param {Object} options - { sticky: boolean }
     */
    publish(topic, data = {}, options = {}) {
      _log(`Publishing to topic: ${topic}`, data);

      if (options.sticky) {
        _state.stickyEvents[topic] = data;
      }

      const event = new CustomEvent(`lfr-bus:${topic}`, {
        detail: data,
        bubbles: false,
        cancelable: true,
      });

      window.dispatchEvent(event);
    },

    /**
     * Subscribe to a topic.
     * @param {string} topic - The event name.
     * @param {Function} callback - Function(data).
     * @param {Object} options - { replay: boolean } - If true, immediately fires with last sticky value if it exists.
     * @returns {Function} Unsubscribe function.
     */
    subscribe(topic, callback, options = {}) {
      _log(`New subscription to topic: ${topic}`);

      const internalCallback = (e) => {
        _log(`Received event for topic: ${topic}`, e.detail);
        callback(e.detail);
      };

      window.addEventListener(`lfr-bus:${topic}`, internalCallback);

      if (options.replay && _state.stickyEvents[topic] !== undefined) {
        _log(`Replaying sticky event for topic: ${topic}`);
        callback(_state.stickyEvents[topic]);
      }

      // Return unsubscribe function
      return () => {
        window.removeEventListener(`lfr-bus:${topic}`, internalCallback);
      };
    },

    /**
     * Get the last known value of a sticky topic.
     */
    getLastValue(topic) {
      return _state.stickyEvents[topic];
    },
  };
}
