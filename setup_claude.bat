@echo off
echo Setting up Claude AI integration...
echo.

REM Create .env file with API key placeholder
echo # Anthropic Claude API Key > .env
echo # Get your API key from: https://console.anthropic.com/ >> .env
echo # Replace the placeholder below with your actual API key >> .env
echo NEXT_PUBLIC_ANTHROPIC_API_KEY=sk-ant-your-api-key-here >> .env

echo.
echo ✅ .env file created!
echo.
echo 📋 NEXT STEPS:
echo 1. Get your API key from: https://console.anthropic.com/
echo 2. Open .env file and replace "sk-ant-your-api-key-here" with your actual key
echo 3. Save the file
echo 4. Restart your development server
echo.
echo 🎯 The system will automatically use AuthorBackend/medical_context.txt as context
echo.
pause
