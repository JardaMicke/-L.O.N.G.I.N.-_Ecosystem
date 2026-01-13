@echo off
setlocal enabledelayedexpansion

:: Set default variables
set "REPO_URL=https://github.com/username/candy-ai-clone.git"
set "APP_NAME=candy-ai-clone"
set "INSTALL_DIR=%USERPROFILE%\%APP_NAME%"
set "SOURCE_DIR=%~dp0"
set "PARENT_DIR=%~dp0.."
set "ROOT_DIR=%~dp0..\.."
set "ZIP_NAME=candy-ai-clone-source.zip"
set "TEMP_EXTRACT_DIR=%TEMP%\%APP_NAME%-extract"
set "CONFIG_FILE=%LOCALAPPDATA%\%APP_NAME%\config.ini"
set "LOG_FILE=%LOCALAPPDATA%\%APP_NAME%\install_log.txt"
set "JSON_MEMORY=%LOCALAPPDATA%\%APP_NAME%\file_memory.json"
set "TIMESTAMP=%DATE:~10,4%%DATE:~4,2%%DATE:~7,2%_%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%"
set "TIMESTAMP=!TIMESTAMP: =0!"

:: Initialize log file, config directory and memory file
mkdir "%LOCALAPPDATA%\%APP_NAME%" 2>nul
echo Candy AI Clone Installation Log - !TIMESTAMP! > "%LOG_FILE%"
echo ======================================== >> "%LOG_FILE%"

:: Initialize or load JSON memory file
if not exist "%JSON_MEMORY%" (
    echo {"last_scan":"%TIMESTAMP%","scanned_files":[],"installed_files":[],"config_paths":{}} > "%JSON_MEMORY%"
    call :log "Created new file memory database at %JSON_MEMORY%"
) else (
    call :log "Found existing file memory database at %JSON_MEMORY%"
)

:: Error handling to prevent automatic closures
:error_handler
echo.
echo An error occurred. Press any key to return to the main menu...
pause > nul
goto main_menu

:: Log function that adds timestamps and writes to both console and log file
:log
set "message=%~1"
echo !message!
echo [!TIMESTAMP!] !message! >> "%LOG_FILE%"
exit /b

:: Press any key to continue function
:press_continue
echo.
echo Press any key to continue...
pause > nul
exit /b

:: Read JSON memory function (simplified parsing with findstr)
:read_memory
set "memory_key=%~1"
set "memory_value="

:: Use findstr to find the key in the JSON file
for /f "tokens=1,* delims=:," %%a in ('findstr /C:"%memory_key%" "%JSON_MEMORY%"') do (
    set "temp_value=%%b"
    :: Remove quotes and leading spaces
    set "temp_value=!temp_value:"=!"
    set "temp_value=!temp_value: =!"
    set "memory_value=!temp_value!"
)
exit /b

:: Write to JSON memory function
:write_memory
set "memory_key=%~1"
set "memory_value=%~2"
set "temp_file=%TEMP%\memory_update.json"

:: Create a backup of the current memory file
copy "%JSON_MEMORY%" "%JSON_MEMORY%.bak" >nul

:: Read the entire JSON file into a variable
set "json_content="
for /f "usebackq delims=" %%a in ("%JSON_MEMORY%") do (
    set "line=%%a"
    set "json_content=!json_content!!line!"
)

:: Simple string replacement for the key and value
:: This is a simplified approach and won't handle complex JSON structures
set "json_content=!json_content:%memory_key%": "[^"]*"=%memory_key%": "%memory_value%"!"

:: Write back to the temp file
echo !json_content! > "%temp_file%"

:: Replace the original file with the updated one
move /y "%temp_file%" "%JSON_MEMORY%" >nul

call :log "Updated memory key %memory_key% with value %memory_value%"
exit /b

:: Add file to scanned files list
:add_scanned_file
set "file_path=%~1"
set "temp_file=%TEMP%\scanned_files.json"

:: Read the current scanned files list
set "scanned_files="
call :read_memory "scanned_files"
set "scanned_files=!memory_value!"

:: Add the new file if not already in the list
findstr /C:"%file_path%" "%JSON_MEMORY%" >nul
if %ERRORLEVEL% NEQ 0 (
    :: Update the scanned files list by adding the new file
    powershell -Command "$json = Get-Content '%JSON_MEMORY%' | ConvertFrom-Json; $json.scanned_files += '%file_path%'; $json | ConvertTo-Json | Set-Content '%temp_file%'"
    move /y "%temp_file%" "%JSON_MEMORY%" >nul
    call :log "Added %file_path% to scanned files memory"
)
exit /b

:: Add file to installed files list
:add_installed_file
set "file_path=%~1"
set "temp_file=%TEMP%\installed_files.json"

:: Read the current installed files list
set "installed_files="
call :read_memory "installed_files"
set "installed_files=!memory_value!"

:: Add the new file if not already in the list
findstr /C:"%file_path%" "%JSON_MEMORY%" >nul
if %ERRORLEVEL% NEQ 0 (
    :: Update the installed files list by adding the new file
    powershell -Command "$json = Get-Content '%JSON_MEMORY%' | ConvertFrom-Json; $json.installed_files += '%file_path%'; $json | ConvertTo-Json | Set-Content '%temp_file%'"
    move /y "%temp_file%" "%JSON_MEMORY%" >nul
    call :log "Added %file_path% to installed files memory"
)
exit /b

:: Save path to config
:save_config_path
set "config_key=%~1"
set "config_path=%~2"
set "temp_file=%TEMP%\config_paths.json"

:: Update the config paths in the JSON file
powershell -Command "$json = Get-Content '%JSON_MEMORY%' | ConvertFrom-Json; $json.config_paths.'%config_key%' = '%config_path%'; $json | ConvertTo-Json | Set-Content '%temp_file%'"
move /y "%temp_file%" "%JSON_MEMORY%" >nul
call :log "Saved config path for %config_key%: %config_path%"
exit /b

:: Display main menu
:main_menu
cls
call :log "====================================================="
call :log "Candy AI Clone - Windows Setup Utility"
call :log "====================================================="
call :log ""

:: Check if application is already installed
if exist "%INSTALL_DIR%" (
    call :log "Candy AI Clone appears to be already installed at:"
    call :log "%INSTALL_DIR%"
    call :log ""
    
    echo Select an option:
    echo 1. Uninstall existing version and then install
    echo 2. Install/Update without uninstalling
    echo 3. Uninstall only
    echo 4. Exit
    echo.
    
    set /p INSTALL_CHOICE="Enter your choice (1-4): "
    
    if "!INSTALL_CHOICE!"=="1" (
        call :uninstall_first
        goto install
    ) else if "!INSTALL_CHOICE!"=="2" (
        set "KEEP_CONFIG=Y"
        goto install
    ) else if "!INSTALL_CHOICE!"=="3" (
        goto uninstall
    ) else if "!INSTALL_CHOICE!"=="4" (
        goto end
    ) else (
        call :log "Invalid selection."
        call :press_continue
        goto main_menu
    )
) else (
    echo Select an option:
    echo 1. Install Candy AI Clone
    echo 2. Exit
    echo.
    
    set /p MENU_CHOICE="Enter your choice (1-2): "
    
    if "!MENU_CHOICE!"=="1" (
        set "KEEP_CONFIG=N"
        goto install
    ) else if "!MENU_CHOICE!"=="2" (
        goto end
    ) else (
        call :log "Invalid selection."
        call :press_continue
        goto main_menu
    )
)

:: Uninstall before install section
:uninstall_first
cls
call :log "====================================================="
call :log "Uninstalling existing version before installation"
call :log "====================================================="
call :log ""

call :log "Do you want to keep your existing configuration and data for the new installation?"
set /p KEEP_CONFIG="Keep configuration? (Y/N, default is Y): "
if "!KEEP_CONFIG!"=="" set "KEEP_CONFIG=Y"

:: Perform uninstallation but potentially keep configuration files
set "PREV_UNINSTALL=Y"
goto uninstall_process

:: Install section
:install
cls
call :log "====================================================="
call :log "Candy AI Clone - Installation"
call :log "====================================================="
call :log ""

call :log "Looking for source files..."
call :press_continue

:: Set SOURCE_FOUND to 0 (not found)
set "SOURCE_FOUND=0"

:: First check entire root drive directory for ZIP
call :log "Searching for source ZIP in the root directory..."
for %%d in (C D E F G H I J K L M N O P Q R S T U V W X Y Z) do (
    if exist "%%d:\%ZIP_NAME%" (
        call :log "Found source ZIP file in root drive %%d:"
        set "ZIP_PATH=%%d:\%ZIP_NAME%"
        set "SOURCE_FOUND=1"
        call :add_scanned_file "%%d:\%ZIP_NAME%"
        
        call :log "Press any key to extract files..."
        pause > nul
        
        goto extract_zip
    )
)

:: Step 1: Check if files exist in the current directory
if exist "%SOURCE_DIR%\frontend" (
    call :log "Found source files in current directory."
    set "SOURCE_FOUND=1"
    call :add_scanned_file "%SOURCE_DIR%\frontend"
    
    call :log "Press any key to continue with setup..."
    pause > nul
    
    goto setup_app
)

:: Step 2: Check for ZIP file in various locations
:: First check root directory (two levels up)
if exist "%ROOT_DIR%\%ZIP_NAME%" (
    call :log "Found source ZIP file in root application folder."
    set "ZIP_PATH=%ROOT_DIR%\%ZIP_NAME%"
    set "SOURCE_FOUND=1"
    call :add_scanned_file "%ROOT_DIR%\%ZIP_NAME%"
    
    call :log "Press any key to extract files..."
    pause > nul
    
    goto extract_zip
)

:: Then check parent directory (one level up)
if exist "%PARENT_DIR%\%ZIP_NAME%" (
    call :log "Found source ZIP file in parent folder."
    set "ZIP_PATH=%PARENT_DIR%\%ZIP_NAME%"
    set "SOURCE_FOUND=1"
    call :add_scanned_file "%PARENT_DIR%\%ZIP_NAME%"
    
    call :log "Press any key to extract files..."
    pause > nul
    
    goto extract_zip
)

:: Then check current directory
if exist "%SOURCE_DIR%\%ZIP_NAME%" (
    call :log "Found source ZIP file in current directory."
    set "ZIP_PATH=%SOURCE_DIR%\%ZIP_NAME%"
    set "SOURCE_FOUND=1"
    call :add_scanned_file "%SOURCE_DIR%\%ZIP_NAME%"
    
    call :log "Press any key to extract files..."
    pause > nul
    
    goto extract_zip
)

:: Step 3: Try to download from GitHub
call :log "Source files not found locally. Attempting to download from GitHub..."
call :log ""

where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    call :log "Git is not installed or not in PATH. Cannot download from GitHub."
    call :log "Press any key to continue to manual input..."
    pause > nul
    goto prompt_for_zip
)

:: Create temp directory for git clone
mkdir "%TEMP%\%APP_NAME%-download" 2>nul
cd /d "%TEMP%\%APP_NAME%-download"

:: Try to clone repository
call :log "Cloning repository from %REPO_URL%..."
call :log "This may take a while, please wait..."
git clone %REPO_URL% . >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    call :log "Failed to download source files from GitHub."
    call :log "Press any key to continue to manual input..."
    pause > nul
    goto prompt_for_zip
)

set "SOURCE_DIR=%TEMP%\%APP_NAME%-download"
set "SOURCE_FOUND=1"
call :add_scanned_file "%SOURCE_DIR%"

call :log "Successfully downloaded source files from GitHub."
call :log "Press any key to continue..."
pause > nul

goto setup_app

:prompt_for_zip
:: Step 4: Prompt user for ZIP file location
call :log ""
call :log "Please provide the path to the source ZIP file:"
set /p ZIP_PATH="ZIP file path: "

if not exist "!ZIP_PATH!" (
    call :log "The specified file does not exist."
    call :log "Press any key to try again..."
    pause > nul
    goto prompt_for_zip
)

call :add_scanned_file "!ZIP_PATH!"
call :log "Found ZIP file. Press any key to extract..."
pause > nul

:extract_zip
:: Extract ZIP file if we found or were given one
if defined ZIP_PATH (
    call :log "Preparing to extract source files..."
    
    :: Clean previous extraction directory if it exists
    if exist "%TEMP_EXTRACT_DIR%" (
        call :log "Cleaning previous extraction directory..."
        rd /s /q "%TEMP_EXTRACT_DIR%" >nul 2>&1
    )
    
    :: Create extraction directory
    mkdir "%TEMP_EXTRACT_DIR%" 2>nul
    call :log "Extracting source files from !ZIP_PATH!..."
    
    :: Extract ZIP file
    powershell -command "Expand-Archive -Path '!ZIP_PATH!' -DestinationPath '%TEMP_EXTRACT_DIR%' -Force"
    if %ERRORLEVEL% NEQ 0 (
        call :log "Error extracting ZIP file."
        call :log "Press any key to try again..."
        pause > nul
        goto prompt_for_zip
    )
    
    set "SOURCE_DIR=%TEMP_EXTRACT_DIR%"
    set "SOURCE_FOUND=1"
    call :add_scanned_file "%TEMP_EXTRACT_DIR%"
    
    call :log "Files extracted successfully."
    call :log "Press any key to continue..."
    pause > nul
)

:setup_app
:: Ensure source was found one way or another
if "%SOURCE_FOUND%"=="0" (
    call :log "Failed to find or download source files. Installation aborted."
    call :log "Press any key to return to the main menu..."
    pause > nul
    goto main_menu
)

:: Create installation directory
call :log ""
call :log "Creating installation directory..."
mkdir "%INSTALL_DIR%" 2>nul

:: Create or read configuration file
if /i "%KEEP_CONFIG%"=="Y" (
    if exist "%CONFIG_FILE%" (
        call :log "Reading existing configuration..."
        for /f "tokens=1,2 delims==" %%a in (%CONFIG_FILE%) do (
            set "%%a=%%b"
        )
    )
) else (
    call :log "Creating new configuration..."
)

:: Copy files to installation directory
call :log "Copying files to installation directory..."
call :log "This may take a while, please wait..."

:: First copy configuration files if they should be preserved
if /i "%KEEP_CONFIG%"=="Y" (
    :: Temporarily move config files
    if exist "%INSTALL_DIR%\llm-config.bat" (
        copy "%INSTALL_DIR%\llm-config.bat" "%TEMP%\llm-config.bat.bak" >nul
    )
    if exist "%INSTALL_DIR%\backend\database.sqlite" (
        mkdir "%TEMP%\%APP_NAME%-backup" 2>nul
        copy "%INSTALL_DIR%\backend\database.sqlite" "%TEMP%\%APP_NAME%-backup\database.sqlite" >nul
    )
    :: Remove installation directory to prepare for new files
    rd /s /q "%INSTALL_DIR%" >nul 2>&1
    mkdir "%INSTALL_DIR%" 2>nul
)

:: Copy all files from source directory and log them to memory
:: First create a list of all files to copy
call :log "Scanning source directory for files..."
set "FILE_LIST=%TEMP%\file_list.txt"
dir /s /b "%SOURCE_DIR%\*.*" > "%FILE_LIST%"

:: Now copy each file and add it to the installed files memory
for /f "usebackq delims=" %%f in ("%FILE_LIST%") do (
    :: Get the relative path by removing the source directory prefix
    set "rel_path=%%f"
    set "rel_path=!rel_path:%SOURCE_DIR%=!"
    
    :: Create the target directory structure
    set "target_dir=%INSTALL_DIR%!rel_path:~0,-1!"
    if not exist "!target_dir!" mkdir "!target_dir!" 2>nul
    
    :: Copy the file
    copy "%%f" "%INSTALL_DIR%!rel_path!" >nul 2>&1
    
    :: Add the file to the installed files memory
    call :add_installed_file "%INSTALL_DIR%!rel_path!"
)

:: Verify that files were copied successfully
if %ERRORLEVEL% NEQ 0 (
    call :log "Error copying files to installation directory."
    call :log "Press any key to return to the main menu..."
    pause > nul
    goto main_menu
)

call :log "Files copied successfully."
call :log "Press any key to continue..."
pause > nul

:: Restore config files if needed
if /i "%KEEP_CONFIG%"=="Y" (
    if exist "%TEMP%\llm-config.bat.bak" (
        call :log "Restoring LLM configuration..."
        copy "%TEMP%\llm-config.bat.bak" "%INSTALL_DIR%\llm-config.bat" >nul
        del "%TEMP%\llm-config.bat.bak" >nul
    )
    if exist "%TEMP%\%APP_NAME%-backup\database.sqlite" (
        call :log "Restoring database..."
        mkdir "%INSTALL_DIR%\backend" 2>nul
        copy "%TEMP%\%APP_NAME%-backup\database.sqlite" "%INSTALL_DIR%\backend\database.sqlite" >nul
    )
)

:: Create uninstaller
call :log "Creating uninstaller..."
copy "%~f0" "%INSTALL_DIR%\uninstall.bat" >nul

:: Create sample character photos directory
call :log "Setting up sample character photos..."
call :log "Press any key to continue..."
pause > nul

mkdir "%INSTALL_DIR%\backend\public\uploads\emily" 2>nul
mkdir "%INSTALL_DIR%\backend\public\uploads\sample_photos" 2>nul

:: Copy sample photos
if exist "%SOURCE_DIR%\4vm1b8i0b4.jpg" (
    copy "%SOURCE_DIR%\4vm1b8i0b4.jpg" "%INSTALL_DIR%\backend\public\uploads\sample_photos\" >nul
    call :add_installed_file "%INSTALL_DIR%\backend\public\uploads\sample_photos\4vm1b8i0b4.jpg"
)
if exist "%SOURCE_DIR%\7lhd4fax9q.jpg" (
    copy "%SOURCE_DIR%\7lhd4fax9q.jpg" "%INSTALL_DIR%\backend\public\uploads\sample_photos\" >nul
    call :add_installed_file "%INSTALL_DIR%\backend\public\uploads\sample_photos\7lhd4fax9q.jpg"
)
if exist "%SOURCE_DIR%\ay6vzj7rj5.jpg" (
    copy "%SOURCE_DIR%\ay6vzj7rj5.jpg" "%INSTALL_DIR%\backend\public\uploads\sample_photos\" >nul
    call :add_installed_file "%INSTALL_DIR%\backend\public\uploads\sample_photos\ay6vzj7rj5.jpg"
)
if exist "%SOURCE_DIR%\g2kbjg12a3.jpg" (
    copy "%SOURCE_DIR%\g2kbjg12a3.jpg" "%INSTALL_DIR%\backend\public\uploads\emily\emily_avatar.jpg" >nul
    call :add_installed_file "%INSTALL_DIR%\backend\public\uploads\emily\emily_avatar.jpg"
)

:: Configure LLM options
call :log ""
call :log "====================================================="
call :log "LLM Configuration"
call :log "====================================================="
call :log ""
call :log "Candy AI Clone can work with Ollama or LM Studio for language models."
call :log ""
call :log "Press any key to continue with LLM configuration..."
pause > nul

:: Ollama configuration
set "USE_OLLAMA=Y"
if /i "%KEEP_CONFIG%"=="Y" (
    if defined OLLAMA_PATH (
        call :log "Using previously configured Ollama path: !OLLAMA_PATH!"
    ) else (
        echo Do you want to use Ollama for language models? (Y/N)
        set /p USE_OLLAMA="Use Ollama? (Y/N, default is Y): "
        if /i "%USE_OLLAMA%"=="" set "USE_OLLAMA=Y"
    )
) else (
    echo Do you want to use Ollama for language models? (Y/N)
    set /p USE_OLLAMA="Use Ollama? (Y/N, default is Y): "
    if /i "%USE_OLLAMA%"=="" set "USE_OLLAMA=Y"
)

if /i "%USE_OLLAMA%"=="Y" (
    if not defined OLLAMA_PATH (
        call :log ""
        call :log "Please provide the path to Ollama executable:"
        call :log "(Leave empty to use default path: C:\Program Files\Ollama\ollama.exe)"
        set /p OLLAMA_PATH="Ollama path: "
        
        if "!OLLAMA_PATH!"=="" set "OLLAMA_PATH=C:\Program Files\Ollama\ollama.exe"
    )
    
    call :log ""
    call :log "Checking Ollama installation..."
    if exist "!OLLAMA_PATH!" (
        call :log "Ollama found at: !OLLAMA_PATH!"
        call :save_config_path "ollama" "!OLLAMA_PATH!"
        
        call :log ""
        call :log "Would you like to list available models? (Y/N)"
        set /p LIST_MODELS="List models? (Y/N, default is Y): "
        if /i "!LIST_MODELS!"=="" set "LIST_MODELS=Y"
        
        if /i "!LIST_MODELS!"=="Y" (
            call :log ""
            call :log "Available models:"
            "!OLLAMA_PATH!" list 2>nul >>"%LOG_FILE%"
            for /f "tokens=1" %%a in ('"!OLLAMA_PATH!" list 2>nul') do (
                echo - %%a
            )
            call :log ""
            call :log "Press any key to continue..."
            pause > nul
        )
    ) else (
        call :log "WARNING: Ollama executable not found at: !OLLAMA_PATH!"
        call :log "You can install Ollama from: https://ollama.ai/download"
        call :log "Press any key to continue anyway..."
        pause > nul
    )
)

:: LM Studio configuration
set "USE_LMSTUDIO=Y"
if /i "%KEEP_CONFIG%"=="Y" (
    if defined LMSTUDIO_PATH (
        call :log "Using previously configured LM Studio path: !LMSTUDIO_PATH!"
    ) else (
        call :log ""
        call :log "Do you want to use LM Studio for language models? (Y/N)"
        set /p USE_LMSTUDIO="Use LM Studio? (Y/N, default is Y): "
        if /i "%USE_LMSTUDIO%"=="" set "USE_LMSTUDIO=Y"
    )
) else (
    call :log ""
    call :log "Do you want to use LM Studio for language models? (Y/N)"
    set /p USE_LMSTUDIO="Use LM Studio? (Y/N, default is Y): "
    if /i "%USE_LMSTUDIO%"=="" set "USE_LMSTUDIO=Y"
)

if /i "%USE_LMSTUDIO%"=="Y" (
    if not defined LMSTUDIO_PATH (
        call :log ""
        call :log "Please provide the path to LM Studio executable:"
        call :log "(Leave empty to use default path: C:\Program Files\LM Studio\LM Studio.exe)"
        set /p LMSTUDIO_PATH="LM Studio path: "
        
        if "!LMSTUDIO_PATH!"=="" set "LMSTUDIO_PATH=C:\Program Files\LM Studio\LM Studio.exe"
    )
    
    if not defined MODELS_DIR (
        call :log ""
        call :log "Checking LM Studio installation..."
        if exist "!LMSTUDIO_PATH!" (
            call :log "LM Studio found at: !LMSTUDIO_PATH!"
            call :save_config_path "lmstudio" "!LMSTUDIO_PATH!"
            
            call :log ""
            call :log "Please provide the path to your LM Studio models directory:"
            call :log "(Leave empty to use default path: %USERPROFILE%\AppData\Roaming\LM Studio\models)"
            set /p MODELS_DIR="Models directory: "
            
            if "!MODELS_DIR!"=="" set "MODELS_DIR=%USERPROFILE%\AppData\Roaming\LM Studio\models"
            call :save_config_path "models_dir" "!MODELS_DIR!"
        ) else (
            call :log "WARNING: LM Studio executable not found at: !LMSTUDIO_PATH!"
            call :log "You can install LM Studio from: https://lmstudio.ai/"
            call :log "Press any key to continue anyway..."
            pause > nul
        )
    ) else (
        call :log "Using previously configured models directory: !MODELS_DIR!"
    )
    
    call :log ""
    call :log "Checking models directory..."
    if exist "!MODELS_DIR!" (
        call :log "Models directory found at: !MODELS_DIR!"
        
        :: Count models
        set MODEL_COUNT=0
        for /d %%i in ("!MODELS_DIR!\*") do (
            set /a MODEL_COUNT+=1
            call :add_scanned_file "%%i"
        )
        
        call :log "Found approximately !MODEL_COUNT! models in the directory."
    ) else (
        call :log "WARNING: Models directory not found at: !MODELS_DIR!"
        call :log "Press any key to continue anyway..."
        pause > nul
    )
)

:: Save configuration to both INI and BAT files
call :log ""
call :log "Saving configuration..."
call :log "Press any key to continue..."
pause > nul

:: Save to INI file
(
    echo INSTALL_DIR=%INSTALL_DIR%
    echo OLLAMA_PATH=%OLLAMA_PATH%
    echo USE_OLLAMA=%USE_OLLAMA%
    echo LMSTUDIO_PATH=%LMSTUDIO_PATH%
    echo USE_LMSTUDIO=%USE_LMSTUDIO%
    echo MODELS_DIR=%MODELS_DIR%
    echo INSTALL_DATE=%DATE% %TIME%
    echo LAST_UPDATE=%DATE% %TIME%
) > "%CONFIG_FILE%"

:: Save to BAT file for script usage
(
    echo @echo off
    echo :: LLM Configuration
    echo set "OLLAMA_PATH=%OLLAMA_PATH%"
    echo set "LMSTUDIO_PATH=%LMSTUDIO_PATH%"
    echo set "MODELS_DIR=%MODELS_DIR%"
    echo set "USE_OLLAMA=%USE_OLLAMA%"
    echo set "USE_LMSTUDIO=%USE_LMSTUDIO%"
) > "%INSTALL_DIR%\llm-config.bat"

:: Docker configuration
call :log ""
call :log "====================================================="
call :log "Docker Configuration"
call :log "====================================================="
call :log ""
call :log "Do you want to use Docker for additional services? (Y/N)"
call :log "Note: Docker is optional and not required for basic functionality."
set /p USE_DOCKER="Use Docker? (Y/N, default is N): "

:: Check for Docker if user wants to use it
if /i "%USE_DOCKER%"=="Y" (
    call :log ""
    call :log "Checking for Docker..."
    where docker >nul 2>nul
    if %ERRORLEVEL% NEQ 0 (
        call :log "WARNING: Docker is not installed or not in PATH."
        call :log "You can install Docker Desktop from: https://www.docker.com/products/docker-desktop"
        call :log "Press any key to continue..."
        pause > nul
    ) else (
        call :log "Docker found. Setting up containers..."
        cd /d "%INSTALL_DIR%\docker"
        
        :: Make sure docker-compose.yml exists
        if exist "docker-compose.yml" (
            call :log "Starting Docker containers. This may take a while..."
            call :log "Press any key to continue..."
            pause > nul
            
            :: Try to start Docker containers
            docker-compose up -d >>"%LOG_FILE%" 2>&1
            
            if %ERRORLEVEL% NEQ 0 (
                call :log "WARNING: Failed to start Docker containers."
                call :log "You can manually start them later with:"
                call :log "cd /d \"%INSTALL_DIR%\docker\" && docker-compose up -d"
                call :log "Press any key to continue..."
                pause > nul
            ) else (
                call :log "Docker containers started successfully."
                call :log "Press any key to continue..."
                pause > nul
            )
        ) else (
            call :log "WARNING: docker-compose.yml not found."
            call :log "Press any key to continue..."
            pause > nul
        )
    )
)

:: Check if we need to install dependencies
call :log ""
call :log "Checking for Node.js..."
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    call :log "Node.js is not installed or not in PATH."
    call :log "Please install Node.js from https://nodejs.org/"
    call :log "Press any key to continue anyway..."
    pause > nul
) else (
    call :log "Node.js found. Installing dependencies..."
    call :log "This may take several minutes. Please be patient."
    call :log "Press any key to start installation of dependencies..."
    pause > nul

    :: Install backend dependencies
    call :log ""
    call :log "Installing backend dependencies..."
    cd /d "%INSTALL_DIR%\backend"
    if exist "package.json" (
        call npm install --production >>"%LOG_FILE%" 2>&1
        if %ERRORLEVEL% NEQ 0 (
            call :log "WARNING: Error installing backend dependencies."
            call :log "Check the log file for details: %LOG_FILE%"
            call :log "Press any key to continue anyway..."
            pause > nul
        ) else (
            call :log "Backend dependencies installed successfully."
        )
    ) else (
        call :log "WARNING: Backend package.json not found."
        call :log "Press any key to continue..."
        pause > nul
    )

    :: Install frontend dependencies
    call :log ""
    call :log "Installing frontend dependencies..."
    cd /d "%INSTALL_DIR%\frontend"
    if exist "package.json" (
        call npm install >>"%LOG_FILE%" 2>&1
        if %ERRORLEVEL% NEQ 0 (
            call :log "WARNING: Error installing frontend dependencies."
            call :log "Check the log file for details: %LOG_FILE%"
            call :log "Press any key to continue anyway..."
            pause > nul
        ) else (
            call :log "Frontend dependencies installed successfully."
        )
    ) else (
        call :log "WARNING: Frontend package.json not found."
        call :log "Press any key to continue..."
        pause > nul
    )
)

:: Create icon directory if needed
call :log ""
call :log "Checking icon path..."
set "ICON_DIR=%INSTALL_DIR%\frontend\public\assets"
if not exist "%ICON_DIR%" (
    call :log "Creating icon directory..."
    mkdir "%ICON_DIR%" 2>nul
)

:: Copy default icon if available
set "ICON_PATH=%ICON_DIR%\icon.ico"
if exist "%SOURCE_DIR%\frontend\public\assets\icon.ico" (
    copy "%SOURCE_DIR%\frontend\public\assets\icon.ico" "%ICON_DIR%\icon.ico" >nul
    call :add_installed_file "%ICON_DIR%\icon.ico"
) else if exist "%SOURCE_DIR%\i3exasvzrc.png" (
    :: Use PowerShell to convert PNG to ICO
    call :log "Creating icon from PNG..."
    powershell -command "Add-Type -AssemblyName System.Drawing; $img = [System.Drawing.Image]::FromFile('%SOURCE_DIR%\i3exasvzrc.png'); $bmp = New-Object System.Drawing.Bitmap($img); $ico = [System.IO.Path]::ChangeExtension('%ICON_DIR%\icon.ico', '.ico'); $bmp.Save($ico, [System.Drawing.Imaging.ImageFormat]::Icon); $bmp.Dispose(); $img.Dispose();" 2>nul
    
    if not exist "%ICON_DIR%\icon.ico" (
        :: If conversion fails, use system icon
        call :log "Using system icon..."
        set "ICON_PATH=%SystemRoot%\System32\shell32.dll,13"
    ) else (
        set "ICON_PATH=%ICON_DIR%\icon.ico"
        call :add_installed_file "%ICON_DIR%\icon.ico"
    )
) else (
    :: Use system icon as fallback
    call :log "Using system icon..."
    set "ICON_PATH=%SystemRoot%\System32\shell32.dll,13"
)

:: Create shortcuts
call :log ""
call :log "Creating shortcuts..."
call :log "Press any key to continue..."
pause > nul

:: Create desktop shortcut - first ensure parent directories exist
call :log "Creating desktop shortcut..."
set "SHORTCUT_PATH=%USERPROFILE%\Desktop\Candy AI.lnk"
set "START_MENU_PATH=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Candy AI.lnk"

:: Create start script that initializes environment before launching
call :log "Creating launcher script..."
(
    echo @echo off
    echo :: Candy AI Launcher
    echo echo Starting Candy AI...
    echo cd /d "%INSTALL_DIR%\frontend"
    echo call "%INSTALL_DIR%\llm-config.bat"
    echo node_modules\.bin\electron.cmd .
) > "%INSTALL_DIR%\launch-candy-ai.bat"
call :add_installed_file "%INSTALL_DIR%\launch-candy-ai.bat"

:: Create the shortcuts using PowerShell (with error handling)
powershell -command "$ErrorActionPreference = 'Stop'; try { $WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%SHORTCUT_PATH%'); $Shortcut.TargetPath = '%INSTALL_DIR%\launch-candy-ai.bat'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.IconLocation = '%ICON_PATH%'; $Shortcut.Save(); Write-Output 'Desktop shortcut created successfully.' } catch { Write-Output ('Error creating shortcut: ' + $_.Exception.Message) }" >>"%LOG_FILE%" 2>&1

:: Check if shortcut was created
if not exist "%SHORTCUT_PATH%" (
    call :log "WARNING: Failed to create desktop shortcut."
    call :log "You can manually launch the application using: %INSTALL_DIR%\launch-candy-ai.bat"
) else (
    call :log "Desktop shortcut created successfully."
    call :add_installed_file "%SHORTCUT_PATH%"
)

:: Create Start Menu shortcuts
call :log "Creating Start Menu shortcuts..."
mkdir "%APPDATA%\Microsoft\Windows\Start Menu\Programs" 2>nul

powershell -command "$ErrorActionPreference = 'Stop'; try { $WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%START_MENU_PATH%'); $Shortcut.TargetPath = '%INSTALL_DIR%\launch-candy-ai.bat'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.IconLocation = '%ICON_PATH%'; $Shortcut.Save(); Write-Output 'Start Menu shortcut created successfully.' } catch { Write-Output ('Error creating shortcut: ' + $_.Exception.Message) }" >>"%LOG_FILE%" 2>&1
if exist "%START_MENU_PATH%" call :add_installed_file "%START_MENU_PATH%"

:: Create uninstall shortcut in Start Menu
powershell -command "$ErrorActionPreference = 'Stop'; try { $WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%APPDATA%\Microsoft\Windows\Start Menu\Programs\Uninstall Candy AI.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\uninstall.bat'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.IconLocation = '%SystemRoot%\System32\shell32.dll,131'; $Shortcut.Save(); Write-Output 'Uninstall shortcut created successfully.' } catch { Write-Output ('Error creating shortcut: ' + $_.Exception.Message) }" >>"%LOG_FILE%" 2>&1
if exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Uninstall Candy AI.lnk" call :add_installed_file "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Uninstall Candy AI.lnk"

:: Create scripts to start LLM servers
call :log "Creating LLM server launcher scripts..."

:: Ollama launcher
if /i "%USE_OLLAMA%"=="Y" (
    (
        echo @echo off
        echo echo Starting Ollama server...
        echo cd /d "%INSTALL_DIR%"
        echo start "" "%OLLAMA_PATH%" serve
        echo echo Ollama server started. Do not close this window.
    ) > "%INSTALL_DIR%\start-ollama.bat"
    call :add_installed_file "%INSTALL_DIR%\start-ollama.bat"
)

:: LM Studio launcher
if /i "%USE_LMSTUDIO%"=="Y" (
    (
        echo @echo off
        echo echo Starting LM Studio server...
        echo cd /d "%INSTALL_DIR%"
        echo start "" "%LMSTUDIO_PATH%" --server-only
        echo echo LM Studio server started. Do not close this window.
    ) > "%INSTALL_DIR%\start-lmstudio.bat"
    call :add_installed_file "%INSTALL_DIR%\start-lmstudio.bat"
)

:: Update file memory timestamp
powershell -Command "$json = Get-Content '%JSON_MEMORY%' | ConvertFrom-Json; $json.last_scan = '$(date /t) $(time /t)'; $json | ConvertTo-Json | Set-Content '%JSON_MEMORY%'"

:: Finish installation
call :log ""
call :log "=========================================="
call :log "Installation completed successfully!"
call :log ""
call :log "Candy AI Clone has been installed to:"
call :log "%INSTALL_DIR%"
call :log ""
call :log "Shortcuts have been created on your desktop and Start Menu."
call :log ""
if /i "%USE_OLLAMA%"=="Y" (
    call :log "To start Ollama server, run:"
    call :log "%INSTALL_DIR%\start-ollama.bat"
    call :log ""
)
if /i "%USE_LMSTUDIO%"=="Y" (
    call :log "To start LM Studio server, run:"
    call :log "%INSTALL_DIR%\start-lmstudio.bat"
    call :log ""
)
call :log "To launch Candy AI, use the desktop shortcut or run:"
call :log "%INSTALL_DIR%\launch-candy-ai.bat"
call :log ""
call :log "Installation log saved to: %LOG_FILE%"
call :log "Configuration saved to: %CONFIG_FILE%"
call :log "File memory database saved to: %JSON_MEMORY%"
call :log "=========================================="

call :log "Press any key to return to the main menu..."
pause > nul
goto main_menu

:: Handle the uninstallation process
:uninstall_process
:: Common uninstallation code
if not exist "%INSTALL_DIR%" (
    call :log "Candy AI Clone does not appear to be installed at:"
    call :log "%INSTALL_DIR%"
    call :log ""
    call :log "Please specify the installation directory:"
    set /p INSTALL_DIR="Installation directory: "
    
    if not exist "!INSTALL_DIR!" (
        call :log "The specified directory does not exist."
        call :log "Uninstallation aborted."
        call :log "Press any key to return to the main menu..."
        pause > nul
        goto main_menu
    )
)

call :log "Candy AI Clone will be uninstalled from:"
call :log "%INSTALL_DIR%"
call :log ""

:: Ask about user data if not uninstalling before install
if not defined PREV_UNINSTALL (
    set "KEEP_DATA=N"
    call :log "Would you like to keep your user data (conversations, characters, etc.)?"
    set /p KEEP_DATA="Keep user data? (Y/N, default is N): "
)

:: Stop running processes
call :log ""
call :log "Stopping any running Candy AI processes..."
taskkill /f /im electron.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1

:: Stop Docker containers if Docker is installed
where docker >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    call :log "Stopping Docker containers..."
    cd /d "%INSTALL_DIR%\docker"
    docker-compose down >nul 2>&1
)

:: Backup user data if requested
if /i "%KEEP_DATA%"=="Y" (
    call :log ""
    call :log "Backing up user data..."
    mkdir "%USERPROFILE%\CandyAIBackup" 2>nul
    
    :: Copy database file
    if exist "%INSTALL_DIR%\backend\database.sqlite" (
        copy "%INSTALL_DIR%\backend\database.sqlite" "%USERPROFILE%\CandyAIBackup\" >nul
        call :log "Database backed up to: %USERPROFILE%\CandyAIBackup\"
    )
    
    :: Copy configuration files
    if exist "%CONFIG_FILE%" (
        copy "%CONFIG_FILE%" "%USERPROFILE%\CandyAIBackup\" >nul
        call :log "Configuration backed up to: %USERPROFILE%\CandyAIBackup\"
    )
    
    :: Copy character uploads
    if exist "%INSTALL_DIR%\backend\public\uploads" (
        mkdir "%USERPROFILE%\CandyAIBackup\uploads" 2>nul
        xcopy /E /I /Y "%INSTALL_DIR%\backend\public\uploads\*.*" "%USERPROFILE%\CandyAIBackup\uploads\" >nul
        call :log "Character images backed up to: %USERPROFILE%\CandyAIBackup\uploads\"
    )
    
    call :log "Press any key to continue..."
    pause > nul
)

:: Remove shortcuts
call :log ""
call :log "Removing shortcuts..."
if exist "%USERPROFILE%\Desktop\Candy AI.lnk" del "%USERPROFILE%\Desktop\Candy AI.lnk" >nul
if exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Candy AI.lnk" del "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Candy AI.lnk" >nul
if exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Uninstall Candy AI.lnk" del "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Uninstall Candy AI.lnk" >nul

:: Remove installation directory
call :log ""
call :log "Removing application files..."
call :log "This may take a moment, please wait..."
rd /s /q "%INSTALL_DIR%" >nul 2>&1

:: Ask if we should remove configuration if not uninstalling before install
if not defined PREV_UNINSTALL (
    set "REMOVE_CONFIG=N"
    call :log "Would you like to remove configuration files from %LOCALAPPDATA%\%APP_NAME%?"
    set /p REMOVE_CONFIG="Remove configuration? (Y/N, default is N): "

    if /i "%REMOVE_CONFIG%"=="Y" (
        rd /s /q "%LOCALAPPDATA%\%APP_NAME%" >nul 2>&1
        call :log "Configuration files removed."
    ) else (
        call :log "Configuration files preserved at %LOCALAPPDATA%\%APP_NAME%\"
    )
)

:: Finish uninstallation
call :log ""
call :log "=========================================="
call :log "Uninstallation completed successfully!"
call :log ""
if /i "%KEEP_DATA%"=="Y" (
    call :log "Your user data has been preserved at:"
    call :log "%USERPROFILE%\CandyAIBackup\"
)
call :log "=========================================="

:: If we're uninstalling before installing, return to install
if defined PREV_UNINSTALL (
    call :log "Press any key to proceed with installation..."
    pause > nul
    set "PREV_UNINSTALL="
    goto install
) else (
    call :log "Press any key to return to the main menu..."
    pause > nul
    goto main_menu
)

:: Uninstall entry point
:uninstall
cls
call :log "====================================================="
call :log "Candy AI Clone - Uninstallation"
call :log "====================================================="
call :log ""

goto uninstall_process

:end
call :log "Exiting setup..."
call :log "Press any key to exit..."
pause > nul
endlocal
exit /b 0