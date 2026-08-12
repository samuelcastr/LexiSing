export function esRutaDashboard(url: string): boolean {
  return url === '/dashboard' || /^\/roles\/[^/]+\/dashboard(\?|$)/.test(url);
}
