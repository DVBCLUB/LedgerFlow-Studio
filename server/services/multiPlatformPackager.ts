/**
 * multiPlatformPackager.ts
 * ============================================================
 * 1-CLICK MULTI-PLATFORM PACKAGING & DEPLOYMENT ENGINE
 *
 * Tự động đóng gói và xuất bản sản phẩm cho cả 3 nền tảng:
 * 1. Windows PC Desktop (.exe Installer với Electron/NSIS).
 * 2. Mobile App Android (.apk / .aab với Capacitor).
 * 3. SaaS Web Cloud (Vite production bundle & Cloudflare/Vercel).
 */

export interface PackagingTargetConfig {
  appName: string;
  version: string;
  targets: Array<'windows_exe' | 'android_apk' | 'saas_web'>;
  includeAutoUpdater?: boolean;
}

export interface PackagingBuildManifest {
  buildId: string;
  appName: string;
  version: string;
  targets: Array<{
    target: 'windows_exe' | 'android_apk' | 'saas_web';
    outputArtifactName: string;
    buildCommands: string[];
    status: 'configured' | 'ready_to_build';
    estimatedBuildTimeSec: number;
  }>;
  automatedBatchScript: string;
  generatedAt: string;
}

export function generatePackagingManifest(config: PackagingTargetConfig): PackagingBuildManifest {
  const buildId = `pkg_${Date.now()}`;
  const targets = config.targets.map((t) => {
    if (t === 'windows_exe') {
      return {
        target: 'windows_exe' as const,
        outputArtifactName: `${config.appName}-Setup-${config.version}.exe`,
        buildCommands: [
          'npm run prepare:icons',
          'npm run check:desktop',
          'npx electron-builder --win nsis --x64',
        ],
        status: 'ready_to_build' as const,
        estimatedBuildTimeSec: 45,
      };
    }

    if (t === 'android_apk') {
      return {
        target: 'android_apk' as const,
        outputArtifactName: `${config.appName}-release-${config.version}.apk`,
        buildCommands: [
          'npm run build',
          'npx cap sync android',
          'cd android && gradlew assembleRelease',
        ],
        status: 'ready_to_build' as const,
        estimatedBuildTimeSec: 60,
      };
    }

    return {
      target: 'saas_web' as const,
      outputArtifactName: 'dist-web-production.zip',
      buildCommands: [
        'npm run build',
        'npx wrangler pages deploy dist --project-name=ledgerflow-studio',
      ],
      status: 'ready_to_build' as const,
      estimatedBuildTimeSec: 25,
    };
  });

  const automatedBatchScript = `@echo off
REM ============================================================
REM LedgerFlow Studio 1-Click Multi-Platform Auto Packager
REM App: ${config.appName} v${config.version}
REM ============================================================
echo [1/3] Dong goi Ban Web SaaS...
call npm run build

echo [2/3] Dong goi Bo cai Windows .EXE...
call npm run prepare:icons
call npx electron-builder --win --x64

echo [3/3] Dong goi App Android .APK...
call npx cap sync android

echo Hoan thanh tat ca ban dong goi!
pause
`;

  return {
    buildId,
    appName: config.appName,
    version: config.version,
    targets,
    automatedBatchScript,
    generatedAt: new Date().toISOString(),
  };
}
