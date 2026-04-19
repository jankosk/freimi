const API_URL = "https://api.digitransit.fi/routing/v2/hsl/gtfs/v1";
const STOP_ID = "HSL:1452602"; // Puotila

const QUERY = `{
  stop(id: "${STOP_ID}") {
    name
    vehicleMode
    stoptimesWithoutPatterns(numberOfDepartures: 8) {
      scheduledArrival
      realtimeArrival
      arrivalDelay
      scheduledDeparture
      realtimeDeparture
      departureDelay
      realtime
      realtimeState
      serviceDay
      headsign
    }
  }
}`;

export type VehicleMode =
  | "BUS"
  | "TRAM"
  | "SUBWAY"
  | "RAIL"

export interface Departure {
  headsign: string;
  time: string; // "HH:MM"
  realtime: boolean;
}

export interface StopDepartures {
  stopName: string;
  vehicleMode: VehicleMode;
  departures: Departure[];
}

interface GraphqlStoptime {
  scheduledDeparture: number;
  realtimeDeparture: number;
  realtime: boolean;
  serviceDay: number;
  headsign: string;
}

interface GraphqlResponse {
  data?: {
    stop?: {
      name: string;
      vehicleMode: VehicleMode;
      stoptimesWithoutPatterns: GraphqlStoptime[];
    };
  };
  errors?: Array<{ message: string }>;
}

export async function fetchDepartures(): Promise<StopDepartures> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const key = process.env.DIGITRANSIT_SUBSCRIPTION_KEY;
  if (key) headers["digitransit-subscription-key"] = key;

  const res = await fetch(API_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ query: QUERY }),
  });

  if (!res.ok) {
    throw new Error(`Digitransit API error: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as GraphqlResponse;

  if (json.errors?.length) {
    throw new Error(`Digitransit GraphQL error: ${json.errors[0].message}`);
  }

  const stop = json.data?.stop;
  if (!stop) {
    throw new Error(`Stop ${STOP_ID} not found`);
  }

  const departures: Departure[] = stop.stoptimesWithoutPatterns.map((s) => {
    const seconds = s.realtime ? s.realtimeDeparture : s.scheduledDeparture;
    const date = new Date((s.serviceDay + seconds) * 1000);
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    return {
      headsign: s.headsign,
      time: `${hh}:${mm}`,
      realtime: s.realtime,
    };
  });

  return {
    stopName: stop.name,
    vehicleMode: stop.vehicleMode,
    departures,
  };
}
