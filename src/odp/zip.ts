import archiver from "archiver";
import { createWriteStream } from "fs";
import { promises as fs } from "fs";
import { join, relative } from "path";

export async function createOdpZip(
  srcDir: string,
  outputPath: string
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    const output = createWriteStream(outputPath);
    const archive = archiver("zip", {
      zlib: { level: 9 }
    });

    output.on("close", () => {
      resolve();
    });

    archive.on("error", (err) => {
      reject(err);
    });

    archive.pipe(output);

    // Add all files from srcDir
    await addDirectoryToArchive(archive, srcDir, srcDir);

    await archive.finalize();
  });
}

async function addDirectoryToArchive(
  archive: archiver.Archiver,
  baseDir: string,
  currentDir: string
): Promise<void> {
  const entries = await fs.readdir(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(currentDir, entry.name);
    const relativePath = relative(baseDir, fullPath);

    if (entry.isDirectory()) {
      await addDirectoryToArchive(archive, baseDir, fullPath);
    } else if (entry.isFile()) {
      archive.file(fullPath, { name: relativePath });
    }
  }
}
