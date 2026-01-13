@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo Longin charakter AI - Web Installer Launcher
echo ===================================================
echo AUTO-REPAIR: Instalátor s autonomním samoopravným mechanismem
echo.

:: Set variables
set "CURRENT_DIR=%~dp0"
set "INSTALL_HTML=%CURRENT_DIR%install.html"
set "REPAIR_LOG=%TEMP%\candy-ai-repair.log"

:: Initialize repair log
echo [%DATE% %TIME%] Auto-repair system initialized > "%REPAIR_LOG%"

:: Check if install.html exists with auto-repair
if not exist "%INSTALL_HTML%" (
    echo AUTO-REPAIR: install.html nebyl nalezen, pokusím se o opravu...
    echo [%DATE% %TIME%] Attempting to repair missing install.html >> "%REPAIR_LOG%"
    
    :: Try to download install.html from GitHub
    echo Stahuji install.html z GitHub...
    
    powershell -Command "& {try { Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/candy-ai/candy-ai-clone/main/install.html' -OutFile '%INSTALL_HTML%'; Write-Output 'SUCCESS' } catch { Write-Output 'FAILED' }}" > "%TEMP%\download_result.txt"
    
    set /p DOWNLOAD_RESULT=<"%TEMP%\download_result.txt"
    
    if "%DOWNLOAD_RESULT%"=="SUCCESS" (
        echo AUTO-REPAIR: install.html byl úspěšně stažen a opraven.
        echo [%DATE% %TIME%] Successfully repaired missing install.html >> "%REPAIR_LOG%"
    ) else (
        echo ERROR: install.html nebyl nalezen a nepodařilo se ho stáhnout.
        echo Ujistěte se, že se soubor web-install.bat nachází ve stejném adresáři jako install.html.
        echo.
        echo [%DATE% %TIME%] Failed to repair missing install.html >> "%REPAIR_LOG%"
        echo Stiskněte libovolnou klávesu pro ukončení...
        pause > nul
        exit /b 1
    )
)

echo Spouštím webový instalátor Candy AI Clone...
echo.

:: Check for Node.js with auto-repair
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo AUTO-REPAIR: Node.js není nainstalován, pokusím se o automatickou instalaci...
    echo [%DATE% %TIME%] Attempting to install Node.js >> "%REPAIR_LOG%"
    
    :: Try to download and install Node.js silently
    set "NODE_INSTALLER=%TEMP%\node_installer.msi"
    set "NODE_URL=https://nodejs.org/dist/v16.15.0/node-v16.15.0-x64.msi"
    
    echo Stahuji Node.js z %NODE_URL%...
    powershell -Command "& {try { Invoke-WebRequest -Uri '%NODE_URL%' -OutFile '%NODE_INSTALLER%'; Write-Output 'SUCCESS' } catch { Write-Output 'FAILED' }}" > "%TEMP%\download_node_result.txt"
    
    set /p DOWNLOAD_NODE_RESULT=<"%TEMP%\download_node_result.txt"
    
    if "%DOWNLOAD_NODE_RESULT%"=="SUCCESS" (
        echo Node.js stažen, instaluji...
        echo [%DATE% %TIME%] Installing Node.js >> "%REPAIR_LOG%"
        
        start /wait msiexec /i "%NODE_INSTALLER%" /quiet /norestart
        
        :: Check if installation was successful
        where node >nul 2>nul
        if %ERRORLEVEL% NEQ 0 (
            echo AUTO-REPAIR: Nepodařilo se nainstalovat Node.js, pokračuji v základním režimu.
            echo [%DATE% %TIME%] Failed to install Node.js >> "%REPAIR_LOG%"
            echo Pro plnou funkcionalitu instalátoru je vyžadován Node.js.
            echo Pokračuji v základním režimu...
            
            :: Basic mode - just open HTML in browser
            echo Otevírám instalátor v prohlížeči...
            start "" "%INSTALL_HTML%"
        ) else (
            echo AUTO-REPAIR: Node.js byl úspěšně nainstalován!
            echo [%DATE% %TIME%] Successfully installed Node.js >> "%REPAIR_LOG%"
            goto start_server
        )
    ) else (
        echo AUTO-REPAIR: Nepodařilo se stáhnout Node.js, pokračuji v základním režimu.
        echo [%DATE% %TIME%] Failed to download Node.js >> "%REPAIR_LOG%"
        echo Pro plnou funkcionalitu instalátoru je vyžadován Node.js.
        echo Pokračuji v základním režimu...
        
        :: Basic mode - just open HTML in browser
        echo Otevírám instalátor v prohlížeči...
        start "" "%INSTALL_HTML%"
    )
) else (
    :start_server
    :: Advanced mode - start a lightweight HTTP server with Node.js
    echo Node.js nalezen, spouštím lokální webový server...
    
    :: Create a temporary server script
    set "TEMP_SERVER=%TEMP%\candy-ai-server.js"
    
    echo const http = require('http'); > "%TEMP_SERVER%"
    echo const fs = require('fs'); >> "%TEMP_SERVER%"
    echo const path = require('path'); >> "%TEMP_SERVER%"
    echo const os = require('os'); >> "%TEMP_SERVER%"
    echo const { exec } = require('child_process'); >> "%TEMP_SERVER%"
    echo. >> "%TEMP_SERVER%"
    echo const PORT = 8080; >> "%TEMP_SERVER%"
    echo const ROOT_DIR = '%CURRENT_DIR:\=\\%'; >> "%TEMP_SERVER%"
    echo. >> "%TEMP_SERVER%"
    echo // Create an HTTP server >> "%TEMP_SERVER%"
    echo const server = http.createServer((req, res) => { >> "%TEMP_SERVER%"
    echo   // Self-healing server mechanism >> "%TEMP_SERVER%"
    echo   const serverErrorLog = []; >> "%TEMP_SERVER%"
    echo   process.on('uncaughtException', (err) => { >> "%TEMP_SERVER%"
    echo     console.error('AUTO-REPAIR: Uncaught exception detected, attempting to heal...', err); >> "%TEMP_SERVER%"
    echo     serverErrorLog.push({ timestamp: new Date(), type: 'uncaughtException', error: err.message }); >> "%TEMP_SERVER%"
    echo     // Continue server execution despite error >> "%TEMP_SERVER%"
    echo   }); >> "%TEMP_SERVER%"
    echo. >> "%TEMP_SERVER%"
    echo   // Handle API endpoints >> "%TEMP_SERVER%"
    echo   if (req.url.startsWith('/api/')) { >> "%TEMP_SERVER%"
    echo     if (req.method === 'GET' ^&^& req.url === '/api/check') { >> "%TEMP_SERVER%"
    echo       // Enhanced API availability check with system diagnostics >> "%TEMP_SERVER%"
    echo       const systemInfo = { >> "%TEMP_SERVER%"
    echo         platform: process.platform, >> "%TEMP_SERVER%"
    echo         nodeVersion: process.version, >> "%TEMP_SERVER%"
    echo         freeMemory: Math.round(os.freemem() / 1024 / 1024), >> "%TEMP_SERVER%"
    echo         totalMemory: Math.round(os.totalmem() / 1024 / 1024), >> "%TEMP_SERVER%"
    echo         uptime: os.uptime(), >> "%TEMP_SERVER%"
    echo         cpus: os.cpus().length, >> "%TEMP_SERVER%"
    echo         serverErrors: serverErrorLog.length >> "%TEMP_SERVER%"
    echo       }; >> "%TEMP_SERVER%"
    echo       res.writeHead(200, { 'Content-Type': 'application/json' }); >> "%TEMP_SERVER%"
    echo       res.end(JSON.stringify({ success: true, message: 'Auto-repair API is available', systemInfo })); >> "%TEMP_SERVER%"
    echo     } else if (req.method === 'POST' ^&^& req.url === '/api/execute-command') { >> "%TEMP_SERVER%"
    echo       // Handle command execution >> "%TEMP_SERVER%"
    echo       let body = ''; >> "%TEMP_SERVER%"
    echo       req.on('data', chunk => { >> "%TEMP_SERVER%"
    echo         body += chunk.toString(); >> "%TEMP_SERVER%"
    echo       }); >> "%TEMP_SERVER%"
    echo       req.on('end', () => { >> "%TEMP_SERVER%"
    echo         try { >> "%TEMP_SERVER%"
    echo           const { command } = JSON.parse(body); >> "%TEMP_SERVER%"
    echo           console.log(`Executing command: ${command}`); >> "%TEMP_SERVER%"
    echo. >> "%TEMP_SERVER%"
    echo           exec(command, (error, stdout, stderr) => { >> "%TEMP_SERVER%"
    echo             res.writeHead(200, { 'Content-Type': 'application/json' }); >> "%TEMP_SERVER%"
    echo             res.end(JSON.stringify({ >> "%TEMP_SERVER%"
    echo               success: !error, >> "%TEMP_SERVER%"
    echo               stdout, >> "%TEMP_SERVER%"
    echo               stderr, >> "%TEMP_SERVER%"
    echo               error: error ? error.message : null >> "%TEMP_SERVER%"
    echo             })); >> "%TEMP_SERVER%"
    echo           }); >> "%TEMP_SERVER%"
    echo         } catch (e) { >> "%TEMP_SERVER%"
    echo           res.writeHead(400, { 'Content-Type': 'application/json' }); >> "%TEMP_SERVER%"
    echo           res.end(JSON.stringify({ success: false, error: e.message })); >> "%TEMP_SERVER%"
    echo         } >> "%TEMP_SERVER%"
    echo       }); >> "%TEMP_SERVER%"
    echo     } else { >> "%TEMP_SERVER%"
    echo       res.writeHead(404, { 'Content-Type': 'application/json' }); >> "%TEMP_SERVER%"
    echo       res.end(JSON.stringify({ success: false, error: 'Endpoint not found' })); >> "%TEMP_SERVER%"
    echo     } >> "%TEMP_SERVER%"
    echo     return; >> "%TEMP_SERVER%"
    echo   } >> "%TEMP_SERVER%"
    echo. >> "%TEMP_SERVER%"
    echo   // Serve static files >> "%TEMP_SERVER%"
    echo   let filePath = path.join(ROOT_DIR, req.url === '/' ? 'install.html' : req.url); >> "%TEMP_SERVER%"
    echo   const extname = path.extname(filePath); >> "%TEMP_SERVER%"
    echo   let contentType = 'text/html'; >> "%TEMP_SERVER%"
    echo. >> "%TEMP_SERVER%"
    echo   switch (extname) { >> "%TEMP_SERVER%"
    echo     case '.js': >> "%TEMP_SERVER%"
    echo       contentType = 'text/javascript'; >> "%TEMP_SERVER%"
    echo       break; >> "%TEMP_SERVER%"
    echo     case '.css': >> "%TEMP_SERVER%"
    echo       contentType = 'text/css'; >> "%TEMP_SERVER%"
    echo       break; >> "%TEMP_SERVER%"
    echo     case '.json': >> "%TEMP_SERVER%"
    echo       contentType = 'application/json'; >> "%TEMP_SERVER%"
    echo       break; >> "%TEMP_SERVER%"
    echo     case '.png': >> "%TEMP_SERVER%"
    echo       contentType = 'image/png'; >> "%TEMP_SERVER%"
    echo       break; >> "%TEMP_SERVER%"
    echo     case '.jpg': >> "%TEMP_SERVER%"
    echo       contentType = 'image/jpg'; >> "%TEMP_SERVER%"
    echo       break; >> "%TEMP_SERVER%"
    echo   } >> "%TEMP_SERVER%"
    echo. >> "%TEMP_SERVER%"
    echo   fs.readFile(filePath, (error, content) => { >> "%TEMP_SERVER%"
    echo     if (error) { >> "%TEMP_SERVER%"
    echo       if (error.code === 'ENOENT') { >> "%TEMP_SERVER%"
    echo         res.writeHead(404); >> "%TEMP_SERVER%"
    echo         res.end('File not found'); >> "%TEMP_SERVER%"
    echo       } else { >> "%TEMP_SERVER%"
    echo         res.writeHead(500); >> "%TEMP_SERVER%"
    echo         res.end(`Server Error: ${error.code}`); >> "%TEMP_SERVER%"
    echo       } >> "%TEMP_SERVER%"
    echo     } else { >> "%TEMP_SERVER%"
    echo       res.writeHead(200, { 'Content-Type': contentType }); >> "%TEMP_SERVER%"
    echo       res.end(content, 'utf-8'); >> "%TEMP_SERVER%"
    echo     } >> "%TEMP_SERVER%"
    echo   }); >> "%TEMP_SERVER%"
    echo }); >> "%TEMP_SERVER%"
    echo. >> "%TEMP_SERVER%"
    echo // Start the server >> "%TEMP_SERVER%"
    echo server.listen(PORT, () => { >> "%TEMP_SERVER%"
    echo   console.log(`Server running at http://localhost:${PORT}/`); >> "%TEMP_SERVER%"
    echo   console.log('AUTO-REPAIR: Server with autonomous repair mechanisms active'); >> "%TEMP_SERVER%"
    echo   // Open the browser automatically >> "%TEMP_SERVER%"
    echo   const start = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open'; >> "%TEMP_SERVER%"
    echo   exec(`${start} http://localhost:${PORT}/`); >> "%TEMP_SERVER%"
    echo }); >> "%TEMP_SERVER%"
    echo. >> "%TEMP_SERVER%"
    echo // Handle server shutdown >> "%TEMP_SERVER%"
    echo process.on('SIGINT', () => { >> "%TEMP_SERVER%"
    echo   console.log('Shutting down server...'); >> "%TEMP_SERVER%"
    echo   server.close(() => { >> "%TEMP_SERVER%"
    echo     console.log('Server closed'); >> "%TEMP_SERVER%"
    echo     process.exit(0); >> "%TEMP_SERVER%"
    echo   }); >> "%TEMP_SERVER%"
    echo }); >> "%TEMP_SERVER%"
    
    :: Start the Node.js server
    start "Candy AI Clone Web Installer" cmd /c "node "%TEMP_SERVER%""
    
    echo.
    echo Webový instalátor byl spuštěn v prohlížeči.
    echo Server běží na http://localhost:8080/
    echo.
    echo Pro ukončení serveru zavřete nově otevřené okno příkazového řádku.
)

echo.
echo Stiskněte libovolnou klávesu pro ukončení tohoto okna...
pause > nul
exit /b 0