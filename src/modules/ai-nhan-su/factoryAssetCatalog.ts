export type FactoryAssetKind = 'code' | 'package' | 'media' | 'document' | 'launch';
export type FactoryAssetState = 'new' | 'checked' | 'linked' | 'stored';

export interface FactoryAssetRecord {
  id: string;
  title: string;
  kind: FactoryAssetKind;
  state: FactoryAssetState;
  jobId: string;
  path: string;
  note: string;
}

export const FACTORY_ASSET_RECORDS: FactoryAssetRecord[] = [
  { id: 'asset-prd', title: 'Product PRD', kind: 'document', state: 'linked', jobId: 'fq-prd', path: 'factory/prd.md', note: 'Requirements, scope and success criteria.' },
  { id: 'asset-source', title: 'Source patch', kind: 'code', state: 'new', jobId: 'fq-prototype', path: 'factory/source.patch', note: 'Generated code changes for review.' },
  { id: 'asset-package', title: 'Build package', kind: 'package', state: 'checked', jobId: 'fq-qa', path: 'factory/build/', note: 'Package output and build summary.' },
  { id: 'asset-media', title: 'Media plan', kind: 'media', state: 'new', jobId: 'fq-launch', path: 'factory/media-plan.md', note: 'Video hooks, thumbnail prompts and storyboard.' },
  { id: 'asset-launch', title: 'Launch kit', kind: 'launch', state: 'linked', jobId: 'fq-launch', path: 'factory/launch-kit.md', note: 'Landing copy, listing text and ad hooks.' },
];

export function groupFactoryAssets(records: FactoryAssetRecord[] = FACTORY_ASSET_RECORDS) {
  return records.reduce<Record<FactoryAssetKind, FactoryAssetRecord[]>>((acc, record) => {
    acc[record.kind] = [...(acc[record.kind] || []), record];
    return acc;
  }, { code: [], package: [], media: [], document: [], launch: [] });
}

export function countFactoryAssets(records: FactoryAssetRecord[] = FACTORY_ASSET_RECORDS) {
  return records.length;
}
