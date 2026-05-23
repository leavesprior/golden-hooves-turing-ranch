export function isTopDownBetaRoute() {
  if (typeof window === 'undefined') return false

  const params = new URLSearchParams(window.location.search)
  return window.location.pathname.startsWith('/clue/') && params.get('visual') === 'topdown'
}
