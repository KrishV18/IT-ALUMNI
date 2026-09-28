import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import os from "os";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Generate the yearbook PDF via Python, then stream it directly as a binary
 * response so it downloads correctly in both dev and production (Render).
 *
 * Writing to public/ won't work in production because Next.js only serves
 * static files that existed at build time. Streaming avoids that entirely.
 */
export async function GET() {
  const scriptPath = path.join(process.cwd(), "python_code_pdf.py");

  if (!fs.existsSync(scriptPath)) {
    return NextResponse.json(
      { error: "Python PDF generator script not found." },
      { status: 500 }
    );
  }

  // Write PDF to system temp dir (always writable on any platform)
  const outPath = path.join(os.tmpdir(), `it_yearbook_${Date.now()}.pdf`);

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

  // Stream the PDF bytes directly in the response
  const buffer = fs.readFileSync(outPath);

  // Clean up temp file after reading
  try { fs.unlinkSync(outPath); } catch { /* ignore */ }

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="IT_Connect_Student_Directory_2022-2026.pdf"`,
      "Content-Length": String(buffer.length),
    },
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
