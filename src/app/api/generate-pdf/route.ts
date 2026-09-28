import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import os from "os";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// ── In-memory job store (single server instance) ──────────────────────────
type JobStatus = "running" | "done" | "error";
interface Job {
  status: JobStatus;
  filePath?: string;
  error?: string;
  startedAt: number;
}

const jobs = new Map<string, Job>();

// Clean up jobs older than 15 minutes
function pruneJobs() {
  const now = Date.now();
  for (const [id, job] of jobs.entries()) {
    if (now - job.startedAt > 15 * 60 * 1000) {
      if (job.filePath) {
        try { fs.unlinkSync(job.filePath); } catch { /* ignore */ }
      }
      jobs.delete(id);
    }
  }
}

// ── GET /api/generate-pdf?action=start   → { jobId }
// ── GET /api/generate-pdf?action=status&jobId=xxx  → { status, error? }
// ── GET /api/generate-pdf?action=download&jobId=xxx → binary PDF
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") ?? "start";

  pruneJobs();

  // ── START ──────────────────────────────────────────────────────────
  if (action === "start") {
    const scriptPath = path.join(process.cwd(), "python_code_pdf.py");
    if (!fs.existsSync(scriptPath)) {
      return NextResponse.json({ error: "Python script not found." }, { status: 500 });
    }

    const jobId = crypto.randomUUID();
    const outPath = path.join(os.tmpdir(), `it_yearbook_${jobId}.pdf`);

    // Register job as running
    jobs.set(jobId, { status: "running", startedAt: Date.now() });

    // Run Python generator in the background (don't await)
    runPythonGenerator(scriptPath, outPath)
      .then(() => {
        jobs.set(jobId, { status: "done", filePath: outPath, startedAt: Date.now() });
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[pdf-gen] Failed:", msg);
        jobs.set(jobId, { status: "error", error: msg, startedAt: Date.now() });
      });

    return NextResponse.json({ jobId });
  }

  // ── STATUS ─────────────────────────────────────────────────────────
  if (action === "status") {
    const jobId = searchParams.get("jobId");
    if (!jobId) return NextResponse.json({ error: "Missing jobId" }, { status: 400 });

    const job = jobs.get(jobId);
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    if (job.status === "error") {
      return NextResponse.json({ status: "error", error: job.error });
    }
    return NextResponse.json({ status: job.status });
  }

  // ── DOWNLOAD ───────────────────────────────────────────────────────
  if (action === "download") {
    const jobId = searchParams.get("jobId");
    if (!jobId) return NextResponse.json({ error: "Missing jobId" }, { status: 400 });

    const job = jobs.get(jobId);
    if (!job) return NextResponse.json({ error: "Job not found or expired" }, { status: 404 });
    if (job.status !== "done" || !job.filePath) {
      return NextResponse.json({ error: "PDF not ready yet" }, { status: 425 });
    }
    if (!fs.existsSync(job.filePath)) {
      return NextResponse.json({ error: "PDF file missing" }, { status: 404 });
    }

    const buffer = fs.readFileSync(job.filePath);

    // Clean up
    try { fs.unlinkSync(job.filePath); } catch { /* ignore */ }
    jobs.delete(jobId);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="IT_Connect_Student_Directory_2022-2026.pdf"`,
        "Content-Length": String(buffer.length),
      },
    });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

// ── Python runner ──────────────────────────────────────────────────────────
async function runPythonGenerator(scriptPath: string, outPath: string): Promise<void> {
  const args = [scriptPath, "--master", "sheets", "--out", outPath];

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

  await runChain(PYTHON_CANDIDATES);
}
