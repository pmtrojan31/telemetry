const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;
let secondaryWindow;

// Function to create the main window
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),  // Optional
      nodeIntegration: true,                       // Required for Node.js integration
      contextIsolation: false
    }
  });

  // Load the index.html into the main window
  mainWindow.loadFile('index.html');

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Function to create the secondary window for telemetry pages
function createSecondaryWindow(page) {
  if (secondaryWindow) {
    secondaryWindow.focus(); // Focus on the existing secondary window if already open
    return;
  }

  secondaryWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Load the requested page (e.g., pressure.html)
  secondaryWindow.loadFile(`${page}.html`);

  // Handle window close and ensure secondaryWindow is destroyed properly
  secondaryWindow.on('closed', () => {
    secondaryWindow = null;
  });
}

// Communication with the renderer process for opening new windows
const { ipcMain } = require('electron');
ipcMain.on('navigate-to-page', (event, page) => {
  if (mainWindow) mainWindow.hide(); // Hide the main window
  createSecondaryWindow(page); // Open the secondary window
});

// Back button functionality to return to the main page
ipcMain.on('back-to-main', () => {
  if (secondaryWindow) {
    secondaryWindow.close(); // Close the secondary window
  }
  if (mainWindow) {
    mainWindow.show(); // Show the original main window
    mainWindow.focus(); // Bring it to the front
  }
});

// Handle real-time data between windows
ipcMain.on('telemetry-data', (event, data) => {
  if (secondaryWindow) {
      secondaryWindow.webContents.send('telemetry-data', data);
  }
});

// When the app is ready, create the main window
app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
