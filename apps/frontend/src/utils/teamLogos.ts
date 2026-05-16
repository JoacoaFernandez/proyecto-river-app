const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const SESSION_KEY = 'river_app_team_logos';

let logoMap: Record<string, string> = {};
let loaded = false;

function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function loadTeamLogos(): Promise<void> {
  if (loaded) return;

  try {
    const cached = sessionStorage.getItem(SESSION_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as Record<string, string>;
      if (Object.keys(parsed).length > 0) {
        logoMap = parsed;
        loaded = true;
        return;
      }
    }
  } catch { /* ignore */ }

  try {
    const res = await fetch(`${API_BASE}/live/team-logos`);
    if (!res.ok) return;
    const raw: Record<string, string> = await res.json();
    const normalized: Record<string, string> = {};
    for (const [name, url] of Object.entries(raw)) {
      normalized[normalize(name)] = url;
    }
    logoMap = normalized;
    loaded = true;
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(normalized));
    } catch { /* quota exceeded */ }
  } catch { /* network error — logos fall back to initials */ }
}

export function getTeamLogoUrl(teamName: string): string | null {
  if (!teamName) return null;
  const key = normalize(teamName);

  if (logoMap[key]) return logoMap[key];

  let bestMatch: string | null = null;
  let bestLen = 0;
  for (const k of Object.keys(logoMap)) {
    if (k.length < 3) continue;
    if (key.includes(k) || k.includes(key)) {
      if (k.length > bestLen) {
        bestLen = k.length;
        bestMatch = k;
      }
    }
  }
  return bestMatch ? logoMap[bestMatch] : null;
}

export { getTeamLogoUrl as getTeamLogo };
