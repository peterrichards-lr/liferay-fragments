const path = require('path');

// Collections in this repository are laid out as <collection>/main/collection.json
// (see the main/test restructure in #18). Taking the basename of the directory
// holding collection.json therefore yields the layout directory — "main" — for
// every collection, rather than the collection's own folder name.
const LAYOUT_DIR_NAMES = new Set(['main', 'test']);

/**
 * Resolve the collection's folder name from the directory containing its
 * collection.json, stepping over the main/test layout directory when present.
 *
 * @param {string} collectionDir Directory containing collection.json
 * @returns {string} The collection folder name, e.g. "aura"
 */
function resolveCollectionFolder(collectionDir) {
  const basename = path.basename(collectionDir);
  if (LAYOUT_DIR_NAMES.has(basename)) {
    const parent = path.basename(path.dirname(collectionDir));
    if (parent && parent !== '.' && parent !== path.sep) {
      return parent;
    }
  }
  return basename;
}

module.exports = { resolveCollectionFolder, LAYOUT_DIR_NAMES };
