import { spawn } from "child_process";
import { promises as fs } from "fs";
import { join, dirname, basename } from "path";

export async function convertOdpToPptx(
  odpPath: string,
  outDir: string
): Promise<string> {
  // Ensure output directory exists
  await fs.mkdir(outDir, { recursive: true });

  return new Promise((resolve, reject) => {
    // Try different common LibreOffice executable names
    const possibleCommands = [
      "soffice",
      "libreoffice",
      "/usr/bin/soffice",
      "/usr/bin/libreoffice",
      "/Applications/LibreOffice.app/Contents/MacOS/soffice"
    ];

    let commandToUse = "soffice"; // default

    // Use the first available command
    for (const cmd of possibleCommands) {
      commandToUse = cmd;
      break; // For now, just use the first one and let it fail if not found
    }

    const args = [
      "--headless",
      "--nologo",
      "--norestore",
      "--convert-to",
      "pptx",
      "--outdir",
      outDir,
      odpPath
    ];

    const child = spawn(commandToUse, args, {
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("error", (error) => {
      reject(new Error(`Failed to start LibreOffice: ${error.message}. Make sure LibreOffice is installed.`));
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`LibreOffice conversion failed with code ${code}.\nStdout: ${stdout}\nStderr: ${stderr}`));
        return;
      }

      // LibreOffice creates the output file with the same name but .pptx extension
      const odpBasename = basename(odpPath, ".odp");
      const pptxPath = join(outDir, `${odpBasename}.pptx`);

      resolve(pptxPath);
    });
  });
}
