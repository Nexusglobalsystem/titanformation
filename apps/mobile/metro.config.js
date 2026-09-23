const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Résolution pnpm monorepo : le store virtuel .pnpm/ est symlinké, Metro ne
// les suit pas par défaut (unstable_enableSymlinks), et @titan-kinetic/core
// n'est résolvable que si la carte "exports" de son package.json est
// honorée (unstable_enablePackageExports) — sinon résolution silencieusement
// cassée alors que le même import fonctionne côté web via Next.js.
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;

// watchFolders scopé à node_modules + packages/ plutôt qu'à la racine du
// monorepo entière (qui inclurait apps/web — aucune dépendance mobile
// dessus, mais un node_modules bien plus gros à crawler).
config.watchFolders = [
  path.resolve(workspaceRoot, "node_modules"),
  path.resolve(workspaceRoot, "packages"),
];

module.exports = withNativeWind(config, { input: "./global.css" });
