const BROWSER_ID_KEY = 'minna_browser_id';

export function getBrowserId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(BROWSER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(BROWSER_ID_KEY, id);
  }
  return id;
}
