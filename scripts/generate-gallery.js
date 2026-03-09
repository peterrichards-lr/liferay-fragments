const fs = require("fs");
const path = require("path");
const { globSync } = require("glob");

const DOCS_DIR = path.join(process.cwd(), "docs");
const GALLERY_FILE = path.join(DOCS_DIR, "gallery.md");
const IMAGES_DIR = path.join(DOCS_DIR, "images");

/**
 * Fragment Gallery Generator Logic
 */
function generateGallery() {
  // 1. Find all collections
  const collections = globSync("*/collection.json");

  let markdown = `# Fragment Visual Gallery\n\nA visual reference for the high-fidelity fragments available in this Liferay DXP repository. Generated automatically.\n\n`;

  collections.sort().forEach((collectionFile) => {
    const collectionDir = path.dirname(collectionFile);
    const collectionMetadata = JSON.parse(
      fs.readFileSync(collectionFile, "utf8"),
    );

    // Find fragments in this collection
    const fragments = globSync(`${collectionDir}/fragments/*/fragment.json`);

    if (fragments.length === 0) return;

    markdown += `## ${collectionMetadata.name}\n\n`;
    if (collectionMetadata.description) {
      markdown += `${collectionMetadata.description}\n\n`;
    }

    fragments.sort().forEach((fragFile) => {
      const fragDir = path.dirname(fragFile);
      const fragMetadata = JSON.parse(fs.readFileSync(fragFile, "utf8"));
      const fragSafeName = path.basename(fragDir);

      markdown += `### ${fragMetadata.name}\n\n`;

      let imgPath = "";
      const manualImg = path.join(IMAGES_DIR, `${fragSafeName}.png`);

      if (fs.existsSync(manualImg)) {
        imgPath = `./images/${fragSafeName}.png`;
      } else if (fs.existsSync(path.join(fragDir, "screenshot.png"))) {
        imgPath = path.relative(DOCS_DIR, path.join(fragDir, "screenshot.png"));
      } else if (fs.existsSync(path.join(fragDir, "thumbnail.png"))) {
        imgPath = path.relative(DOCS_DIR, path.join(fragDir, "thumbnail.png"));
      }

      if (imgPath) {
        markdown += `![${fragMetadata.name}](${imgPath})\n\n`;
      } else {
        markdown += `*No image available*\n\n`;
      }

      const docFile = path.join(DOCS_DIR, "fragments", `${fragSafeName}.md`);
      if (fs.existsSync(docFile)) {
        markdown += `[Detailed Documentation](./fragments/${fragSafeName}.md)\n\n`;
      } else {
        const rootDocFile = path.join(DOCS_DIR, `${fragSafeName}.md`);
        if (fs.existsSync(rootDocFile)) {
          markdown += `[Detailed Documentation](./${fragSafeName}.md)\n\n`;
        }
      }

      markdown += `--- \n\n`;
    });
  });

  return markdown.trim() + "\n";
}

// If run directly
if (require.main === module) {
  const content = generateGallery();
  fs.writeFileSync(GALLERY_FILE, content);
  console.log(`Successfully generated gallery at: ${GALLERY_FILE}`);
}

module.exports = { generateGallery };
