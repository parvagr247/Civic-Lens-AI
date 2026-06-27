@echo off
setlocal enabledelayedexpansion

set "MAVEN_VERSION=3.9.6"
set "MAVEN_HOME=%USERPROFILE%\.m2\wrapper\apache-maven-%MAVEN_VERSION%"
set "MAVEN_ZIP=%TEMP%\apache-maven-%MAVEN_VERSION%-bin.zip"
set "MAVEN_URL=https://archive.apache.org/dist/maven/maven-3/%MAVEN_VERSION%/binaries/apache-maven-%MAVEN_VERSION%-bin.zip"

if not exist "%MAVEN_HOME%\bin\mvn.cmd" (
    echo Maven Wrapper: Maven not found locally at %MAVEN_HOME%
    echo Maven Wrapper: Downloading Maven %MAVEN_VERSION% from %MAVEN_URL%...
    
    powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object System.Net.WebClient).DownloadFile('%MAVEN_URL%', '%MAVEN_ZIP%')"
    if %ERRORLEVEL% neq 0 (
        echo Error: Failed to download Maven.
        exit /b 1
    )
    
    echo Maven Wrapper: Extracting files to %USERPROFILE%\.m2\wrapper...
    if not exist "%USERPROFILE%\.m2\wrapper" mkdir "%USERPROFILE%\.m2\wrapper"
    
    powershell -Command "Expand-Archive -Path '%MAVEN_ZIP%' -DestinationPath '%USERPROFILE%\.m2\wrapper' -Force"
    if %ERRORLEVEL% neq 0 (
        echo Error: Failed to extract Maven files.
        exit /b 1
    )
    
    del "%MAVEN_ZIP%" >nul 2>&1
    echo Maven Wrapper: Maven %MAVEN_VERSION% configured successfully.
)

:: Run the Maven command with the arguments passed
"%MAVEN_HOME%\bin\mvn.cmd" %*
