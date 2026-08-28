const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Résolution pnpm monorepo : node_modules symlinké, non-flat — Metro doit
// regarder à la racine du repo en plus du dossier de l'app, et honorer la
// carte "exports" de @titan-kinetic/core (sinon résolution silencieusement
// cassée alors que le même import fonctionne côté web).
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
// pnpm utilise des symlinks pour son store virtuel (.pnpm/) — Metro ne les
// suit pas par défaut. unstable_enablePackageExports honore la carte
// "exports" de @titan-kinetic/core (sinon résolution silencieusement
// cassée alors que le même import fonctionne côté web via Next.js).
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
