/*
 * Packages the desktop app for Windows and Linux.
 *
 *   npm install && npm run build
 *
 * Staging keeps one source of truth: index.html is copied in from the repo
 * root rather than duplicated here.
 */

const packager = require('@electron/packager');
const ResEdit = require('resedit');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const STAGE = path.join(__dirname, 'build', 'stage');
const OUT = path.join(__dirname, 'build', 'out');
const DIST = path.join(__dirname, 'build', 'dist');

function stage() {
  fs.rmSync(STAGE, { recursive: true, force: true });
  fs.mkdirSync(STAGE, { recursive: true });

  fs.copyFileSync(path.join(ROOT, 'index.html'), path.join(STAGE, 'index.html'));
  fs.copyFileSync(path.join(__dirname, 'main.js'), path.join(STAGE, 'main.js'));

  const icon = path.join(__dirname, 'icon.png');
  if (fs.existsSync(icon)) fs.copyFileSync(icon, path.join(STAGE, 'icon.png'));

  // A trimmed manifest: the packaged app has no dependencies to declare.
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  fs.writeFileSync(path.join(STAGE, 'package.json'), JSON.stringify({
    name: pkg.name,
    productName: pkg.productName,
    version: pkg.version,
    description: pkg.description,
    main: 'main.js',
    author: pkg.author,
    license: pkg.license
  }, null, 2));
}

async function build() {
  stage();
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  const targets = [
    { platform: 'win32', arch: 'x64', label: 'windows-x64' },
    { platform: 'linux', arch: 'x64', label: 'linux-x64' }
  ];

  for (const target of targets) {
    const options = {
      dir: STAGE,
      out: OUT,
      platform: target.platform,
      arch: target.arch,
      overwrite: true,
      prune: true,
      appVersion: '1.0.0',
      appCopyright: 'MIT licensed',
      name: 'TRexRunner'
    };

    // packager's own icon support shells out to rcedit, which needs wine on
    // Linux. The Windows icon is patched in afterwards instead (pure JS), so
    // the build works on any host.
    if (target.platform === 'linux') {
      const pngIcon = path.join(__dirname, 'icon.png');
      if (fs.existsSync(pngIcon)) options.icon = pngIcon;
    }

    console.log(`packaging ${target.label} ...`);
    const [appPath] = await packager(options);
    console.log(`  -> ${appPath}`);

    if (target.platform === 'win32') {
      brandWindowsExe(path.join(appPath, 'TRexRunner.exe'));
    }

    const zipName = `TRexRunner-${target.label}.zip`;
    const zipPath = path.join(DIST, zipName);
    fs.rmSync(zipPath, { force: true });
    execFileSync('zip', ['-r', '-q', '-9', zipPath, path.basename(appPath)],
        { cwd: path.dirname(appPath) });
    const mb = (fs.statSync(zipPath).size / 1048576).toFixed(1);
    console.log(`  -> ${zipName} (${mb} MB)`);
  }
}

/**
 * Writes the icon and version metadata straight into the .exe's resource
 * section. Doing it in JavaScript avoids needing wine to run rcedit, so this
 * produces a properly branded Windows build from Linux or macOS too.
 */
function brandWindowsExe(exePath) {
  const icoPath = path.join(__dirname, 'icon.ico');
  if (!fs.existsSync(icoPath)) return;

  const exe = ResEdit.NtExecutable.from(fs.readFileSync(exePath));
  const res = ResEdit.NtExecutableResource.from(exe);

  const icon = ResEdit.Data.IconFile.from(fs.readFileSync(icoPath));
  ResEdit.Resource.IconGroupEntry.replaceIconsForResource(
      res.entries, 1, 1033, icon.icons.map(item => item.data));

  // Electron ships its own version block; overwrite it so Windows' file
  // properties say T-Rex Runner rather than Electron.
  const versionInfo = ResEdit.Resource.VersionInfo.fromEntries(res.entries)[0] ||
      ResEdit.Resource.VersionInfo.createEmpty();
  versionInfo.setFileVersion(1, 0, 0, 0);
  versionInfo.setProductVersion(1, 0, 0, 0);
  versionInfo.setStringValues({ lang: 1033, codepage: 1200 }, {
    ProductName: 'T-Rex Runner',
    FileDescription: 'T-Rex Runner - the offline dinosaur game',
    CompanyName: 'T-Rex Runner',
    LegalCopyright: 'MIT licensed',
    OriginalFilename: 'TRexRunner.exe',
    InternalName: 'TRexRunner',
    FileVersion: '1.0.0',
    ProductVersion: '1.0.0'
  });
  versionInfo.outputToResourceEntries(res.entries);

  res.outputResource(exe);
  fs.writeFileSync(exePath, Buffer.from(exe.generate()));
  console.log('  -> branded TRexRunner.exe (icon + version info)');
}

build().catch(err => {
  console.error(err);
  process.exit(1);
});
