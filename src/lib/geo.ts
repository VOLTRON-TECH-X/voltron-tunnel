// Browser-side IP geolocation (avoids server egress blocks on hosting providers).
export type Geo = { ip: string; country: string; city: string; region: string; code: string };

async function getJson(url: string, ms = 6000): Promise<any> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { Accept: "application/dns-json, application/json" } });
    return r.ok ? await r.json() : null;
  } catch { return null; } finally { clearTimeout(t); }
}

const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;
async function resolveIp(host: string): Promise<string | null> {
  if (IPV4.test(host) || host.includes(":")) return host;
  for (const u of [
    `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(host)}&type=A`,
    `https://dns.google/resolve?name=${encodeURIComponent(host)}&type=A`,
  ]) {
    const j = await getJson(u);
    const a = j?.Answer?.filter((x: any) => x.type === 1).pop();
    if (a?.data) return a.data;
  }
  return null;
}

const cache = new Map<string, Geo | null>();

export async function geolocate(ipOrHost: string): Promise<Geo | null> {
  const ip = await resolveIp(ipOrHost);
  if (!ip) return null;
  if (cache.has(ip)) return cache.get(ip)!;
  let g: Geo | null = null;
  const a = await getJson(`https://ipwho.is/${ip}`);
  if (a?.success) g = { ip, country: a.country, city: a.city, region: a.region, code: a.country_code };
  if (!g) {
    const b = await getJson(`https://ipapi.co/${ip}/json/`);
    if (b && !b.error && b.country_name) g = { ip, country: b.country_name, city: b.city, region: b.region, code: b.country_code };
  }
  if (!g) {
    const c = await getJson(`https://freeipapi.com/api/json/${ip}`);
    if (c?.countryName) g = { ip, country: c.countryName, city: c.cityName, region: c.regionName, code: c.countryCode };
  }
  cache.set(ip, g);
  return g;
}

export function flagEmoji(code?: string | null) {
  if (!code || code.length !== 2) return "🌐";
  return String.fromCodePoint(...code.toUpperCase().split("").map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}
