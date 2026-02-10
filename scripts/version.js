#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = join(__dirname, '..', 'package.json');

function getCurrentVersion() {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  return packageJson.version;
}

function setVersion(newVersion) {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  const oldVersion = packageJson.version;
  packageJson.version = newVersion;
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf-8');
  console.log(`版本号已更新: ${oldVersion} -> ${newVersion}`);
}

const command = process.argv[2];
const versionArg = process.argv[3];

if (command === 'set' && versionArg) {
  // 验证版本号格式
  if (!/^\d+\.\d+\.\d+(-.*)?$/.test(versionArg)) {
    console.error('错误: 版本号格式不正确。请使用语义化版本格式，例如: 2.0.0');
    process.exit(1);
  }
  setVersion(versionArg);
} else if (command === 'current' || !command) {
  console.log(getCurrentVersion());
} else {
  console.log('用法:');
  console.log('  npm run version:set <version>  - 设置版本号（例如: 2.1.0）');
  console.log('  npm run version:current        - 查看当前版本号');
  process.exit(1);
}
