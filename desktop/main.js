const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let frontendServer;

function startFrontendServer() {
  return new Promise((resolve, reject) => {
    // 启动前端开发服务器
    frontendServer = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, '..', 'frontend'),
      stdio: 'inherit'
    });

    frontendServer.on('error', (error) => {
      console.error('启动前端服务器失败:', error);
      reject(error);
    });

    // 等待服务器启动
    setTimeout(() => {
      resolve();
    }, 3000);
  });
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // 检查是否是开发环境
  const isDev = !app.isPackaged;

  if (isDev) {
    // 开发环境：使用开发服务器
    mainWindow.loadURL('http://localhost:3000');
  } else {
    // 生产环境：使用构建后的静态文件
    const frontendPath = path.join(__dirname, '..', 'frontend', '.next', 'server', 'app', 'page.js');
    // 注意：Next.js 构建后的文件需要通过服务器访问，不能直接通过 file:// 协议访问
    // 这里我们使用前端构建后的独立服务器
    const standalonePath = path.join(__dirname, '..', 'frontend', '.next', 'standalone');
    if (require('fs').existsSync(standalonePath)) {
      // 启动独立服务器
      frontendServer = spawn('node', ['server.js'], {
        cwd: standalonePath,
        stdio: 'inherit'
      });
      // 等待服务器启动
      setTimeout(() => {
        mainWindow.loadURL('http://localhost:3000');
      }, 2000);
    } else {
      // 如果没有独立服务器，尝试直接加载静态文件
      const staticPath = path.join(__dirname, '..', 'frontend', 'out', 'index.html');
      if (require('fs').existsSync(staticPath)) {
        mainWindow.loadFile(staticPath);
      } else {
        console.error('找不到构建后的静态文件');
        app.quit();
      }
    }
  }

  // 打开开发者工具
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(async () => {
  try {
    // 检查是否是开发环境
    const isDev = !app.isPackaged;

    if (isDev) {
      // 开发环境：启动前端服务器
      await startFrontendServer();
    }

    // 创建窗口
    createWindow();

    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  } catch (error) {
    console.error('启动失败:', error);
    app.quit();
  }
});

app.on('window-all-closed', function () {
  // 关闭前端服务器
  if (frontendServer) {
    frontendServer.kill();
  }
  if (process.platform !== 'darwin') app.quit();
});