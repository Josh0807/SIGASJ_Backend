@echo off
set "PATH=C:\nvm4w\nodejs;C:\Users\joshd\AppData\Local\nvm;%PATH%"
cd /d "%~dp0"
npm.cmd run start:dev
