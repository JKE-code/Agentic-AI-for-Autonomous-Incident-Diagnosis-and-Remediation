@echo off
echo Starting Incident Remediation Backend on http://localhost:8000 ...
python -m uvicorn backend.main:app --reload --port 8000
pause
