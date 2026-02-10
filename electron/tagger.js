/**
 * Preview tagger: 使用 WD v1.4 MOAT Tagger (ONNX) 为壁纸 preview 图打标签。
 * 模型目录需包含 model.onnx 和 selected_tags.csv。
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const require = createRequire(path.join(projectRoot, 'package.json'));

const PREVIEW_NAMES = ['preview.jpg', 'preview.png', 'preview.gif'];
const INPUT_SIZE = 448;
const DEFAULT_THRESHOLD = 0.35;

function getPreviewPath(wallpaperDir) {
  for (const name of PREVIEW_NAMES) {
    const p = path.join(wallpaperDir, name);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function parseSelectedTagsCsv(csvPath) {
  const text = fs.readFileSync(csvPath, 'utf8');
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const header = lines[0].toLowerCase();
  const nameIdx = header.split(',').indexOf('name');
  if (nameIdx === -1) return [];
  const tagNames = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    const name = cols[nameIdx];
    if (name) tagNames.push(name.trim());
  }
  return tagNames;
}

/**
 * 对单张图片运行 tagger，返回标签名数组。
 * @param {object} opts - { session, tagNames, imagePath, threshold }
 */
export async function tagImage(opts) {
  const sharp = require('sharp');
  const ort = require('onnxruntime-node');

  const { session, tagNames, imagePath, threshold = DEFAULT_THRESHOLD } = opts;

  const ext = path.extname(imagePath).toLowerCase();
  const isGif = ext === '.gif';

  // GIF 只取第一帧；其他格式直接读
  let pipeline = sharp(imagePath, isGif ? { animated: false } : undefined);

  // 与 ComfyUI-WD14-Tagger 一致：resize 保持比例后贴到白底 448x448，再 BGR + 0~255 float32
  const raw = await pipeline
    .resize(INPUT_SIZE, INPUT_SIZE, {
      fit: 'contain',
      position: 'center',
      background: { r: 255, g: 255, b: 255 },
    })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = raw;

  if (info.width !== INPUT_SIZE || info.height !== INPUT_SIZE) {
    throw new Error(`Unexpected image size after resize: ${info.width}x${info.height}`);
  }

  const channels = info.channels || 3;
  if (channels !== 3) {
    throw new Error(`Expected 3 channels (RGB), got ${channels}`);
  }

  const numPixels = INPUT_SIZE * INPUT_SIZE * 3;
  const float32 = new Float32Array(numPixels);

  // 确保从 Buffer 按字节读取（兼容不同环境）
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
  if (buf.length !== numPixels) {
    throw new Error(`Raw buffer length ${buf.length} != expected ${numPixels}`);
  }

  // 与 ComfyUI 一致：RGB -> BGR，数值保持 0~255 的 float32（不除 255）
  for (let i = 0; i < numPixels; i += 3) {
    float32[i] = buf[i + 2];     // B
    float32[i + 1] = buf[i + 1]; // G
    float32[i + 2] = buf[i];     // R
  }

  // 简单校验：整图均值过小则多半是黑图或读错
  let sum = 0;
  for (let i = 0; i < numPixels; i++) sum += float32[i];
  const mean = sum / numPixels;
  if (mean < 5) {
    throw new Error(`Image appears black or invalid (mean=${mean.toFixed(1)}). Path: ${imagePath}`);
  }

  // NHWC [1, 448, 448, 3]，与 ComfyUI expand_dims 一致
  const tensor = new ort.Tensor('float32', float32, [
    1,
    INPUT_SIZE,
    INPUT_SIZE,
    3,
  ]);

  const inputName = session.inputNames[0];
  const outputName = session.outputNames[0];

  const feeds = { [inputName]: tensor };

  const results = await session.run(feeds);
  const output = results[outputName];
  const probs = output.data ?? [];

  // 收集超过阈值的标签
  const tags = [];
  const len = Math.min(tagNames.length, probs.length);

  for (let i = 0; i < len; i++) {
    if (probs[i] >= threshold) {
      tags.push(tagNames[i]);
    }
  }

  return tags;
}

/**
 * 加载模型目录：验证 model.onnx 和 selected_tags.csv，返回 { session, tagNames }。
 */
export async function loadTaggerModel(modelDir) {
  const onnxPath = path.join(modelDir, 'model.onnx');
  const csvPath = path.join(modelDir, 'selected_tags.csv');
  if (!fs.existsSync(onnxPath)) throw new Error(`模型文件不存在: ${onnxPath}`);
  if (!fs.existsSync(csvPath)) throw new Error(`标签文件不存在: ${csvPath}`);

  const ort = require('onnxruntime-node');
  const session = await ort.InferenceSession.create(onnxPath, { graphOptimizationLevel: 'all' });
  const tagNames = parseSelectedTagsCsv(csvPath);
  if (tagNames.length === 0) throw new Error('selected_tags.csv 解析后无标签');
  return { session, tagNames };
}

/**
 * 为多个壁纸目录打标签，并写入各目录的 project.json 的 preview_tagger 字段。
 * @param {string} modelDir - 模型目录（含 model.onnx、selected_tags.csv）
 * @param {string[]} wallpaperPaths - 壁纸目录绝对路径列表
 * @param {function} onProgress - (current, total, name, error?) => void
 * @param {number} threshold - 置信度阈值
 */
export async function runTaggerOnWallpapers(modelDir, wallpaperPaths, onProgress, threshold = DEFAULT_THRESHOLD) {
  const { session, tagNames } = await loadTaggerModel(modelDir);
  const total = wallpaperPaths.length;
  const results = [];

  for (let i = 0; i < wallpaperPaths.length; i++) {
    const wpPath = wallpaperPaths[i];
    const name = path.basename(wpPath);
    let errMsg = null;
    try {
      const previewPath = getPreviewPath(wpPath);
      if (!previewPath) {
        errMsg = '无 preview.jpg/png/gif';
        onProgress(i + 1, total, name, errMsg);
        results.push({ path: wpPath, success: false, error: errMsg });
        continue;
      }
      const tags = await tagImage({ session, tagNames, imagePath: previewPath, threshold });
      const projectJsonPath = path.join(wpPath, 'project.json');
      let projectInfo = {};
      if (fs.existsSync(projectJsonPath)) {
        const content = fs.readFileSync(projectJsonPath, 'utf8');
        projectInfo = JSON.parse(content);
      }
      projectInfo.preview_tagger = tags;
      fs.writeFileSync(projectJsonPath, JSON.stringify(projectInfo, null, 2), 'utf8');
      onProgress(i + 1, total, name, null);
      results.push({ path: wpPath, success: true, tags });
    } catch (e) {
      errMsg = e.message || String(e);
      onProgress(i + 1, total, name, errMsg);
      results.push({ path: wpPath, success: false, error: errMsg });
    }
  }
  return results;
}

export { getPreviewPath, parseSelectedTagsCsv };
