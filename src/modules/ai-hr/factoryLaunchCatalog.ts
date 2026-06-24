export type FactoryLaunchChannel = 'landing_page' | 'short_video' | 'store_listing' | 'ad_pack' | 'email' | 'social_post';
export type FactoryLaunchStatus = 'draft' | 'ready' | 'review' | 'scheduled' | 'published';

export interface FactoryLaunchAsset {
  id: string;
  channel: FactoryLaunchChannel;
  title: string;
  status: FactoryLaunchStatus;
  owner: string;
  deliverable: string;
}

export const FACTORY_LAUNCH_ASSETS: FactoryLaunchAsset[] = [
  { id: 'lp-main', channel: 'landing_page', title: 'Main landing page', status: 'draft', owner: 'Growth Automation', deliverable: 'Hero, CTA, feature blocks, pricing and FAQ' },
  { id: 'vid-short-01', channel: 'short_video', title: 'Short video script pack', status: 'draft', owner: 'Media Cell', deliverable: '15s, 30s and 60s video scripts' },
  { id: 'store-copy', channel: 'store_listing', title: 'Store listing copy', status: 'ready', owner: 'Growth Automation', deliverable: 'Title, description, keywords and screenshots checklist' },
  { id: 'ad-hooks', channel: 'ad_pack', title: 'Ad hook variants', status: 'review', owner: 'Monetization Analyst', deliverable: 'Audience angles, hooks, creative notes and UTM plan' },
  { id: 'social-pack', channel: 'social_post', title: 'Social launch posts', status: 'draft', owner: 'Growth Automation', deliverable: 'Facebook, TikTok and YouTube post drafts' },
];

export function getFactoryLaunchAssetsByChannel(channel: FactoryLaunchChannel, assets: FactoryLaunchAsset[] = FACTORY_LAUNCH_ASSETS) {
  return assets.filter((asset) => asset.channel === channel);
}

export function getFactoryLaunchReadiness(assets: FactoryLaunchAsset[] = FACTORY_LAUNCH_ASSETS) {
  const ready = assets.filter((asset) => asset.status === 'ready' || asset.status === 'scheduled' || asset.status === 'published').length;
  return { ready, total: assets.length, percent: assets.length ? Math.round((ready / assets.length) * 100) : 0 };
}
