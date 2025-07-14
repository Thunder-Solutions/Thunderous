import { spawnSync } from 'child_process';

const [oldMajor, oldMinor] = process.env.npm_old_version.split('.');
const [newMajor, newMinor] = process.env.npm_new_version.split('.');
const type = oldMajor !== newMajor ? 'major' : oldMinor !== newMinor ? 'minor' : 'patch';
spawnSync('npm', ['version', type], { cwd: `${process.cwd()}/www` });
spawnSync('npm', ['version', type], { cwd: `${process.cwd()}/demo` });
spawnSync('git', ['add', '-A']);
