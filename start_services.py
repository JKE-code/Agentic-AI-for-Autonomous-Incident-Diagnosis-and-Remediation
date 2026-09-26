import os
import sys
import time
import subprocess
import signal

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")

processes = []

def cleanup(sig=None, frame=None):
    print("\n[STOPPING ALL SERVICES] Shutting down AI engine, backend, and frontend...")
    for p in processes:
        try:
            p.terminate()
            p.wait(timeout=3)
        except Exception:
            try:
                p.kill()
            except Exception:
                pass
    sys.exit(0)

signal.signal(signal.SIGINT, cleanup)
signal.signal(signal.SIGTERM, cleanup)

def main():
    print("=" * 70)
    print("  LAUNCHING INCIDENT COMMAND CENTER (FULL SYSTEM INTEGRATION)")
    print("=" * 70)

    # 1. AI Service (Port 8001)
    print("[1/3] Starting LangGraph AI Service on http://localhost:8001 ...")
    ai_cmd = [sys.executable, "-m", "uvicorn", "ai.service:app", "--host", "0.0.0.0", "--port", "8001"]
    ai_proc = subprocess.Popen(ai_cmd, cwd=ROOT_DIR)
    processes.append(ai_proc)

    # 2. FastAPI Backend (Port 8000)
    print("[2/3] Starting FastAPI Integration Backend on http://localhost:8000 ...")
    backend_cmd = [sys.executable, "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
    backend_proc = subprocess.Popen(backend_cmd, cwd=ROOT_DIR)
    processes.append(backend_proc)

    time.sleep(2)

    # 3. React Vite Frontend (Port 5173)
    print("[3/3] Starting React Incident Command Console on http://localhost:5173 ...")
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    frontend_proc = subprocess.Popen([npm_cmd, "run", "dev"], cwd=FRONTEND_DIR)
    processes.append(frontend_proc)

    print("\n" + "=" * 70)
    print("  SYSTEM READY:")
    print("  - Frontend:   http://localhost:5173")
    print("  - Backend:    http://localhost:8000 (Docs: http://localhost:8000/docs)")
    print("  - AI Service: http://localhost:8001 (Docs: http://localhost:8001/docs)")
    print("=" * 70)
    print("Press Ctrl+C to shut down all services.\n")

    try:
        while True:
            time.sleep(1)
            for p in processes:
                if p.poll() is not None:
                    print(f"Warning: Process {p.args} exited with code {p.returncode}")
    except KeyboardInterrupt:
        cleanup()

if __name__ == "__main__":
    main()
