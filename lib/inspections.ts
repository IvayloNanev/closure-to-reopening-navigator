type InspectionRow = {
  camis: string;
  dba?: string;
  boro?: string;
  inspection_date: string;
  inspection_type?: string;
  action: string;
  violation_code?: string;
  violation_description?: string;
};

type Event = {
  camis: string;
  dba: string;
  borough: string;
  date: Date;
  action: string;
  codes: Map<string, string>;
};

type Analysis = {
  ok: true;
  closureCount: number;
  reopenedCount: number;
  reopeningRate: number;
  medianDays: number;
  fastReopeningRate: number;
  topViolations: Array<{ code: string; shortDescription: string; count: number; rate: number }>;
  timelineBuckets: Array<{ label: string; count: number }>;
  dateRange: string;
  fetchedAt: string;
  apiUrl: string;
  sampleJourneys: Array<{
    camis: string;
    name: string;
    closureDate: string;
    reopeningDate: string;
    days: number;
    codes: string[];
  }>;
  benchmarkRecords: Array<{
    borough: string;
    closureDate: string;
    reopeningDays: number | null;
    codes: string[];
  }>;
  restaurantRecords: Array<{
    camis: string;
    name: string;
    borough: string;
    closureDate: string;
    reopeningDate: string | null;
    reopeningDays: number | null;
    codes: Array<{ code: string; description: string }>;
    laterClosureCount: number;
  }>;
  repeatClosurePatterns: Array<{
    code: string;
    description: string;
    repeatedCount: number;
    repeatRate: number;
  }>;
} | { ok: false; message: string };

const ENDPOINT = "https://data.cityofnewyork.us/resource/43nn-pn8j.json";
const CLOSED = "Establishment Closed by DOHMH";
const REOPENED = "Establishment re-opened by DOHMH";
const BOROUGH_BOUNDARIES = "https://data.cityofnewyork.us/resource/gthc-hcne.geojson?$limit=10";

export type BoroughMapPath = {
  name: string;
  path: string;
  labelX: number;
  labelY: number;
};

type Position = [number, number];
type BoroughFeature = {
  properties: { boroname?: string };
  geometry: { type: "Polygon" | "MultiPolygon"; coordinates: Position[][] | Position[][][] };
};

export async function getBoroughMap(): Promise<BoroughMapPath[]> {
  try {
    const response = await fetch(BOROUGH_BOUNDARIES, { next: { revalidate: 604800 } });
    if (!response.ok) return [];
    const collection = await response.json() as { features?: BoroughFeature[] };
    const features = collection.features || [];
    const allPoints: Position[] = [];
    const polygonsByName = new Map<string, Position[][][]>();

    for (const feature of features) {
      const name = feature.properties.boroname;
      if (!name) continue;
      const polygons = feature.geometry.type === "Polygon"
        ? [feature.geometry.coordinates as Position[][]]
        : feature.geometry.coordinates as Position[][][];
      polygonsByName.set(name, polygons);
      polygons.forEach((polygon) => polygon.forEach((ring) => allPoints.push(...ring)));
    }
    if (!allPoints.length) return [];

    const minLon = Math.min(...allPoints.map(([lon]) => lon));
    const maxLon = Math.max(...allPoints.map(([lon]) => lon));
    const minLat = Math.min(...allPoints.map(([, lat]) => lat));
    const maxLat = Math.max(...allPoints.map(([, lat]) => lat));
    const width = 720;
    const height = 430;
    const padding = 18;
    const scale = Math.min((width - padding * 2) / (maxLon - minLon), (height - padding * 2) / (maxLat - minLat));
    const mapWidth = (maxLon - minLon) * scale;
    const mapHeight = (maxLat - minLat) * scale;
    const offsetX = (width - mapWidth) / 2;
    const offsetY = (height - mapHeight) / 2;
    const project = ([lon, lat]: Position): Position => [
      offsetX + (lon - minLon) * scale,
      offsetY + (maxLat - lat) * scale,
    ];

    return [...polygonsByName.entries()].map(([name, polygons]) => {
      const projected = polygons.map((polygon) => polygon.map((ring) => ring.map(project)));
      const path = projected.map((polygon) => polygon.map((ring) => {
        const step = Math.max(1, Math.ceil(ring.length / 220));
        const points = ring.filter((_, index) => index % step === 0 || index === ring.length - 1);
        return points.map(([x, y], index) => `${index ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join("") + "Z";
      }).join("")).join("");
      const featurePoints = projected.flat(2);
      const featureMinX = Math.min(...featurePoints.map(([x]) => x));
      const featureMaxX = Math.max(...featurePoints.map(([x]) => x));
      const featureMinY = Math.min(...featurePoints.map(([, y]) => y));
      const featureMaxY = Math.max(...featurePoints.map(([, y]) => y));
      const labelAdjustments: globalThis.Record<string, Position> = {
        Manhattan: [0, 22], Brooklyn: [-4, 12], Queens: [5, 0], Bronx: [0, -4], "Staten Island": [0, 0],
      };
      const [adjustX, adjustY] = labelAdjustments[name] || [0, 0];
      return {
        name,
        path,
        labelX: (featureMinX + featureMaxX) / 2 + adjustX,
        labelY: (featureMinY + featureMaxY) / 2 + adjustY,
      };
    });
  } catch {
    return [];
  }
}

function isClosed(action: string) {
  return action.startsWith(CLOSED);
}

function isReopened(action: string) {
  return action.startsWith(REOPENED);
}

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function shorten(description: string, code: string) {
  const known: Record<string, string> = {
    "08A": "Conditions conducive to pests",
    "04L": "Evidence of mice",
    "04N": "Filth flies or food-refuse conditions",
    "06D": "Food-contact surface sanitation",
    "10F": "Non-food-contact surface sanitation",
  };
  if (known[code]) return known[code];
  const clean = description.replace(/\.$/, "").trim();
  return clean.length > 72 ? `${clean.slice(0, 69)}…` : clean || "Recorded violation";
}

export async function getClosureAnalysis(): Promise<Analysis> {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear() - 4, 0, 1));
  const startDate = start.toISOString().slice(0, 10);
  const params = new URLSearchParams({
    "$select": "camis,dba,boro,inspection_date,inspection_type,action,violation_code,violation_description",
    "$where": `inspection_date >= '${startDate}T00:00:00.000' AND (action like '${CLOSED}%' OR action like '${REOPENED}%')`,
    "$order": "camis,inspection_date",
    "$limit": "50000",
  });

  try {
    const apiUrl = `${ENDPOINT}?${params}`;
    const response = await fetch(apiUrl, {
      headers: { Accept: "application/json" },
      next: { revalidate: 21600 },
    });
    if (!response.ok) throw new Error(`NYC Open Data returned ${response.status}`);
    const rows = (await response.json()) as InspectionRow[];
    if (!rows.length) throw new Error("No closure records were returned");

    const eventMap = new Map<string, Event>();
    for (const row of rows) {
      const eventKey = [row.camis, row.inspection_date, row.inspection_type || "", row.action].join("|");
      if (!eventMap.has(eventKey)) {
        eventMap.set(eventKey, {
          camis: row.camis,
          dba: row.dba || "Restaurant name unavailable",
          borough: row.boro && row.boro !== "0" ? row.boro : "Borough unavailable",
          date: new Date(row.inspection_date),
          action: row.action,
          codes: new Map(),
        });
      }
      if (row.violation_code) {
        eventMap.get(eventKey)!.codes.set(row.violation_code, row.violation_description || "");
      }
    }

    const eventsByRestaurant = new Map<string, Event[]>();
    for (const event of eventMap.values()) {
      const events = eventsByRestaurant.get(event.camis) || [];
      events.push(event);
      eventsByRestaurant.set(event.camis, events);
    }

    const closures: Event[] = [];
    const reopeningDays: number[] = [];
    const benchmarkRecords: Array<{
      borough: string;
      closureDate: string;
      reopeningDays: number | null;
      codes: string[];
    }> = [];
    const matchedJourneys: Array<{
      camis: string;
      name: string;
      closureDate: string;
      reopeningDate: string;
      days: number;
      codes: string[];
    }> = [];
    const restaurantRecords: Extract<Analysis, { ok: true }>["restaurantRecords"] = [];
    const repeatCodeCounts = new Map<string, { description: string; repeated: number; eligible: number }>();
    for (const events of eventsByRestaurant.values()) {
      events.sort((a, b) => a.date.getTime() - b.date.getTime());
      events.forEach((event, index) => {
        if (!isClosed(event.action)) return;
        closures.push(event);
        const reopening = events.slice(index + 1).find((candidate) => isReopened(candidate.action));
        let recordedDays: number | null = null;
        if (reopening) {
          const days = Math.round((reopening.date.getTime() - event.date.getTime()) / 86_400_000);
          if (days >= 0) {
            recordedDays = days;
            reopeningDays.push(days);
            matchedJourneys.push({
              camis: event.camis,
              name: event.dba,
              closureDate: event.date.toISOString().slice(0, 10),
              reopeningDate: reopening.date.toISOString().slice(0, 10),
              days,
              codes: [...event.codes.keys()].sort(),
            });
          }
        }
        benchmarkRecords.push({
          borough: event.borough,
          closureDate: event.date.toISOString().slice(0, 10),
          reopeningDays: recordedDays,
          codes: [...event.codes.keys()].sort(),
        });
        const laterClosures = events.slice(index + 1).filter((candidate) => isClosed(candidate.action));
        restaurantRecords.push({
          camis: event.camis,
          name: event.dba,
          borough: event.borough,
          closureDate: event.date.toISOString().slice(0, 10),
          reopeningDate: reopening ? reopening.date.toISOString().slice(0, 10) : null,
          reopeningDays: recordedDays,
          codes: [...event.codes.entries()].map(([code, description]) => ({ code, description: shorten(description, code) })).sort((a, b) => a.code.localeCompare(b.code)),
          laterClosureCount: laterClosures.length,
        });
        if (laterClosures.length) {
          const laterCodes = new Set(laterClosures.flatMap((closure) => [...closure.codes.keys()]));
          for (const [code, description] of event.codes) {
            const item = repeatCodeCounts.get(code) || { description: shorten(description, code), repeated: 0, eligible: 0 };
            item.eligible += 1;
            if (laterCodes.has(code)) item.repeated += 1;
            repeatCodeCounts.set(code, item);
          }
        }
      });
    }

    const codeCounts = new Map<string, { count: number; description: string }>();
    for (const closure of closures) {
      for (const [code, description] of closure.codes) {
        const current = codeCounts.get(code) || { count: 0, description };
        current.count += 1;
        if (!current.description && description) current.description = description;
        codeCounts.set(code, current);
      }
    }

    const topViolations = [...codeCounts.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([code, value]) => ({
        code,
        count: value.count,
        rate: (value.count / closures.length) * 100,
        shortDescription: shorten(value.description, code),
      }));

    const buckets = [
      { label: "0–3 days", min: 0, max: 3 },
      { label: "4–7 days", min: 4, max: 7 },
      { label: "8–14 days", min: 8, max: 14 },
      { label: "15–30 days", min: 15, max: 30 },
      { label: "31+ days", min: 31, max: Infinity },
    ];

    return {
      ok: true,
      closureCount: closures.length,
      reopenedCount: reopeningDays.length,
      reopeningRate: closures.length ? (reopeningDays.length / closures.length) * 100 : 0,
      medianDays: median(reopeningDays),
      fastReopeningRate: reopeningDays.length ? (reopeningDays.filter((days) => days <= 7).length / reopeningDays.length) * 100 : 0,
      topViolations,
      timelineBuckets: buckets.map((bucket) => ({
        label: bucket.label,
        count: reopeningDays.filter((days) => days >= bucket.min && days <= bucket.max).length,
      })),
      dateRange: `${start.getUTCFullYear()}–${now.getUTCFullYear()} records`,
      fetchedAt: now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/New_York" }),
      apiUrl,
      sampleJourneys: matchedJourneys.sort((a, b) => b.closureDate.localeCompare(a.closureDate)).slice(0, 8),
      benchmarkRecords,
      restaurantRecords: restaurantRecords.sort((a, b) => b.closureDate.localeCompare(a.closureDate)),
      repeatClosurePatterns: [...repeatCodeCounts.entries()]
        .filter(([, value]) => value.eligible >= 5)
        .map(([code, value]) => ({ code, description: value.description, repeatedCount: value.repeated, repeatRate: value.repeated / value.eligible * 100 }))
        .sort((a, b) => b.repeatedCount - a.repeatedCount)
        .slice(0, 6),
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "The source could not be reached.",
    };
  }
}
