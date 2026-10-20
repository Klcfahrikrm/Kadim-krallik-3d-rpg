@echo off
echo Starting Fantasy Quest 3D RPG Server...
start http://localhost:8080/
python -m http.server 8080
pause
