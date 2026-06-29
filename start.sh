#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 20 --silent

echo "🚀 주식 일지 앱 시작 중..."

# Kill any running instances
kill $(lsof -ti:3001) 2>/dev/null
kill $(lsof -ti:5173) 2>/dev/null
sleep 1

# Start backend
cd "$(dirname "$0")/server"
node src/index.js &
SERVER_PID=$!

# Start frontend
cd "$(dirname "$0")/client"
npm run dev &
CLIENT_PID=$!

echo "✅ 서버: http://localhost:3001"
echo "✅ 앱:   http://localhost:5173"
echo ""
echo "종료: Ctrl+C"

trap "kill $SERVER_PID $CLIENT_PID 2>/dev/null; exit" INT TERM
wait
