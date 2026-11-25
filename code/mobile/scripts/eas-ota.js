const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const branch = process.argv[2] || 'preview';
const customMessage = process.argv.slice(3).join(' ').trim();

const easConfigPath = path.join(__dirname, '..', 'eas.json');
const easConfig = JSON.parse(fs.readFileSync(easConfigPath, 'utf8'));
const profileEnv = easConfig?.build?.[branch]?.env || {};

const mergedEnv = {
  ...process.env,
  ...profileEnv,
};

const isWin = process.platform === 'win32';
const validEnvs = new Set(['development', 'preview', 'production']);
const easEnv = validEnvs.has(branch) ? branch : 'preview';
const args = [
  'eas-cli',
  'update',
  '--branch',
  branch,
  '--environment',
  easEnv,
  '--clear-cache',
];
if (customMessage) {
  const safeMsg = isWin
    ? `"${customMessage.replace(/"/g, '\\"')}"`
    : customMessage;
  args.push('--message', safeMsg);
} else {
  args.push('--auto');
}

const result = spawnSync('npx', args, {
  stdio: 'inherit',
  shell: isWin,
  env: mergedEnv,
  cwd: path.join(__dirname, '..'),
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
