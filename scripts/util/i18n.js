export function localize(key, fallback) {
  const value = game.i18n.localize(key);
  return value === key ? fallback : value;
}