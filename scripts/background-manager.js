#!/usr/bin/env node

/**
 * scripts/background-manager.js
 * Cross-platform background execution manager, status checker, and graceful shutdown coordinator.
 * No external dependencies.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const net = require('net');
const child_process = require('child_process');

// Configuration directories
const BASE_DIR = path.join(os.homedir(), '.my-app');
const REGISTRY_DIR = path.join(BASE_DIR, 'registry');
const LOGS_DIR = path.join(BASE_DIR, 'logs');
const LOCKS_DIR = path.join(BASE_DIR, 'locks');
const REGISTRY_LOCK = path.join(LOCKS_DIR, 'registry.lock');

// Ensure directories exist
[BASE_DIR, REGISTRY_DIR, LOGS_DIR, LOCKS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper: Atomic File Locking using directory creation
async function acquireLock(timeout = 3000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      fs.mkdirSync(REGISTRY_LOCK);
      return true;
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
      // Sleep 50ms before retry
      await delay(50);
    }
  }
  throw new Error('Lock acquisition timed out.');
}

function releaseLock() {
  try {
    fs.rmdirSync(REGISTRY_LOCK);
  } catch (err) {}
}

// Helper: Query process start time to prevent PID recycling collisions
function getProcessStartTime(pid) {
  if (process.platform === 'win32') {
    try {
      const output = child_process.execSync(
        `powershell -Command "(Get-Process -Id ${pid} -ErrorAction SilentlyContinue).StartTime.ToString('yyyyMMddHHmmss')"`,
        { stdio: ['pipe', 'pipe', 'ignore'] }
      );
      return output.toString().trim() || null;
    } catch (e) {
      return null;
    }
  } else {
    try {
      const output = child_process.execSync(`ps -p ${pid} -o lstart=`, {
        stdio: ['pipe', 'pipe', 'ignore'],
      });
      return output.toString().trim() || null;
    } catch (e) {
      return null;
    }
  }
}

// Helper: Cross-platform check if process is running
function isProcessRunning(pid, expectedStartTime) {
  if (pid <= 0) return false;

  try {
    process.kill(pid, 0);
  } catch (err) {
    if (err.code === 'EPERM') {
      // Permission error means the process exists and is active, but we can't signal it
      return true;
    }
    return false;
  }

  // Verify creation start time if available
  const startTime = getProcessStartTime(pid);
  if (!startTime || !expectedStartTime) {
    return true; // Fallback to PID existence if start times cannot be resolved
  }
  return startTime === expectedStartTime;
}

// Helper: Write metadata json file
function writeMetadata(instanceId, pid, port, startTime, executable, logPath) {
  const metadataPath = path.join(REGISTRY_DIR, `${instanceId}.json`);
  const data = {
    id: instanceId,
    pid: pid,
    systemStartTime: startTime,
    ipcPort: port,
    executable: executable,
    logPath: logPath,
    startedAt: new Date().toISOString(),
  };
  fs.writeFileSync(metadataPath, JSON.stringify(data, null, 2));
}

// Helper: Read metadata
function readMetadata(instanceId) {
  const metadataPath = path.join(REGISTRY_DIR, `${instanceId}.json`);
  if (!fs.existsSync(metadataPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  } catch (e) {
    return null;
  }
}

// Handle Status Option
function handleStatus(instanceId) {
  const metadata = readMetadata(instanceId);
  if (!metadata) {
    console.log(
      `No active background process found for instance '${instanceId}'.`
    );
    return;
  }

  if (isProcessRunning(metadata.pid, metadata.systemStartTime)) {
    console.log(`Background process '${instanceId}' is ACTIVE.`);
    console.log(`  PID:          ${metadata.pid}`);
    console.log(`  IPC Port:     ${metadata.ipcPort}`);
    console.log(`  Logs:         ${metadata.logPath}`);
    console.log(`  Started At:   ${metadata.startedAt}`);
  } else {
    console.log(
      `No active process found (cleaned up stale metadata for '${instanceId}').`
    );
    try {
      fs.unlinkSync(path.join(REGISTRY_DIR, `${instanceId}.json`));
    } catch (e) {}
  }
}

// Handle Stop Option
function handleStop(instanceId) {
  const metadata = readMetadata(instanceId);
  if (!metadata) {
    console.log(
      `No active background process metadata found for instance '${instanceId}'.`
    );
    return;
  }

  if (!isProcessRunning(metadata.pid, metadata.systemStartTime)) {
    console.log(
      `Process '${instanceId}' is already inactive. Cleaning up metadata.`
    );
    try {
      fs.unlinkSync(path.join(REGISTRY_DIR, `${instanceId}.json`));
    } catch (e) {}
    return;
  }

  console.log(`Stopping process '${instanceId}' (PID: ${metadata.pid})...`);

  // Try TCP IPC shutdown command
  const client = new net.Socket();
  let ipcSuccessful = false;

  client.setTimeout(1000);
  client.connect(metadata.ipcPort, '127.0.0.1', () => {
    client.write('SHUTDOWN');
  });

  client.on('data', () => {
    ipcSuccessful = true;
    client.destroy();
  });

  client.on('error', () => {
    client.destroy();
  });

  client.on('close', () => {
    // Wait for exit
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (!isProcessRunning(metadata.pid, metadata.systemStartTime)) {
        clearInterval(interval);
        console.log(`Process '${instanceId}' stopped gracefully.`);
        try {
          fs.unlinkSync(path.join(REGISTRY_DIR, `${instanceId}.json`));
        } catch (e) {}
      } else if (attempts >= 10) {
        clearInterval(interval);
        console.log(
          'Graceful IPC shutdown failed or timed out. Sending system force-kill...'
        );
        killForcefully(metadata);
      }
    }, 200);
  });
}

function killForcefully(metadata) {
  try {
    process.kill(metadata.pid, 'SIGKILL');
  } catch (err) {
    if (process.platform === 'win32') {
      try {
        child_process.execSync(`taskkill /F /PID ${metadata.pid}`);
      } catch (e) {}
    }
  }
  console.log(`Process '${metadata.id}' force-terminated.`);
  try {
    fs.unlinkSync(path.join(REGISTRY_DIR, `${metadata.id}.json`));
  } catch (e) {}
}

// Background Spawner
async function handleBackground(instanceId, executable, args) {
  await acquireLock();
  try {
    const existing = readMetadata(instanceId);
    if (existing && isProcessRunning(existing.pid, existing.systemStartTime)) {
      console.error(
        `[Error] Instance '${instanceId}' is already running with PID: ${existing.pid}`
      );
      process.exit(1);
    }

    // Spawn detached daemon wrapper process and capture its stdout/stderr
    const daemonLogPath = path.join(LOGS_DIR, `${instanceId}_daemon.log`);
    const daemonOut = fs.openSync(daemonLogPath, 'a');
    const daemonArgs = [
      __filename,
      '--daemon',
      instanceId,
      executable,
      ...args,
    ];
    const daemon = child_process.spawn(process.execPath, daemonArgs, {
      detached: true,
      stdio: ['ignore', daemonOut, daemonOut],
    });

    daemon.unref();

    // Poll metadata file for up to 3 seconds until initialized
    const start = Date.now();
    let initialized = false;
    while (Date.now() - start < 3000) {
      const meta = readMetadata(instanceId);
      if (meta && meta.ipcPort) {
        console.log(
          `Process started in background (Instance: '${instanceId}', PID: ${meta.pid})`
        );
        console.log(`Logs: ${meta.logPath}`);
        initialized = true;
        break;
      }
      // Asynchronous sleep 100ms
      await delay(100);
    }

    if (!initialized) {
      console.error('[Error] Failed to initialize background manager daemon.');
      process.exit(1);
    }
  } finally {
    releaseLock();
  }
}

// Daemon Worker Mode (internal)
function runDaemon(instanceId, executable, args) {
  const logPath = path.join(LOGS_DIR, `${instanceId}.log`);
  const logStream = fs.createWriteStream(logPath, { flags: 'a' });

  // Rotate log if it exceeds 10MB
  try {
    if (fs.existsSync(logPath)) {
      const stats = fs.statSync(logPath);
      if (stats.size > 10 * 1024 * 1024) {
        fs.renameSync(logPath, `${logPath}.1`);
      }
    }
  } catch (e) {}

  const writeToLog = (level, data) => {
    const timestamp = new Date()
      .toISOString()
      .replace('T', ' ')
      .substring(0, 23);
    const lines = data.toString().split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (i === lines.length - 1 && lines[i] === '') break;
      logStream.write(
        `[${timestamp}] [${process.pid}] [${level}] ${lines[i]}\n`
      );
    }
  };

  process.on('uncaughtException', (err) => {
    writeToLog(
      'CRITICAL_ERROR',
      `Uncaught Exception: ${err.stack || err.message}`
    );
    cleanupAndExit();
  });

  process.on('unhandledRejection', (reason, promise) => {
    writeToLog(
      'CRITICAL_ERROR',
      `Unhandled Rejection at: ${promise}, reason: ${reason}`
    );
    cleanupAndExit();
  });

  writeToLog(
    'SYSTEM',
    `Starting background process: ${executable} ${args.join(' ')}`
  );

  // Start loopback listener
  const server = net.createServer((socket) => {
    socket.on('data', (data) => {
      const command = data.toString().trim();
      if (command === 'SHUTDOWN') {
        writeToLog(
          'SYSTEM',
          'Received SHUTDOWN command. Terminating child process...'
        );
        socket.write('ACKNOWLEDGEMENT\n');
        shutdownChild();
      } else if (command === 'PING') {
        socket.write('PONG\n');
      }
    });
  });

  server.listen(0, '127.0.0.1', () => {
    const port = server.address().port;
    const startTime =
      getProcessStartTime(process.pid) || new Date().toISOString();
    writeMetadata(
      instanceId,
      process.pid,
      port,
      startTime,
      executable,
      logPath
    );

    spawnTarget();
  });

  let targetProcess = null;
  let isShuttingDown = false;

  function spawnTarget() {
    try {
      targetProcess = child_process.spawn(executable, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      targetProcess.stdout.on('data', (data) => writeToLog('INFO', data));
      targetProcess.stderr.on('data', (data) => writeToLog('ERROR', data));

      targetProcess.on('close', (code, signal) => {
        writeToLog(
          'SYSTEM',
          `Child process closed with code ${code} and signal ${signal}`
        );
        if (!isShuttingDown) {
          cleanupAndExit();
        }
      });

      targetProcess.on('error', (err) => {
        writeToLog('SYSTEM', `Failed to start child process: ${err.message}`);
        cleanupAndExit();
      });
    } catch (e) {
      writeToLog('SYSTEM', `Exception spawning child process: ${e.message}`);
      cleanupAndExit();
    }
  }

  function shutdownChild() {
    isShuttingDown = true;
    if (targetProcess) {
      try {
        targetProcess.kill('SIGTERM');
      } catch (e) {}

      // Wait 2s, then force kill
      const forceKillTimeout = setTimeout(() => {
        if (targetProcess) {
          writeToLog(
            'SYSTEM',
            'Child did not exit within 2s. Sending SIGKILL...'
          );
          try {
            targetProcess.kill('SIGKILL');
          } catch (e) {}
        }
        cleanupAndExit();
      }, 2000);

      targetProcess.on('close', () => {
        clearTimeout(forceKillTimeout);
        cleanupAndExit();
      });
    } else {
      cleanupAndExit();
    }
  }

  function cleanupAndExit() {
    server.close();
    try {
      const metadataPath = path.join(REGISTRY_DIR, `${instanceId}.json`);
      if (fs.existsSync(metadataPath)) {
        fs.unlinkSync(metadataPath);
      }
    } catch (e) {}
    writeToLog('SYSTEM', 'Background manager daemon exiting.');
    logStream.end();
    process.exit(0);
  }
}

// Command Line Entry Point
async function main() {
  const args = process.argv.slice(2);
  let mode = null;
  let instanceId = null;
  let customId = null;

  // Parse ID if provided
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--id' || args[i] === '-id') {
      customId = args[i + 1];
      args.splice(i, 2);
      break;
    }
  }

  const firstArg = args[0];
  if (firstArg === '--background' || firstArg === '-background') {
    mode = 'background';
  } else if (firstArg === '--status' || firstArg === '-status') {
    mode = 'status';
  } else if (firstArg === '--stop' || firstArg === '-stop') {
    mode = 'stop';
  } else if (firstArg === '--daemon') {
    mode = 'daemon';
  }

  if (!mode) {
    console.error('Usage:');
    console.error(
      '  node background-manager.js [--id <instance_id>] --background <executable> [args...]'
    );
    console.error('  node background-manager.js [--id <instance_id>] --status');
    console.error('  node background-manager.js [--id <instance_id>] --stop');
    process.exit(1);
  }

  if (mode === 'daemon') {
    const instId = args[1];
    const exec = args[2];
    const execArgs = args.slice(3);
    runDaemon(instId, exec, execArgs);
    return;
  }

  if (mode === 'background') {
    const executable = args[1];
    const execArgs = args.slice(2);
    if (!executable) {
      console.error('Error: No executable specified for background run.');
      process.exit(1);
    }
    instanceId =
      customId || path.basename(executable, path.extname(executable));
    await handleBackground(instanceId, executable, execArgs);
  } else {
    // status or stop
    instanceId = customId || 'test-runner'; // Default instance ID fallback
    if (mode === 'status') {
      handleStatus(instanceId);
    } else {
      handleStop(instanceId);
    }
  }
}

main().catch((err) => {
  console.error('[Error] Execution failed:', err);
  process.exit(1);
});
