import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const PUBLIC_DIR = path.resolve(process.cwd(), "public");
const INPUT_EXTENSIONS = new Set([".png", ".jpg", ".jpeg"]);

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return walk(fullPath);
      return [fullPath];
    }),
  );
  return files.flat();
}

async function run() {
  const allFiles = await walk(PUBLIC_DIR);
  const targets = allFiles.filter((filePath) => INPUT_EXTENSIONS.has(path.extname(filePath).toLowerCase()));

  let convertedCount = 0;

  for (const inputPath of targets) {
    const outputPath = inputPath.replace(/\.(png|jpe?g)$/i, ".webp");

    try {
      const inputStat = await fs.stat(inputPath);
      const outputStat = await fs.stat(outputPath).catch(() => null);
      if (outputStat && outputStat.mtimeMs >= inputStat.mtimeMs) continue;

      await sharp(inputPath).webp({ quality: 80 }).toFile(outputPath);
      convertedCount += 1;
    } catch (error) {
      console.error(`Falha ao converter ${inputPath}:`, error);
    }
  }

  console.log(`Conversão finalizada. Arquivos convertidos: ${convertedCount}`);
}

run().catch((error) => {
  console.error("Erro na conversão para WebP:", error);
  process.exit(1);
});
