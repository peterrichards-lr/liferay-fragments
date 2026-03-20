/**
 * Liferay Fragment Commons: Logger
 * Provides standardized, toggleable, and contextual logging.
 */
window.Liferay = window.Liferay || {};
window.Liferay.Fragment = window.Liferay.Fragment || {};
window.Liferay.Fragment.Commons = window.Liferay.Fragment.Commons || {};

if (!window.Liferay.Fragment.Commons.Logger) {
  const _isDebug = new URLSearchParams(window.location.search).has(
    'debugFragments'
  );

  const _styles = {
    debug: 'color: #7f8c8d; font-weight: normal;',
    info: 'color: #2980b9; font-weight: bold;',
    warn: 'color: #f39c12; font-weight: bold;',
    error: 'color: #c0392b; font-weight: bold;',
    prefix:
      'color: #8e44ad; font-weight: bold; border-right: 1px solid #ccc; padding-right: 5px; margin-right: 5px;',
  };

  const _log = (level, context, message, data) => {
    if (level === 'debug' && !_isDebug) return;

    const prefix = `%c[LFR-FRAG]%c${context}`;
    const logArgs = [
      `${prefix}%c ${message}`,
      _styles.prefix,
      _styles[level],
      'color: inherit; font-weight: normal;',
    ];

    if (data !== undefined) logArgs.push(data);

    if (level === 'error') console.error(...logArgs);
    else if (level === 'warn') console.warn(...logArgs);
    else console.log(...logArgs);
  };

  window.Liferay.Fragment.Commons.Logger = {
    create: (context) => ({
      debug: (msg, data) => _log('debug', context, msg, data),
      info: (msg, data) => _log('info', context, msg, data),
      warn: (msg, data) => _log('warn', context, msg, data),
      error: (msg, data) => _log('error', context, msg, data),
    }),
  };
}
