// kill-port.js
import { exec } from "child_process";

// Change this if you want to auto-kill another port
const PORT = 5000;

const cmd = process.platform === "win32"
  ? `for /f "tokens=5" %a in ('netstat -ano ^| findstr :${PORT}') do taskkill /F /PID %a`
  : `lsof -t -i:${PORT} | xargs kill -9`;

exec(cmd, (err) => {
  if (err) {
    console.log(`⚠️ Nothing running on port ${PORT}`);
  } else {
    console.log(`✅ Killed process using port ${PORT}`);
  }
});
