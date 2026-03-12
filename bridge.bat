@echo off
setlocal

if "%PORT%"=="" set PORT=8080
if "%LOG_DIR%"=="" set LOG_DIR=bridge-logs

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0bridge.ps1"
