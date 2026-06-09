# LedgerFlow Hub - Simulation Model Map

Tai lieu nay la ban do cac module mo phong / hoc tap / nghien cuu trong phan mem. Khi them module moi, hay cap nhat file src/data/simulationRegistry.ts truoc, sau do build se tu kiem tra.

## Nhom chay offline day du

Cac module nay uu tien chay duoc khi khong co internet:

- SoloFounderBusiness
- WebAccountingRoadmap
- DataScienceEngineering
- CustomDataWorkbench
- AIEcosystemArchitecture
- GameAndMLWorkbench
- GuerrillaProductHub
- AccountingVietnam
- DeployBusiness
- CommandCenter
- AdvisoryBoardReport
- InternalAuditWorkspace
- MarketingSuite
- MarketingFunnelLab
- LeadScoringEngine
- ZaloMarketingHub
- CustomerLTVDashboard
- PricingStrategyLab
- NPSReviewManager
- AffiliateReferralHub

## Nhom chay offline mot phan

Cac module nay co giao dien, du lieu mau, cau hinh, hoac logic local; nhung mot so chuc nang can internet/API:

- PromptPlayground: can API/internet neu goi AI generation.
- GeminiPlayground: can Gemini API/internet neu goi AI.
- MLApplied: mot so AI/API feature can internet.
- MarketSurveySimulator: fallback mo phong chay duoc, grounded/live research can internet.
- GoogleKeywordStrategy: UI va planning local, keyword/live research co the can internet.
- PythonSandbox: phu thuoc runtime thuc thi.
- OutboundSalesHub: email/external outreach can internet.
- AdvancedAIEngine: UI local, AI generation can internet.

## Quy tac bat buoc khi them mo hinh moi

1. Tao component trong src/components.
2. Them lazy import trong src/App.tsx.
3. Them route/tab key trong App.tsx.
4. Them entry vao src/data/simulationRegistry.ts.
5. Chay npm run check:simulations.
6. Chay npm run build.
7. Chay npm run desktop:dev de bam thu module.

## Neu build bi chan

Neu check bao loi Missing critical simulation component, nghia la registry dang co module nhung file component khong ton tai.

Neu check bao loi App.tsx does not lazy-load, nghia la component co ton tai nhung chua duoc import trong App.tsx.

Neu check bao loi route/tab key, nghia la registry route va router/tab trong App.tsx bi lech nhau.
