import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '../../..');
const NODE_MODULES = path.join(ROOT, 'node_modules');

function parseVersion(ver: string): [number, number, number] {
  const clean = ver.trim().replace(/^[^\d]*/, '').split('-')[0];
  const parts = clean.split('.').map((n) => parseInt(n, 10) || 0);
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
}

function cmpVersion(a: string, b: string): number {
  const [aMaj, aMin, aPat] = parseVersion(a);
  const [bMaj, bMin, bPat] = parseVersion(b);
  if (aMaj !== bMaj) return aMaj - bMaj;
  if (aMin !== bMin) return aMin - bMin;
  return aPat - bPat;
}

function satisfiesBasicSemver(installed: string, range: string): boolean {
  const trimmed = range.trim();
  if (trimmed === '*' || trimmed === '') return true;
  if (trimmed.startsWith('^')) {
    const base = trimmed.slice(1);
    const [bMaj] = parseVersion(base);
    const [iMaj] = parseVersion(installed);
    if (bMaj > 0) {
      return iMaj === bMaj && cmpVersion(installed, base) >= 0;
    }
    return cmpVersion(installed, base) >= 0;
  }
  if (trimmed.startsWith('>=')) {
    return cmpVersion(installed, trimmed.slice(2)) >= 0;
  }
  return cmpVersion(installed, trimmed) === 0;
}

describe('React Navigation ABI & Peer Dependency Compatibility', () => {
  it('ensures every installed @react-navigation/* package is compatible with @react-navigation/native', () => {
    const navScopeDir = path.join(NODE_MODULES, '@react-navigation');
    const nativePkg = JSON.parse(
      fs.readFileSync(path.join(navScopeDir, 'native', 'package.json'), 'utf8')
    );
    const installedNativeVersion: string = nativePkg.version;

    const dirs = fs.readdirSync(navScopeDir);
    for (const dir of dirs) {
      const pkgPath = path.join(navScopeDir, dir, 'package.json');
      if (!fs.existsSync(pkgPath)) continue;
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const peerRange = pkg.peerDependencies?.['@react-navigation/native'];
      if (peerRange) {
        const isCompatible = satisfiesBasicSemver(installedNativeVersion, peerRange);
        expect({
          package: `@react-navigation/${dir}@${pkg.version}`,
          requiresNative: peerRange,
          installedNative: installedNativeVersion,
          isCompatible,
        }).toMatchObject({ isCompatible: true });
      }
    }
  });

  it('ensures MaterialTopTabNavigator uses the same useNavigationBuilder API exposed by @react-navigation/core', () => {
    const coreBuilderPath = path.join(
      NODE_MODULES,
      '@react-navigation',
      'core',
      'lib',
      'module',
      'useNavigationBuilder.js'
    );
    const topTabsPath = path.join(
      NODE_MODULES,
      '@react-navigation',
      'material-top-tabs',
      'lib',
      'module',
      'navigators',
      'createMaterialTopTabNavigator.js'
    );
    const bottomTabsPath = path.join(
      NODE_MODULES,
      '@react-navigation',
      'bottom-tabs',
      'lib',
      'module',
      'navigators',
      'createBottomTabNavigator.js'
    );

    const coreSource = fs.readFileSync(coreBuilderPath, 'utf8');
    const topTabsSource = fs.readFileSync(topTabsPath, 'utf8');
    const bottomTabsSource = fs.readFileSync(bottomTabsPath, 'utf8');

    const coreExposesRenderHelper = /\breturn\s*\{[\s\S]*\brender\b/.test(coreSource);
    const coreExposesNavigationContent = /\breturn\s*\{[\s\S]*\bNavigationContent\b/.test(coreSource);

    expect(coreExposesNavigationContent).toBe(true);
    if (!coreExposesRenderHelper) {
      expect(topTabsSource).toContain('NavigationContent');
      expect(topTabsSource).not.toMatch(/\}\s*=\s*useNavigationBuilder[\s\S]*\brender\b/);
      expect(bottomTabsSource).toContain('NavigationContent');
    }
  });
});
