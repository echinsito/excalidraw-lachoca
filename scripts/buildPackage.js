


// Will be used later for treeshaking
//const fs = require("fs");
// const path = require("path");

// function getFiles(dir, files = []) {
//   const fileList = fs.readdirSync(dir);
//   for (const file of fileList) {
//     const name = `${dir}/${file}`;
//     if (
//       name.includes("node_modules") ||
//       name.includes("config") ||
//       name.includes("package.json") ||
//       name.includes("main.js") ||
//       name.includes("index-node.ts") ||
//       name.endsWith(".d.ts")
//     ) {
//       continue;
//     }

//     if (fs.statSync(name).isDirectory()) {
//       getFiles(name, files);
//     } else if (
//       !(
//         name.match(/\.(sa|sc|c)ss$/) ||
//         name.match(/\.(woff|woff2|eot|ttf|otf)$/) ||
//         name.match(/locales\/[^/]+\.json$/)
//       )
//     ) {
//       continue;
//     } else {
//       files.push(name);
//     }
//   }
//   return files;
// }

// const createESMBrowserBuild = async () => {
//   // Development unminified build with source maps
//   await build({
//     ...browserConfig,
//     outdir: "dist/browser/dev",
//     sourcemap: true,
//     chunkNames: "excalidraw-assets-dev/[name]-[hash]",
//     assetNames: "excalidraw-assets-dev/[name]-[hash]",
//     define: {
//       "import.meta.env": JSON.stringify({ DEV: true }),
//     },
//   });

//   // production minified build without sourcemaps
//   await build({
//     ...browserConfig,
//     outdir: "dist/browser/prod",
//     minify: true,
//     chunkNames: "excalidraw-assets/[name]-[hash]",
//     assetNames: "excalidraw-assets/[name]-[hash]",
//     define: {
//       "import.meta.env": JSON.stringify({ PROD: true }),
//     },
//   });
// };

// const BASE_PATH = `${path.resolve(`${__dirname}/..`)}`;
// const filesinExcalidrawPackage = [
//   ...getFiles(`${BASE_PATH}/packages/excalidraw`),
//   `${BASE_PATH}/packages/utils/export.ts`,
//   `${BASE_PATH}/packages/utils/bbox.ts`,
//   ...getFiles(`${BASE_PATH}/public/fonts`),
// ];

// const filesToTransform = filesinExcalidrawPackage.filter((file) => {
//   return !(
//     file.includes("/__tests__/") ||
//     file.includes(".test.") ||
//     file.includes("/tests/") ||
//     file.includes("example")
//   );
// });

// const rawConfig = {
//   entryPoints: ["index.tsx"],
//   bundle: true,
//   format: "esm",
//   plugins: [sassPlugin(), woff2BrowserPlugin()],
//   loader: {
//     ".json": "copy",
//   },
//   packages: "external",
// };

// const createESMRawBuild = async () => {
//   // Development unminified build with source maps
//   await build({
//     ...rawConfig,
//     sourcemap: true,
//     outdir: "dist/dev",
//     define: {
//       "import.meta.env": JSON.stringify({ DEV: true }),
//     },
//   });

//   // production minified build without sourcemaps
//   await build({
//     ...rawConfig,
//     minify: true,
//     outdir: "dist/prod",
//     define: {
//       "import.meta.env": JSON.stringify({ PROD: true }),
//     },
//   });
// };

// createESMRawBuild();
// createESMBrowserBuild();

const path = require("path");

const { build } = require("esbuild");
const { sassPlugin } = require("esbuild-sass-plugin");

const { parseEnvVariables } = require("../packages/excalidraw/env.cjs");


// const { externalGlobalPlugin } = require("esbuild-plugin-external-global");
// const { woff2BrowserPlugin } = require("./woff2/woff2-esbuild-plugins");


const ENV_VARS = {
  development: {
    ...parseEnvVariables(`${__dirname}/../.env.development`),
    DEV: true,
  },
  production: {
    ...parseEnvVariables(`${__dirname}/../.env.production`),
    PROD: true,
  },
};

// excludes all external dependencies and bundles only the source code
const getConfig = (outdir) => ({
  outdir,
  bundle: true,
  splitting: true,
  format: "esm",
  packages: "external",
  plugins: [sassPlugin()],
  target: "es2020",
  assetNames: "[dir]/[name]",
  chunkNames: "[dir]/[name]-[hash]",
  alias: {
    "@excalidraw/utils": path.resolve(__dirname, "../packages/utils/src"),
  },
  external: ["@excalidraw/common", "@excalidraw/element", "@excalidraw/math"],
  loader: {
    ".woff2": "file",
  },
});


function buildDev(config) {
  return build({
    ...config,
    sourcemap: true,
    define: {
      "import.meta.env": JSON.stringify(ENV_VARS.development),
    },
  });
}

function buildProd(config) {
  return build({
    ...config,
    minify: true,
    define: {
      "import.meta.env": JSON.stringify(ENV_VARS.production),
    },
  });
}

const createESMRawBuild = async () => {
  const chunksConfig = {
    entryPoints: ["../excalidraw-app/App.tsx", "**/*.chunk.ts"],
    entryNames: "[name]",
  };

  // development unminified build with source maps
  await buildDev({
    ...getConfig("dist/dev"),
    ...chunksConfig,
  });

  // production minified buld without sourcemaps
  await buildProd({
    ...getConfig("dist/prod"),
    ...chunksConfig,
  });
};

(async () => {
  await createESMRawBuild();
})();
