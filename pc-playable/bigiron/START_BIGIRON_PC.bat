@echo off
cd /d "%~dp0"
start "Big Iron PC" /min node server.cjs
start "" "http://127.0.0.1:4173/"
