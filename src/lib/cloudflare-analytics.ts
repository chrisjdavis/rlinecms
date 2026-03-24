/**
 * Uses the native fetch API (Node.js 18+ required)
 */

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;

const CLOUDFLARE_GRAPHQL_ENDPOINT = 'https://api.cloudflare.com/client/v4/graphql';

if (!CLOUDFLARE_API_TOKEN) {
  throw new Error('CLOUDFLARE_API_TOKEN is not set in the environment variables.');
}
if (!CLOUDFLARE_ZONE_ID) {
  throw new Error('CLOUDFLARE_ZONE_ID is not set in the environment variables.');
}

export async function getCloudflareAnalytics() {
  // Calculate yesterday and today in ISO8601 datetime format (midnight UTC)
  const today = new Date();
  const yyyy = today.getUTCFullYear();
  const mm = String(today.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(today.getUTCDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}T00:00:00Z`;
  const yesterday = new Date(today);
  yesterday.setUTCDate(today.getUTCDate() - 1);
  const yyyyY = yesterday.getUTCFullYear();
  const mmY = String(yesterday.getUTCMonth() + 1).padStart(2, '0');
  const ddY = String(yesterday.getUTCDate()).padStart(2, '0');
  const yesterdayStr = `${yyyyY}-${mmY}-${ddY}T00:00:00Z`;

  // Query for main analytics (requests, visits, bandwidth)
  const mainQuery = `
    query {
      viewer {
        zones(filter: {zoneTag: \"${CLOUDFLARE_ZONE_ID}\"}) {
          httpRequestsAdaptiveGroups(limit: 1, filter: {datetime_geq: \"${yesterdayStr}\", datetime_lt: \"${todayStr}\"}) {
            sum {
              visits
              edgeResponseBytes
            }
            count
          }
        }
      }
    }
  `;

  // Fetch main analytics
  const mainResponse = await fetch(CLOUDFLARE_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
    },
    body: JSON.stringify({ query: mainQuery }),
  });

  if (!mainResponse.ok) {
    console.error('Cloudflare API error (main):', mainResponse.status, mainResponse.statusText);
    throw new Error(`Cloudflare API error (main): ${mainResponse.statusText}`);
  }

  const mainJson = (await mainResponse.json()) as unknown;
  const { data: mainData, errors: mainErrors } = mainJson as { data?: unknown; errors?: unknown };
  if (mainErrors) {
    console.error('Cloudflare API GraphQL error (main):', JSON.stringify(mainErrors));
    throw new Error(`Cloudflare API GraphQL error (main): ${JSON.stringify(mainErrors)}`);
  }

  // Type guard for mainData
  function hasViewer(obj: unknown): obj is { viewer: { zones?: Array<{ httpRequestsAdaptiveGroups?: Array<{ sum?: { visits?: number; edgeResponseBytes?: number }; count?: number }> }> } } {
    return typeof obj === 'object' && obj !== null && 'viewer' in obj;
  }

  let stats = null;
  if (hasViewer(mainData)) {
    stats = mainData.viewer.zones?.[0]?.httpRequestsAdaptiveGroups?.[0];
  }

  // Return a normalized object for the dashboard
  return {
    requests: stats?.count ?? null,
    bytes: stats?.sum?.edgeResponseBytes ?? null,
    uniqueVisitors: stats?.sum?.visits ?? null,
  };
} 