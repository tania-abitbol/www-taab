export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("~/")) {
    const bare = specifier.slice(2);
    const file = /\.(ts|tsx|js|mjs)$/.test(bare) ? bare : `${bare}.ts`;
    return nextResolve(new URL(`../src/${file}`, import.meta.url).href, context);
  }
  return nextResolve(specifier, context);
}
