import axios from "@/utils/axios";

export interface CountryOption {
  id: string;
  name: string;
  code?: string;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function firstNonEmptyString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

export function extractCountry(raw: Record<string, unknown>) {
  const country = asRecord(raw.country);
  const countryId = firstNonEmptyString(
    raw.countryId,
    raw.country_id,
    raw.idCountry,
    raw.id_country,
    country?.id
  );
  const countryName = firstNonEmptyString(
    raw.countryName,
    raw.country_name,
    raw.pays,
    raw.paysName,
    raw.pays_name,
    country?.name,
    country?.label,
    country?.title
  );
  const countryCode = firstNonEmptyString(
    raw.countryCode,
    raw.country_code,
    country?.code,
    country?.isoCode,
    country?.iso2
  );

  return {
    countryId,
    countryName: countryName || countryCode || "-",
    countryCode,
  };
}

function normalizeCountry(raw: Record<string, unknown>): CountryOption | null {
  const id = firstNonEmptyString(raw.id, raw.countryId, raw.country_id, raw.code, raw.isoCode, raw.iso2);
  const name = firstNonEmptyString(raw.name, raw.label, raw.title, raw.countryName, raw.country_name);
  const code = firstNonEmptyString(raw.code, raw.isoCode, raw.iso2);
  if (!id || !name) return null;
  return { id, name, code: code || undefined };
}

export async function fetchCountries(): Promise<CountryOption[]> {
  try {
    const response = await axios.get("countries");
    const payload = Array.isArray(response.data?.data)
      ? response.data.data
      : Array.isArray(response.data)
        ? response.data
        : [];

    const countries = payload
      .map((item: unknown) => normalizeCountry(asRecord(item) || {}))
      .filter((item: CountryOption | null): item is CountryOption => Boolean(item));

    return countries.sort((a: CountryOption, b: CountryOption) => a.name.localeCompare(b.name, "fr"));
  } catch {
    return [];
  }
}



export function mergeCountryOptions(
  existing: CountryOption[],
  items: Array<{ countryId?: string; countryName?: string }>
) {
  const map = new Map(existing.map((item) => [item.id, item]));

  items.forEach((item) => {
    if (!item.countryId || !item.countryName || item.countryName === "-") return;
    if (!map.has(item.countryId)) {
      map.set(item.countryId, { id: item.countryId, name: item.countryName });
    }
  });

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "fr"));
}
