import React from 'react';

export const ProductIdeationLab = React.lazy(() => import('../../modules/product-studio/ProductIdeationLab'));
export const GameAndMLWorkbench = React.lazy(() => import('../../modules/product-studio/GameAndMLWorkbench'));
export const WebAccountingRoadmap = React.lazy(() => import('../../modules/product-studio/WebAccountingRoadmap'));
export const ProductLaunchChecklist = React.lazy(() => import('../../modules/marketing-growth/components/ProductLaunchChecklist'));
export const BusinessHubPanel = React.lazy(() => import('../../components/business/BusinessHubPanel'));
export const GameAssetStudioPanel = React.lazy(() => import('../../modules/product-studio/components/GameAssetStudioPanel'));
export const VideoMakerRoot = React.lazy(() => import('../../modules/video-maker/ui/index'));
export const ZeroTouchLoopPanel = React.lazy(() => import('../../modules/product-studio/ZeroTouchLoopPanel'));
