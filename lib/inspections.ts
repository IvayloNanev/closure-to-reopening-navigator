type InspectionRow = {
  camis: string;
  dba?: string;
  inspection_date: string;
  inspection_type?: string;
  action: string;
  violation_code?: string;
  violation_description?: string;
};

type Event = {
  camis: string;
  dba: string;
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
} | { ok: false; message: string };

const ENDPOINT = "https://data.cityofnewyork.us/resource/43nn-pn8j.json";
const CLOSED = "Establishment Closed by DOHMH.";
const REOPENED = "Establishment re-opened by DOHMH.";

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
    "$select": "camis,dba,inspection_date,inspection_type,action,violation_code,violation_description",
    "$where": `inspection_date >= '${startDate}T00:00:00.000' AND action in('${CLOSED}','${REOPENED}')`,
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
    const matchedJourneys: Array<{
      camis: string;
      name: string;
      closureDate: string;
      reopeningDate: string;
      days: number;
      codes: string[];
    }> = [];
    for (const events of eventsByRestaurant.values()) {
      events.sort((a, b) => a.date.getTime() - b.date.getTime());
      events.forEach((event, index) => {
        if (event.action !== CLOSED) return;
        closures.push(event);
        const reopening = events.slice(index + 1).find((candidate) => candidate.action === REOPENED);
        if (reopening) {
          const days = Math.round((reopening.date.getTime() - event.date.getTime()) / 86_400_000);
          if (days >= 0) {
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
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "The source could not be reached.",
    };
  }
}
