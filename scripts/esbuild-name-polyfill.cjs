// esbuild __name polyfill – required because esbuild keepNames injects
// __name() calls that are not defined in the global scope.
globalThis.__name = function __name(target, value) {
  Object.defineProperty(target, "name", { value, configurable: true });
  return target;
};
