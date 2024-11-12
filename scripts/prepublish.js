// @ts-check
import fs from "node:fs/promises";
import pkg from "../package.json" with {type:'json'};

const url = new URL("../src/version.ts", import.meta.url);
await fs.writeFile(
  url,
  `// Autogenerated by prepublish.js
const version = "v${pkg.version}";
export default version;`
);