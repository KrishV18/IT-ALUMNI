import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Generate the yearbook PDF via Python, save it to public/downloads/,
 * and return a JSON response with the download URL.
 *
 * This two-step approach avoids the Next.js dev server proxy dropping
 * large binary responses (which caused "Failed to fetch" even though
 * the handler returned 200).
 */
export async function GET() {
  const scriptPath = path.join(process.cwd(), "python_code_pdf.py");

  if (!fs.existsSync(scriptPath)) {
    return NextResponse.json(
      { error: "Python PDF generator script not found." },
      { status: 500 }
    );
  }

  // Ensure the downloads directory exists under public/
  const downloadsDir = path.join(process.cwd(), "public", "downloads");
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
  }

  // Clean up any old generated PDFs (keep the folder tidy)
  try {
    for (const f of fs.readdirSync(downloadsDir)) {
      if (f.startsWith("it_yearbook_") && f.endsWith(".pdf")) {
        const fPath = path.join(downloadsDir, f);
        const stat = fs.statSync(fPath);
        // Remove files older than 10 minutes
        if (Date.now() - stat.mtimeMs > 10 * 60 * 1000) {
          fs.unlinkSync(fPath);
        }
      }
    }
  } catch { /* ignore cleanup errors */ }

  const fileName = `it_yearbook_${Date.now()}.pdf`;
  const outPath = path.join(downloadsDir, fileName);

  // ── Run the Python generator ──────────────────────────────────────
  const genError = await runPythonGenerator(scriptPath, outPath);
  if (genError) {
    console.error("PDF generation failed:", genError);
    return NextResponse.json(
      {
        error: "PDF generation failed. Make sure Python 3, reportlab, and Pillow are installed.",
        detail: genError,
      },
      { status: 500 }
    );
  }

  // Verify the file was created
  if (!fs.existsSync(outPath)) {
    return NextResponse.json(
      { error: "PDF file was not created." },
      { status: 500 }
    );
  }

  const stat = fs.statSync(outPath);
  const downloadUrl = `/downloads/${fileName}`;

  return NextResponse.json({
    ok: true,
    url: downloadUrl,
    fileName,
    sizeBytes: stat.size,
    sizeMB: (stat.size / (1024 * 1024)).toFixed(2),
  });
}

// ── Python runner ─────────────────────────────────────────────────────
async function runPythonGenerator(scriptPath: string, outPath: string): Promise<string | null> {
  const args = [
    scriptPath,
    "--master", "sheets",
    "--out", outPath,
  ];

  const PYTHON_CANDIDATES: Array<[string, string[]]> = [
    [String.raw`C:\Users\user\AppData\Local\Programs\Python\Python311\python.exe`, []],
    ["py", ["-3.11"]],
    ["py", []],
    ["python", []],
    ["python3", []],
  ];

  const tryRun = (cmd: string, prefixArgs: string[] = []) =>
    new Promise<void>((res, rej) => {
      const proc = spawn(cmd, [...prefixArgs, ...args], {
        cwd: process.cwd(),
        stdio: ["ignore", "pipe", "pipe"],
        env: {
          ...process.env,
          PYTHONPATH: path.join(process.cwd(), "python_libs"),
        },
      });

      let stderr = "";
      proc.stderr?.on("data", (d) => {
        stderr += d.toString();
        console.log("[pdf-gen]", d.toString().trimEnd());
      });
      proc.stdout?.on("data", (d) => {
        console.log("[pdf-gen]", d.toString().trimEnd());
      });

      proc.on("close", (code) => {
        if (code === 0) res();
        else rej(new Error(`Process exited ${code}. stderr:\n${stderr}`));
      });
      proc.on("error", rej);
    });

  const runChain = (candidates: Array<[string, string[]]>): Promise<void> => {
    const [[cmd, prefix], ...rest] = candidates;
    return tryRun(cmd, prefix).catch((err) =>
      rest.length > 0 ? runChain(rest) : Promise.reject(err)
    );
  };

  try {
    await runChain(PYTHON_CANDIDATES);
    return null;
  } catch (err: unknown) {
    return err instanceof Error ? err.message : String(err);
  }
}
