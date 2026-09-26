@echo off
echo ========================================================
echo Starting Streamlit Incident Remediation Command Center
echo Port: 8501
echo ========================================================
python -m streamlit run streamlit_app.py --server.port 8501 --server.headless true
pause
