const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

/**
 * Bulk Render Tool
 * Discovers all fragments in the project and runs the test-bed runner for each.
 */

const projectRoot = path.resolve(__dirname, "..");
const theme = process.argv[2] || "meridian";

function findFragments(dir, fragmentList = []) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (
        file === "node_modules" ||
        file === ".git" ||
        file === "test-bed" ||
        file === "zips" ||
        file === "docs" ||
        file === "temp"
      ) {
        continue;
      }

      if (fs.existsSync(path.join(fullPath, "fragment.json"))) {
        fragmentList.push(fullPath);
      } else {
        findFragments(fullPath, fragmentList);
      }
    }
  }
  return fragmentList;
}

const fragments = findFragments(projectRoot);

console.log(
  `[Bulk Render] Found ${fragments.length} fragments to process using theme: ${theme}`,
);

fragments.forEach((fragmentPath, index) => {
  const relativePath = path.relative(projectRoot, fragmentPath);
  console.log(
    `[${index + 1}/${fragments.length}] Processing: ${relativePath}...`,
  );
  try {
    // Run the test-bed runner
    execSync(`node test-bed/runner.js "${relativePath}" view ${theme}`, {
      stdio: "inherit",
    });
  } catch (err) {
    console.error(
      `[Bulk Render] Failed to render ${relativePath}:`,
      err.message,
    );
  }
});

console.log("[Bulk Render] Completed all tasks.");
