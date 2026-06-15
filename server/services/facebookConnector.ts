// @ts-nocheck
const FB_API = 'https://graph.facebook.com/v19.0';

function cfg() {
  return {
    accessToken: process.env.FACEBOOK_PAGE_ACCESS_TOKEN || '',
    pageId: process.env.FACEBOOK_PAGE_ID || '',
  };
}

export async function testFacebookConnection() {
  const { accessToken, pageId } = cfg();
  if (!accessToken || !pageId) {
    return { connected: false, error: 'FACEBOOK_PAGE_ACCESS_TOKEN hoặc FACEBOOK_PAGE_ID chưa cấu hình' };
  }
  try {
    const r = await fetch(`${FB_API}/${pageId}?fields=id,name,fan_count`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const d = await r.json();
    if (d.error) return { connected: false, error: d.error.message };
    return { connected: true, pageName: d.name, pageId: d.id, fanCount: d.fan_count || 0 };
  } catch (err) {
    return { connected: false, error: String(err) };
  }
}

export async function getFacebookPageInsights() {
  const { accessToken, pageId } = cfg();
  if (!accessToken || !pageId) return { success: false, error: 'Facebook env chưa cấu hình' };
  try {
    const metrics = 'page_impressions,page_reach,page_post_engagements';
    const r = await fetch(`${FB_API}/${pageId}/insights?metric=${encodeURIComponent(metrics)}&period=day`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const d = await r.json();
    if (d.error) return { success: false, error: d.error.message };
    const get = (name: string) => d.data?.find((x: any) => x.name === name)?.values?.slice(-1)[0]?.value || 0;
    return { success: true, data: { impressions: get('page_impressions'), reach: get('page_reach'), engagement: get('page_post_engagements') } };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function prepareFacebookPost(message: string, link?: string) {
  return {
    success: true,
    mode: 'draft_only',
    message,
    link: link || '',
    note: 'Draft prepared. Direct posting is intentionally gated; use Facebook Page UI or enable a reviewed server action before production posting.',
  };
}
