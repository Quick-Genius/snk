import * as fs from "fs";
import * as path from "path";
import { getGithubUserContribution } from "@snk/github-user-contribution";
import { getBestRoute } from "@snk/solver/getBestRoute";
import { getPathToPose } from "@snk/solver/getPathToPose";
import { snake4 } from "@snk/types/__fixtures__/snake";
import { createEmptyGrid, setColor, setColorEmpty, getColor, isEmpty } from "@snk/types/grid";
import { getHeadX, getHeadY } from "@snk/types/snake";

// Default parameters
const sizeCell = 16;
const gopherSize = 42; // Larger gopher
const animDurationMs = 45000; // 120s total duration (very slow)

const userName = process.env.GITHUB_USER_NAME || process.argv[2];
if (!userName) {
  console.error("Missing GITHUB_USER_NAME environment variable or argument");
  process.exit(1);
}

// Convert cell points back to snake type array if needed
// Actually we can just use the provided functions

async function main() {
  console.log("Gopher Generator v1.1 starting...");
  console.log(`Fetching contributions for ${userName}...`);
  const cells = await getGithubUserContribution(userName, { githubToken: process.env.GITHUB_TOKEN || "" });
  
  const width = Math.max(0, ...cells.map((c) => c.x)) + 1;
  const height = Math.max(0, ...cells.map((c) => c.y)) + 1;
  
  const grid = createEmptyGrid(width, height);
  for (const c of cells) {
    if (c.level > 0) setColor(grid, c.x, c.y, c.level as any);
    else setColorEmpty(grid, c.x, c.y);
  }
  
  console.log("Computing best route...");
  const snake = snake4;
  const chain = getBestRoute(grid, snake)!;
  const pathToPose = getPathToPose(chain.slice(-1)[0], snake);
  if (pathToPose) {
    chain.push(...pathToPose);
  }
  
  const totalLength = chain.length;
  console.log(`Route computed. Length: ${totalLength}`);
  
  const livingCells = Array.from({ length: width }, (_, x) =>
    Array.from({ length: height }, (_, y) => ({
      x, y,
      t: null as number | null,
      color: getColor(grid, x, y)
    }))
  ).flat();
  
  const workingGrid = createEmptyGrid(width, height);
  for (let i = 0; i < grid.data.length; i++) workingGrid.data[i] = grid.data[i];
  
  for (let i = 0; i < chain.length; i++) {
    const s = chain[i];
    const x = getHeadX(s);
    const y = getHeadY(s);
    
    if (x >= 0 && y >= 0 && x < width && y < height && !isEmpty(getColor(workingGrid, x, y))) {
      setColorEmpty(workingGrid, x, y);
      const cell = livingCells.find((c) => c.x === x && c.y === y)!;
      cell.t = i / chain.length;
    }
  }
  
  const svgWidth = (width + 2) * sizeCell;
  const svgHeight = (height + 5) * sizeCell;
  const viewBox = `-${sizeCell} -${sizeCell * 2} ${svgWidth} ${svgHeight}`;
  
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="${viewBox}">\n`;
  
  // Styles for Dark / Light mode and eating effect (eating is handled mostly via <animate>)
  svg += `<style>
    .cell { rx: 3px; ry: 3px; stroke-width: 1px; stroke: rgba(27,31,35,0.06); }
    @media (prefers-color-scheme: dark) {
      .cell { stroke: rgba(255,255,255,0.05); }
    }
  </style>\n`;
  
  const colorMap: Record<number, string> = {
    0: "var(--c0, #ebedf0)",
    1: "var(--c1, #9be9a8)",
    2: "var(--c2, #40c463)",
    3: "var(--c3, #30a14e)",
    4: "var(--c4, #216e39)",
  };
  const colorMapDark: Record<number, string> = {
    0: "var(--c0, #161b22)",
    1: "var(--c1, #0e4429)",
    2: "var(--c2, #006d32)",
    3: "var(--c3, #26a641)",
    4: "var(--c4, #39d353)",
  };
  
  svg += `<style>
    :root {
      ${Object.entries(colorMap).map(([k,v]) => `--c${k}: ${v.split(',')[1].replace(')','')};`).join("\n      ")}
    }
    @media (prefers-color-scheme: dark) {
      :root {
        ${Object.entries(colorMapDark).map(([k,v]) => `--c${k}: ${v.split(',')[1].replace(')','')};`).join("\n        ")}
      }
    }
  </style>\n`;
  
  // Generating cells
  for (const c of livingCells) {
    const cx = c.x * sizeCell;
    const cy = c.y * sizeCell;
    const fill = `var(--c${c.color ? Math.min(c.color, 4) : 0})`;
    
    // Animate eating: the cell briefly shrinks to 0 scale and fades, then returns if needed
    // The user requested: "When gopher reaches a square: Square shrinks OR fades"
    if (c.t !== null) {
      const delay = (c.t * animDurationMs) / 1000;
      // using transform scaling around the center
      const centerOffsetX = cx + sizeCell/2;
      const centerOffsetY = cy + sizeCell/2;
      
      svg += `  <g transform="translate(${centerOffsetX}, ${centerOffsetY})">
    <rect x="-${(sizeCell-2)/2}" y="-${(sizeCell-2)/2}" width="${sizeCell - 2}" height="${sizeCell - 2}" fill="${fill}" class="cell">
      <animateTransform attributeName="transform" type="scale" values="1; 0.2; 0; 0" keyTimes="0; 0.1; 0.5; 1" begin="${delay}s" dur="${animDurationMs/1000}s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="1; 0.5; 0; 0" keyTimes="0; 0.1; 0.5; 1" begin="${delay}s" dur="${animDurationMs/1000}s" repeatCount="indefinite" />
    </rect>
  </g>\n`;
    } else {
      svg += `  <rect x="${cx + 1}" y="${cy + 1}" width="${sizeCell - 2}" height="${sizeCell - 2}" fill="${fill}" class="cell" />\n`;
    }
  }
  
  // Prepare Gopher Motion Path
  let pathD = "";
  for (let i = 0; i < chain.length; i++) {
    const s = chain[i];
    const x = getHeadX(s) * sizeCell + sizeCell/2;
    const y = getHeadY(s) * sizeCell + sizeCell/2;
    if (i === 0) pathD += `M ${x} ${y} `;
    else pathD += `L ${x} ${y} `;
  }
  
  // Path for motion (invisible)
  svg += `  <path id="gopher-path" d="${pathD}" fill="none" stroke="transparent" />\n`;
  
  // Read gopher.png
  const gopherPath = path.join(__dirname, "../assets/gopher.png");
  let gopherDataUri: string;
  if (!fs.existsSync(gopherPath)) {
      console.warn("assets/gopher.png not found! Using a placeholder...");
      // A fallback transparent 1x1 pixel image
      gopherDataUri = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
  } else {
      const gopherB64 = fs.readFileSync(gopherPath).toString("base64");
      gopherDataUri = "data:image/png;base64," + gopherB64;
  }
  
  // Adding the Gopher (bounce effect + motion)
  // Gopher bounce animation: scale up and down slightly (duration 0.6s)
  svg += `  <g>
    <animateMotion dur="${animDurationMs/1000}s" repeatCount="indefinite">
      <mpath href="#gopher-path" />
    </animateMotion>
    <g>
      <animateTransform attributeName="transform" type="translate" values="0,0; 0,-4; 0,0" dur="0.6s" repeatCount="indefinite" />
      <image href="${gopherDataUri}" width="${gopherSize}" height="${gopherSize}" x="-${gopherSize/2}" y="-${gopherSize/2}" />
    </g>
  </g>\n`;
  
  svg += `</svg>\n`;
  
  const outDir = path.join(__dirname, "../output");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  fs.writeFileSync(path.join(outDir, "gopher.svg"), svg);
  console.log("Successfully wrote output/gopher.svg");
}

main().catch(e => {
  console.error("Error generating SVG:", e);
  process.exit(1);
});
