const FB_API = 'https://graph.facebook.com/v19.0';

type FacebookConfig = {
  accessToken: string;
  pageId: string;
};

type FacebookApiError = {
  error?: { message?: string };
};

type FacebookPageResponse = FacebookApiError & {
  id?: string;
  name?: string;
  fan_count?: number;
};

type FacebookInsightValue = { value?: number | Record<string, number> };
type FacebookInsight = { name?: string; values?: FacebookInsightValue[] };
type FacebookInsightsResponse = FacebookApiError & { data?: FacebookInsight[] };

export type FacebookConnectionResult =
  | { connected: true; pageName: string; pageId: string; fanCount: number }
  | { connected: false; error: string };

export type FacebookInsightsResult =
  | { success: true; data: { impressions: number; reach: number; engagement: number } }
  | { success: false; error: string };

export type FacebookPostDraft = {
  success: true;
  mode: 'draft_only';
  message: string;
  link: string;
  note: string;
};

function cfg(): FacebookConfig {
  return {
    accessToken: process.env.FACEBOOK_PAGE_ACCESS_TOKEN || '',
    pageId: process.env.FACEBOOK_PAGE_ID || '',
  };
}

function errorMessage(payload: FacebookApiError, fallback: string) {
  return payload.error?.message || fallback;
}

function numericInsightValue(value: FacebookInsightValue | undefined): number {
  if (!value) return 0;
  if (typeof value.value === 'number') return value.value;
  if (value.value && typeof value.value === 'object') {
    return Object.values(value.value).reduce((sum, item) => sum + Number(item || 0), 0);
  }
  return 0;
}

export async function testFacebookConnection(): Promise<FacebookConnectionResult> {
  const { accessToken, pageId } = cfg();
  if (!accessToken || !pageId) {
    return { connected: false, error: 'FACEBOOK_PAGE_ACCESS_TOKEN hoặc FACEBOOK_PAGE_ID chưa cấu hình' };
  }

  try {
    const response = await fetch(`${FB_API}/${pageId}?fields=id,name,fan_count`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await response.json() as FacebookPageResponse;
    if (data.error) return { connected: false, error: errorMessage(data, 'Facebook connection failed') };
    return { connected: true, pageName: data.name || 'Facebook Page', pageId: data.id || pageId, fanCount: Number(data.fan_count || 0) };
  } catch (err) {
    return { connected: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function getFacebookPageInsights(): Promise<FacebookInsightsResult> {
  const { accessToken, pageId } = cfg();
  if (!accessToken || !pageId) return { success: false, error: 'Facebook env chưa cấu hình' };

  try {
    const metrics = 'page_impressions,page_reach,page_post_engagements';
    const response = await fetch(`${FB_API}/${pageId}/insights?metric=${encodeURIComponent(metrics)}&period=day`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await response.json() as FacebookInsightsResponse;
    if (data.error) return { success: false, error: errorMessage(data, 'Facebook insights failed') };

    const get = (name: string) => {
      const metric = data.data?.find((item) => item.name === name);
      return numericInsightValue(metric?.values?.slice(-1)[0]);
    };

    return {
      success: true,
      data: {
        impressions: get('page_impressions'),
        reach: get('page_reach'),
        engagement: get('page_post_engagements'),
      },
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function prepareFacebookPost(message: string, link?: string): Promise<FacebookPostDraft> {
  return {
    success: true,
    mode: 'draft_only',
    message,
    link: link || '',
    note: 'Draft prepared. Direct posting is intentionally gated; use Facebook Page UI or enable a reviewed server action before production posting.',
  };
}
