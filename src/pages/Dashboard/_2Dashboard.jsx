import React, { useState, useEffect, useRef, useCallback } from "react";
import Navbar from "../../components/Navbar/Navbar";
import axios from "axios";
import "./Dashboard.css";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import {
  MonitorSmartphone,
  ThermometerSun,
  CameraIcon,
  ChartColumnStacked,
  LayoutGrid,
  CircleUserRound,
  ExternalLink,
} from "lucide-react";

const DeviceCard = ({ device, isActive, onClick, renderIcon, isDarkTheme }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);

  const handleLaunchClick = (e) => {
    e.stopPropagation();
    setIsLaunching(true);
    onClick();
    setTimeout(() => setIsLaunching(false), 1500);
  };

  const shouldShowButton = !isActive && (isHovered || isLaunching);

  return (
    <div
      className={`device-card ${isActive ? "active" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="device-icon">
        {renderIcon(device.iconType, isDarkTheme ? "#ff6a00" : "#0971B3")}
      </div>

      <div className="device-name">{device.name}</div>
      <div className="device-status">{isActive ? "Running" : "Ready"}</div>

      {!isActive && (
        <button
          className={`launch-button ${shouldShowButton ? "visible" : ""}`}
          onClick={handleLaunchClick}
          disabled={isLaunching}
        >
          {isLaunching ? (
            <>
              <span className="loading-spinner"></span>
              Opening...
            </>
          ) : (
            <>
              <ExternalLink size={16} style={{ marginRight: "6px" }} />
              Launch Window
            </>
          )}
        </button>
      )}
    </div>
  );
};

const Dashboard = () => {
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [activeDevices, setActiveDevices] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [deviceIpMapping, setDeviceIpMapping] = useState({});
  const [deviceEndTime, setDeviceEndTime] = useState(null); // Add this line
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { device_id } = useParams();
  const [popupWindows, setPopupWindows] = useState([]);

  const location = useLocation();
  const settingsToggleRef = useRef(null);
  const settingsRef = useRef(null);
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme ? savedTheme === "dark" : true;
  });

  const queryParams = new URLSearchParams(location.search);
  const deviceIdParam = queryParams.get("device");
  const ipTypesParam = queryParams.get("ip_type");
  const reservationIdParam = queryParams.get("reservation");

  const driverTypes = {
    ct1_ip: { name: "CT1", iconType: "ThermoCamIcon" },
    ct2_ip: { name: "CT2", iconType: "ThermoCamIcon" },
    ct3_ip: { name: "CT3", iconType: "ThermoCamIcon" },
    pc_ip: { name: "PC", iconType: "MonitorSmartphone" },
    pulse1_ip: { name: "Pulse1", iconType: "ChartColumnStacked" },
    pulse2_ip: { name: "Pulse2", iconType: "ChartColumnStacked" },
    pulse3_ip: { name: "Pulse3", iconType: "ChartColumnStacked" },
    rutomatrix_ip: { name: "Rutomatrix", iconType: "MonitorSmartphone" },
  };

  const userData = {
    name: "Admin User",
    email: "admin@rutomatrix.com",
    avatar: <CircleUserRound size={30} />,
    onLogout: () => console.log("Logging out..."),
  };

  const toggleTheme = () => {
    const newTheme = !isDarkTheme;
    setIsDarkTheme(newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  const onMinimize = (deviceId) => {
    console.log(`Minimizing device ${deviceId}`);
  };

  const fetchBookedDevices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        "http://127.0.0.1:5000/api/booked-devices"
      );

      if (response.data.success) {
        const booked = response.data.booked_devices || [];

        if (deviceIdParam && reservationIdParam) {
          const matchedDevice = booked.find(
            (dev) =>
              dev.device_id === deviceIdParam &&
              String(dev.reservation_id) === reservationIdParam
          );

          if (matchedDevice) {
            setDeviceEndTime(new Date(matchedDevice.end_time)); // Set the end time
            const ipTypes = ipTypesParam
              ? ipTypesParam.split(",")
              : matchedDevice.ip_type.split(",");

            const driverDevices = ipTypes.map((ipType) => {
              const driverInfo = driverTypes[ipType];
              return {
                id: `${matchedDevice.device_id}_${ipType}`,
                name: `${matchedDevice.device_name} - ${driverInfo.name}`,
                iconType: driverInfo.iconType,
                ipType,
                ipAddress: matchedDevice.device_details[ipType],
                reservationId: matchedDevice.reservation_id,
                deviceName: matchedDevice.device_name,
              };
            });

            setSelectedDevices(driverDevices);
            setDeviceIpMapping((prev) => {
              const newMapping = { ...prev };
              driverDevices.forEach((driver) => {
                newMapping[driver.id] = {
                  ip_type: driver.ipType,
                  ip_address: driver.ipAddress,
                  reservation_id: driver.reservationId,
                  device_name: driver.deviceName,
                  device_details: matchedDevice.device_details,
                };
              });
              return newMapping;
            });
          } else {
            setError("No matching booked device found");
          }
        }
      }
      setLoading(false);
    } catch (err) {
      console.error("Error fetching booked devices:", err);
      setError("Failed to fetch device information");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookedDevices();
    const intervalId = setInterval(fetchBookedDevices, 10000);
    return () => clearInterval(intervalId);
  }, [fetchBookedDevices]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target) &&
        settingsToggleRef.current &&
        !settingsToggleRef.current.contains(event.target)
      ) {
        setShowSettings(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === "minimize") {
        onMinimize(event.data.deviceId);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const openDeviceWindow = async (deviceId, ipInfo = null) => {
    const device = selectedDevices.find((d) => d.id === deviceId);
    if (!device) {
      console.warn("No matching device found.");
      return;
    }

    // Use the component's deviceEndTime state
    if (!deviceEndTime) {
      console.warn("No end time available for this device");
      return;
    }

    const Timer = ({ endTime, deviceName, onExpired, isPopup = false }) => {
      const timerRef = useRef(null);
      const alertShownRef = useRef({
        thirtyMinutes: false,
        tenMinutes: false,
        expired: false,
      });

      const playAlertSound = () => {
        try {
          const audio = new Audio(
            "https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3"
          );
          audio.volume = 0.3;
          audio.play().catch((e) => console.log("Audio play failed:", e));
        } catch (e) {
          console.log("Audio error:", e);
        }
      };

      const showAlert = async (message) => {
        return new Promise((resolve) => {
          if (!alertShownRef.current.isAlertActive) {
            alertShownRef.current.isAlertActive = true;
            playAlertSound();
            alert(message);
            alertShownRef.current.isAlertActive = false;
            resolve();
          }
        });
      };

      const startCountdown = () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }

        alertShownRef.current = {
          thirtyMinutes: false,
          tenMinutes: false,
          expired: false,
          isAlertActive: false,
        };

        timerRef.current = setInterval(async () => {
          const now = new Date();
          const difference = endTime - now;
          const minutesLeft = Math.floor(difference / (1000 * 60));

          if (difference <= 0) {
            clearInterval(timerRef.current);
            if (!alertShownRef.current.expired) {
              await showAlert(`Your booking for ${deviceName} has expired!`);
              alertShownRef.current.expired = true;
              if (onExpired) onExpired();
            }
          } else if (minutesLeft === 10 && !alertShownRef.current.tenMinutes) {
            await showAlert(`Warning: Only 10 minutes left for ${deviceName}`);
            alertShownRef.current.tenMinutes = true;
          } else if (
            minutesLeft === 30 &&
            !alertShownRef.current.thirtyMinutes
          ) {
            await showAlert(`Warning: Only 30 minutes left for ${deviceName}`);
            alertShownRef.current.thirtyMinutes = true;
          }
        }, 1000);
      };

      useEffect(() => {
        if (endTime) {
          startCountdown();
        }

        return () => {
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
        };
      }, [endTime]);

      return null; // This component doesn't render anything
    };

    const ipType = ipInfo?.ip_type || "";
    const ipAddress = ipInfo?.ip_address || "";
    const deviceName = ipInfo?.device_name || "";
    const title = `Rutomatrix &#x2022; ${deviceName} - ${ipType}`;

    const isCT = ["CT1", "CT2", "CT3"].some((ct) => device.name.includes(ct));
    const isPulse = ["Pulse1", "Pulse2", "Pulse3"].some((pulse) =>
      device.name.includes(pulse)
    );
    const isPC = device.name.includes("PC");

    // Timer script that will receive updates from parent window
    const timerScript = `
      <script>
        // Function to update timer display
        function updateTimer(timeLeft, isLast10Minutes) {
          const timerElement = document.getElementById('device-timer');
          if (timerElement) {
            timerElement.innerHTML = \`
              <div style="display: flex; align-items: center; gap: 4px;">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span style="font-family: monospace; \${isLast10Minutes ? 'color: #ff4444; font-weight: bold;' : ''}">
                  \${timeLeft}
                </span>
              </div>
            \`;
          }
        }

        // Listen for timer updates from parent window
        window.addEventListener('message', (event) => {
          if (event.data.type === 'updateTimer') {
            updateTimer(event.data.timeLeft, event.data.isLast10Minutes);
          }
        });
      </script>
    `;

    const postMessageScript = `
      <script>
        window.addEventListener('load', () => {
          window.opener.postMessage(
            { type: 'windowTitle', deviceId: "${deviceId}", title: document.title },
            '*'
          );
        });
      </script>
    `;

    let popupHTML = "";

    if (isCT) {
      popupHTML = `<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  ${postMessageScript}
  ${timerScript}
  <style>
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #121212;
      color: #FFFFFF;
      margin: 0;
      padding: 0;
      height: 100vh;
      overflow: hidden;
    }

    .app-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 12px;
      box-sizing: border-box;
      gap: 16px;
      margin: 0 auto;
      overflow-y: auto; /* Enable vertical scrolling */
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #1E1E1E;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }

    .device-info {
      display: flex;
      flex-direction: column;
    }

     .device-name-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    #device-timer {
      margin-left: 10px;
    }

  .device-name {
    font-size: 18px;
    font-weight: 600;
    color: #FF6A00;
    white-space: normal;
    overflow: visible;
    text-overflow: unset;
    word-break: break-word;
    line-height: 1.2;
    text-align: center;
  }

    .controls {
      display: flex;
      gap: 12px;
    }

    .control-btn {
      background: #2A2A2A;
      border: none;
      color: #FFFFFF;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
      transition: background 0.3s ease, transform 0.2s ease, box-shadow 0.2s ease;
      backdrop-filter: blur(4px);
    }

    .control-btn:hover {
      background: linear-gradient(135deg, #FF6A00, #ff812b);
      transform: translateY(-2px);
    }

    .control-btn:active {
      background: #FF6A00;
      transform: scale(0.96) translateY(1px);
      box-shadow: 0 2px 6px rgba(255, 106, 0, 0.3);
    }

    .feed-container {
      position: relative;
      background: #1E1E1E;
      border-right: groove 1px #7c7c7c;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .feed-header {
      padding: 8px 12px;
      background: rgba(0,0,0,0.3);
      font-size: 14px;
    }

    .feed-content {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .feed-Placeholder {
      color: #BBBBBB;
      font-size: 16px;
    }

    .feed-image {
      width: 100%;
      height: 100%;
      object-fit: contain;
      max-width: 100%;
      max-height: 100%;
      display: block;
    }

    .video-layout-wrapper {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .video-section {
      display: flex;
      gap: 16px;
    }

    .feed-controls {
      position: absolute;
      bottom: 16px;
      left: 0;
      right: 0;
      display: flex;
      justify-content: center;
      gap: 8px;
    }

    .feed-btn {
      background: rgba(0,0,0,0.7);
      border: none;
      color: white;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }

    .feed-btn:hover {
      background: #FF6A00;
      transform: scale(1.1);
    }
    
  .servo-control-panel {
    position: absolute;
    bottom: 70px;
    right: 64px;
    width: 100px;
    height: 100px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-evenly;
    z-index: 1000;
    }

  /* Servo Control Button State */
  .control-btn.active {
    background: #FF6A00 !important;
    color: white !important;
  }

  .arrow-group {
    display: flex;
    justify-content: space-between;
    width: 95%;
  }

  .arrow {
    width: 0;
    height: 0;
    border-style: solid;
    cursor: pointer;
  }

  .arrow.up {
    border-width: 0 20px 20px 20px;
    border-color: transparent transparent #FF6A00 transparent;
  }

  .arrow.down {
    border-width: 20px 20px 0 20px;
    border-color: #FF6A00 transparent transparent transparent;
  }

  .arrow.left {
    border-width: 20px 20px 20px 0;
    border-color: transparent #FF6A00 transparent transparent;
  }

  .arrow.right {
    border-width: 20px 0 20px 20px;
    border-color: transparent transparent transparent #FF6A00;
  }

  .arrow.center {
    width: 20px;
    height: 20px;
    background-color: #FF6A00;
    border-radius: 50%;
    margin: auto;
  }

  .angle-display {
  position: absolute;
  bottom: 120px; /* adjust as needed to place near panel */
  right: 50px;   /* match panel's right offset */
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 14px;
  white-space: nowrap;
}

  .hidden {
    display: none;
  }

  .toggle-btn {
    color: white;
    padding: 8px 12px;
    cursor: pointer;
    border-radius: 4px 0 0 4px;
    font-weight: bold;
    opacity: 0.5;
    flex-shrink: 0; /* Prevents button from shrinking */
}
    .toggle-btn:hover {
    background-color: rgb(147 140 135 / 20%);
    opacity: 1;
  }

 /* Base responsive adjustments */
.app-container {
  width: 100%;
  min-height: 100vh;
  padding: 8px;
  gap: 12px;
}

.header {
  flex-wrap: wrap;
  gap: 12px;
  padding: 8px 12px;
}

.controls {
  flex-wrap: wrap;
  justify-content: center;
}

/* Video feeds responsive layout */
.video-feeds-container {
  flex-direction: column;
  height: auto;
}

.video-section {
  flex-direction: column;
}

.feed-container {
  min-height: 300px;
}

/* Media queries for different screen sizes */
@media (min-width: 768px) {
  .video-feeds-container {
    flex-direction: row;
    flex-wrap: wrap;
  }
  
  .feed-container {
    min-width: calc(50% - 8px);
    flex: 1 1 45%;
  }
}

@media (min-width: 1024px) {
  .app-container {
    max-width: 1400px;
  }
  
  .video-feeds-container {
    flex-wrap: nowrap;
  }
  
  .feed-container {
    min-width: auto;
  }

}

/* Small screens adjustments */
@media (max-width: 480px) {
  .device-info {
    width: 100%;
    text-align: center;
  }
  
  .controls {
    width: 100%;
    justify-content: space-between;
  }
  
  .control-btn {
    padding: 6px 10px;
    font-size: 14px;
  }
}

.video-feeds-container {
  display: flex;
  border-radius: 14px;
  border: groove 1px #7c7c7c;
  height: 580px; /* Default height */
  width: 100%;
  overflow-y: auto; /* Enable vertical scrolling */
  overflow-x: hidden; /* Prevent horizontal scrolling */
}

/* Child elements should not exceed container */
.feed-container {
  min-width: 0; /* Critical for flex children */
  flex-shrink: 0; /* Prevent unwanted shrinkage */
}

/* Responsive adjustments */
@media (max-width: 1200px) {
  .video-feeds-container {
    height: 550px;
  }
}

@media (max-width: 992px) {
  .video-feeds-container {
    height: 500px;
    flex-wrap: wrap;
    align-content: flex-start; /* Proper wrap alignment */
    overflow-y: auto;
  }
  
  .feed-container {
    min-width: calc(50% - 8px); /* Two columns */
    flex: 1 1 45%;
  }
}

@media (max-width: 768px) {
  .video-feeds-container {
    height: auto;
    min-height: 450px;
    gap: 12px;
    flex-direction: column;
  }
  
  .feed-container {
    min-width: 100%;
    height: 300px;
  }
}

@media (max-width: 576px) {
  .video-feeds-container {
    min-height: 350px;
  }
  
  .feed-container {
    min-width: 100%;
    height: 300px;
  }
}

@media (max-width: 576px) {
  .video-feeds-container {
    min-height: 350px;
  }
  
  .feed-container {
    height: 250px;
  }
}
  .feed-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #2A2A2A;
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover {
  background: #FF6A00;
}

.refresh-btn.loading {
  opacity: 0.7;
  cursor: not-allowed;
}

  .refresh-spinner, .loading-spinner {
    display: inline-block;
    width: 24px;
    height: 24px;
    border: 3px solid rgba(255,255,255,0.3);
    border-radius: 50%;
    border-top-color: #fff;
    animation: spin 1s ease-in-out infinite;
  }
  
  .loading-spinner {
    margin: 20px auto;
    display: block;
    width: 40px;
    height: 40px;
    border-width: 4px;
  }

  .feed-Placeholder {
    color: #aaa;
    text-align: center;
    font-size: 14px;
  }

  .alert {
    position: fixed;
    top: 80px;
    right: 30px;
    padding: 12px 16px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    z-index: 1000;
    max-width: 300px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  }

  .alert-success {
    background-color: #4CAF50;
    color: white;
  }

  .alert-error {
    background-color: #F44336;
    color: white;
  }

  .alert-info {
    background-color: #2196F3;
    color: white;
  }

  .alert-warning {
    background-color: #FF9800;
    color: white;
  }

  .alert-icon {
    margin-right: 8px;
    font-weight: bold;
  }

  .fade-out {
    opacity: 0;
    transition: opacity 0.5s;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

</style>
</head>
<body>
  <div class="app-container">
    <div class="header">
      <div class="device-info">
        <div class="device-name-row">
          <div class="device-name">${device.name}</div>
          <div id="device-timer"></div>
        </div>
        <div class="ip-display">
          IP: ${ipAddress || "Not available"}
        </div>
        <div class="cors-notice" style="color: #FF6A00; font-size: 14px; margin-top: 8px;">
        </div>
      </div>
      <div class="controls">
        <button class="refresh-btn" id="refresh-btn">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor"/>
          </svg>
        </button>
        <button class="control-btn" id="stream-btn">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M16 16v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4m4-4v16" fill="none" stroke="currentColor" stroke-width="2"/>
          </svg>
          Start Stream
        </button>
        <button class="control-btn hidden" id="reset-btn">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.3-.42 2.5-1.13 3.46l1.48 1.48A7.963 7.963 0 0 0 20 12c0-4.42-3.58-8-8-8zm-6.87.54L3.65 6.35A7.963 7.963 0 0 0 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3c-3.31 0-6-2.69-6-6 0-1.3.42-2.5 1.13-3.46z" fill="currentColor"/>
          </svg>
          Reset
        </button>
        <button class="control-btn" id="servo-toggle-btn">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" fill="none" />
          </svg>
          Control
        </button>
      </div>
    </div>

  <div class="video-layout-wrapper">
    <div class="video-section">
      <div class="video-feeds-container">
        <!-- Camera Feed -->
        <div class="feed-container">
          <div class="feed-header">
            <span>Camera Feed</span>
          </div>
          <div class="feed-content">
            <div class="feed-Placeholder" id="camera-feed">Camera feed not started</div>
            <div class="error-message" id="camera-error"></div>
            </div>
        </div>

        <!-- Thermal Feed -->
        <div class="feed-container">
          <div class="feed-header">
            <span>Thermal Feed</span>
          </div>
          <div class="feed-content">
            <div class="feed-Placeholder" id="thermal-feed">Thermal feed not started</div>
            <div class="error-message" id="thermal-error"></div>
          </div>
        </div>

    <div class="servo-control-panel draggable hidden" id="servo-panel">
      <div id="angle-display" class="angle-display">V: 90° | H: 90°</div>
      <div class="arrow up"></div>
      <div class="arrow-group">
        <div class="arrow left"></div>
        <div class="arrow center"></div>
        <div class="arrow right"></div>
      </div>
      <div class="arrow down"></div>
    </div>
  </div>
  </div>

<script>
    document.addEventListener('DOMContentLoaded', () => {
      // API Endpoints
      const startCameraAPI = "https://100.68.107.103:8000/start-camera";
      const stopCameraAPI = "https://100.68.107.103:8000/stop-camera";
      const startThermalAPI = "https://100.68.107.103:8000/start-thermal";
      const stopThermalAPI = "https://100.68.107.103:8000/stop-thermal";
      const cameraFeedAPI = "https://100.68.107.103:8001/camera.mjpg";
      const thermalFeedAPI = "https://100.68.107.103:8002/thermal";
      const cameraVerifiedAPI = "https://100.68.107.103:8001/camera_verified";
      const thermalVerifiedAPI = "https://100.68.107.103:8002/thermal_verified";
      const startServoAPI = "https://100.68.107.103:8000/start-servo";
      const stopServoAPI = "https://100.68.107.103:8000/stop-servo";

      // DOM elements
      const cameraFeed = document.getElementById('camera-feed');
      const thermalFeed = document.getElementById('thermal-feed');
      const cameraError = document.getElementById('camera-error');
      const thermalError = document.getElementById('thermal-error');
      const refreshBtn = document.getElementById('refresh-btn');
      const streamBtn = document.getElementById('stream-btn');
      const resetBtn = document.getElementById('reset-btn');
      
      const toggleBtn = document.getElementById('servo-toggle-btn');

      refreshBtn.disabled = true;
      refreshBtn.style.backgroundColor = '#ff4444';

      // State variables
      let isCorsVerified = false;
      let isStreaming = false;
      let isFirstClick = true;

      // Initialize UI
      streamBtn.style.backgroundColor = '#ff4444';
      streamBtn.disabled = false;

      toggleBtn.addEventListener('click', () => {
        panel.classList.toggle('hidden');
        toggleBtn.classList.toggle('active');
      });
      
      function hideLoadingState() {
        const cameraFeed = document.getElementById('camera-feed');
        const thermalFeed = document.getElementById('thermal-feed');
        
        if (cameraFeed) cameraFeed.innerHTML = '<div class="feed-Placeholder">Camera feed not available</div>';
        if (thermalFeed) thermalFeed.innerHTML = '<div class="feed-Placeholder">Thermal feed not available</div>';
      }

      // Stream button click handler
      streamBtn.addEventListener('click', async () => {
        if (isFirstClick) {
          isFirstClick = false;
          await initializeServices();
          return;
        }
        
        if (!isCorsVerified && !isStreaming) {
          showAlert('warning', 'Please verify connection first');
          return;
        }
        
        if (!isStreaming) {
          await startStream();
        } else {
          await stopStream();
        }
      });

      async function initializeServices() {
        try {
          showLoadingState();

          // Disable refresh button & set red background
          refreshBtn.disabled = true;
          refreshBtn.style.backgroundColor = '#ff4444';

          // Wait for 3.5 seconds (or 3000 ms)
          setTimeout(() => {
            refreshBtn.disabled = false;
            refreshBtn.style.backgroundColor = '';  // Reset to default
          }, 3000);

          // Start both camera and thermal services
          const servicesStarted = await Promise.all([
            fetch(startCameraAPI, { 
              method: 'GET',
              headers: {
                'Accept': 'application/json'
              }
            }),
            fetch(startThermalAPI, { 
              method: 'GET',
              headers: {
                'Accept': 'application/json'
              }
            })
          ]);
          
          const [cameraRes, thermalRes] = servicesStarted;

          // Check if either service failed
          if (!cameraRes.ok && !thermalRes.ok) {
            throw new Error(
              'Services failed to start: ' +
              'Camera: ' + cameraRes.status + ', ' +
              'Thermal: ' + thermalRes.status
            );
          }
          showAlert('info', 'Services initialized. Please verify connection');

        streamBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M16 16v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4m4-4v16" fill="none" stroke="currentColor" stroke-width="2"/></svg> Ready to Stream';
        hideLoadingState(); // Stop spinner after successful init

        } catch (error) {
          console.error('Initialization error:', error);
          showAlert('error', 'Failed to initialize services');

          hideLoadingState(); // Stop spinner on failure too
          resetStreamButton();
        }
      }

      // CORS verification
      refreshBtn.addEventListener('click', async () => {
        try {
          refreshBtn.disabled = true;
          refreshBtn.innerHTML = '<span class="refresh-spinner"></span> Verifying...';
          
          // First check if servers are reachable
          const [cameraReachable, thermalReachable] = await Promise.all([
            testConnection(cameraVerifiedAPI),
            testConnection(thermalVerifiedAPI)
          ]);
          
          if (!cameraReachable || !thermalReachable) {
            throw new Error('Servers unreachable: Camera ' + (cameraReachable ? 'OK' : 'DOWN') + 
                          ', Thermal ' + (thermalReachable ? 'OK' : 'DOWN'));
          }
          
          // Then verify endpoints
          const [cameraResponse, thermalResponse] = await Promise.all([
            fetch(cameraVerifiedAPI, { 
              headers: { 'Accept': 'application/json' }
            }).catch(e => ({ ok: false })),
            fetch(thermalVerifiedAPI, { 
              headers: { 'Accept': 'application/json' }
            }).catch(e => ({ ok: false }))
          ]);
          
          if (!cameraResponse.ok || !thermalResponse.ok) {
            throw new Error('Verification failed - check server logs');
          }
          
          isCorsVerified = true;
          streamBtn.style.backgroundColor = '#4CAF50';
          refreshBtn.innerHTML = '&#10003; Verified'; // ✓ (&#10003;) - Check 
          showAlert('success', 'Connection verified successfully!');

        const refresh = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor"/></svg> Refresh';

        } catch (error) {
          console.error('Verification error:', error);
          refreshBtn.innerHTML = '&#10005; Failed';
          showAlert('error', error.message);
        } finally {
          setTimeout(() => {
            refreshBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor"/></svg>';
            refreshBtn.disabled = false;
          }, 2000);
        }
      });

      // Test server connection using GET instead of HEAD
      async function testConnection(url) {
        try {
          const response = await fetch(url, {
            method: 'GET',
            cache: 'no-store'
          });
          return response.ok;
        } catch (error) {
          console.error('Connection failed for ' + url + ':', error);
          return false;
        }
      }
      
      async function startStream() {
      try {

        showLoadingState();

        // Start the services again in case they were stopped
        const servicesStarted = await Promise.all([
          fetch(startCameraAPI, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
          }),
          fetch(startThermalAPI, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
          })
        ]);

        const [cameraRes, thermalRes] = servicesStarted;

          // Check if either service failed
          if (!cameraRes.ok && !thermalRes.ok) {
            throw new Error(
              'Services failed to start: ' +
              'Camera: ' + cameraRes.status + ', ' +
              'Thermal: ' + thermalRes.status
            );
          }

        // Clear previous error states
        cameraFeed.innerHTML = '';
        thermalFeed.innerHTML = '';

        const cameraImg = new Image();
        cameraImg.src = cameraFeedAPI + '?t=' + Date.now();
        cameraImg.className = 'feed-image';

        cameraImg.onload = () => {
          const width = cameraImg.naturalWidth;
          const height = cameraImg.naturalHeight;
          console.log("Camera Feed Size: " + width + "x" + height);

          cameraFeed.innerHTML = '';
          cameraFeed.appendChild(cameraImg);
        };
        cameraImg.onerror = () => {
          cameraFeed.innerHTML = '<div class="feed-Placeholder">Camera feed error</div>';
          console.error('Camera stream error - retrying in 2s...');
          setTimeout(() => {
            cameraImg.src = cameraFeedAPI + '?t=' + Date.now();
          }, 2000);
        };

        const thermalImg = new Image();
        thermalImg.src = thermalFeedAPI + '?t=' + Date.now();
        thermalImg.className = 'feed-image';

        thermalImg.onload = () => {
          thermalFeed.innerHTML = '';
          thermalFeed.appendChild(thermalImg);
        };
        thermalImg.onerror = () => {
          thermalFeed.innerHTML = '<div class="feed-Placeholder">Thermal feed error</div>';
          console.error('Thermal stream error - retrying in 2s...');
          setTimeout(() => {
            thermalImg.src = thermalFeedAPI + '?t=' + Date.now();
          }, 2000);
        };

        streamBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2"/></svg> Stop Stream';
        isStreaming = true;

      } catch (error) {
        console.error('Stream start error:', error);
        showAlert('error', 'Failed to start stream');
      }
    }

      async function stopStream() {
        try {

          // Show loading spinner while stopping services
          cameraFeed.innerHTML = '<div class="loading-spinner"></div>';
          thermalFeed.innerHTML = '<div class="loading-spinner"></div>';
          
          // Attempt to stop services
          const servicesStopped = await stopServices();

          // Update UI regardless
          cameraFeed.innerHTML = '<div class="feed-Placeholder">Camera feed stopped</div>';
          thermalFeed.innerHTML = '<div class="feed-Placeholder">Thermal feed stopped</div>';
          streamBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M16 16v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4m4-4v16" fill="none" stroke="currentColor" stroke-width="2"/></svg> Start Stream';
          isStreaming = false;
          
        // Show alert depending on result
          if (servicesStopped) {
            showAlert('success', 'Stream stopped successfully');
          } else {
            showAlert('success', 'Stream stopped.');
          }
          
        } catch (error) {
          console.error('Stream stop error:', error);
          showAlert('error', 'Error stopping stream');
        }
      }

      async function stopServices() {
        const [cameraStopRes, thermalStopRes] = await Promise.all([
          fetch(stopCameraAPI, { method: 'GET' }).catch(e => ({ ok: false })),
          fetch(stopThermalAPI, { method: 'GET' }).catch(e => ({ ok: false }))
        ]);

        if (!cameraStopRes.ok || !thermalStopRes.ok) {
          throw new Error('Failed to stop services');
        }
      }

      function showLoadingState() {
        cameraFeed.innerHTML = '<div class="loading-spinner"></div>';
        thermalFeed.innerHTML = '<div class="loading-spinner"></div>';
        cameraError.textContent = '';
        thermalError.textContent = '';
      }

      function resetStreamButton() {
        streamBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M16 16v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4m4-4v16" fill="none" stroke="currentColor" stroke-width="2"/></svg> Start Stream';
        streamBtn.style.backgroundColor = '#ff4444';
        isFirstClick = true;
      }

      function showAlert(type, message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-' + type;
        alertDiv.innerHTML = [
          '<div class="alert-icon">',
          type === 'success' ? '&#10003;' : 
          type === 'error' ? '&#10005; ' : 
          type === 'info' ? '&#9432;' :
          type === 'warning' ? '&#9888;' : '',
          '</div>',
          '<div class="alert-message">', message, '</div>'
        ].join('');

        document.body.appendChild(alertDiv);

        setTimeout(() => {
          alertDiv.classList.add('fade-out');
          setTimeout(() => document.body.removeChild(alertDiv), 500);
        }, 3000);
      }

      if (!cameraReachable || !thermalReachable) {
        resetBtn.classList.remove('hidden');  // Show Reset button
        throw new Error('Servers unreachable: Camera ' + (cameraReachable ? 'OK' : 'DOWN') + 
                      ', Thermal ' + (thermalReachable ? 'OK' : 'DOWN'));
      }

      resetBtn.addEventListener('click', async () => {
      resetBtn.disabled = true;
      resetBtn.textContent = 'Resetting...';

      try {
        const [stopCameraRes, stopThermalRes] = await Promise.all([
          fetch(stopCameraAPI, { method: 'GET' }),
          fetch(stopThermalAPI, { method: 'GET' })
        ]);

        if (stopCameraRes.ok && stopThermalRes.ok) {
          showAlert('success', 'Reset completed successfully.');
          resetBtn.classList.add('hidden'); // Hide button after successful reset
        } else {
          showAlert('error', 'Reset failed. Please check server.');
        }
      } catch (error) {
        console.error('Reset failed:', error);
        showAlert('error', 'Reset failed due to network error.');
      } finally {
        resetBtn.disabled = false;
        resetBtn.textContent = 'Reset';
      }
    });


    //Servo Control Script
    const SERVER = "https://100.68.107.103:8003";  //RPi backend URL

    let servoRunning = false;  // Track state

    const controlBtn = document.getElementById('servo-toggle-btn');

    controlBtn.addEventListener('click', () => {
      const apiUrl = servoRunning ? stopServoAPI : startServoAPI;

      fetch(apiUrl, { method: 'GET' })
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          // Toggle state after successful API call
          servoRunning = !servoRunning;

          // Optional: Change button text or style based on state
          controlBtn.innerHTML = servoRunning ? '&#10006; Exit' : 'Control';
        })
        .catch(error => {
          console.error('Error calling API:', error);
        });
    });

    const panel = document.getElementById('servo-panel');
    const angleDisplay = document.getElementById('angle-display');

    let verticalAngle = 90;
    let horizontalAngle = 90;
    const maxAngle = 180;
    const minAngle = 0;
    const step = 10;

    updateAngleDisplay();

    let isDragging = false;
    let offset = { x: 0, y: 0 };

    panel.addEventListener('mousedown', (e) => {
      isDragging = true;
      offset.x = e.clientX - panel.offsetLeft;
      offset.y = e.clientY - panel.offsetTop;
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        panel.style.left = (e.clientX - offset.x) + 'px';
        panel.style.top = (e.clientY - offset.y) + 'px';
      }
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });

    const arrows = document.querySelectorAll('.arrow');

    arrows.forEach(arrow => {
      arrow.addEventListener('click', () => {
        const direction = arrow.classList.contains('up') ? 'up' :
                          arrow.classList.contains('down') ? 'down' :
                          arrow.classList.contains('left') ? 'left' :
                          arrow.classList.contains('right') ? 'right' : 'center';

        if (direction === 'up') {
          verticalAngle = Math.max(minAngle, verticalAngle - step);
          sendServoCommand('vertical', verticalAngle);
        } else if (direction === 'down') {
          verticalAngle = Math.min(maxAngle, verticalAngle + step);
          sendServoCommand('vertical', verticalAngle);
        } else if (direction === 'left') {
          horizontalAngle = Math.max(minAngle, horizontalAngle - step);
          sendServoCommand('horizontal', horizontalAngle);
        } else if (direction === 'right') {
          horizontalAngle = Math.min(maxAngle, horizontalAngle + step);
          sendServoCommand('horizontal', horizontalAngle);
        } else if (direction === 'center') {
          verticalAngle = 90;
          horizontalAngle = 90;
          sendServoCommand('vertical', verticalAngle);
          sendServoCommand('horizontal', horizontalAngle);
        }

        updateAngleDisplay();
        highlightArrow(arrow);
      });
    });

    function sendServoCommand(axis, angle) {
      fetch(SERVER + "/servo?axis=" + axis + "&angle=" + angle)
        .then(response => response.text())
        .then(data => console.log("Backend response:", data))
        .catch(error =>  console.error("Error:", error)
        );
    }

    function updateAngleDisplay() {
      angleDisplay.textContent = "V: " + verticalAngle + "° | H: " + horizontalAngle + "°";
    }

    function highlightArrow(arrow) {
      arrows.forEach(a => a.classList.remove('active'));
      arrow.classList.add('active');
      setTimeout(() => arrow.classList.remove('active'), 300);
    }    
});

</script>`;
    } else if (isPulse) {
      popupHTML = `<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  ${postMessageScript}
  ${timerScript}
  <style>
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #121212;
      color: #FFFFFF;
      margin: 0;
      padding: 0;
      height: 100vh;
      overflow: hidden;
    }
    
    .pulse-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 16px;
      box-sizing: border-box;
      gap: 16px;
      max-width: 2000px;
      margin: 0 auto;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #1E1E1E;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
    
    .controls {
      display: flex;
      gap: 12px;
    }
 
    .device-info {
      display: flex;
      flex-direction: column;
    }
 
     .device-name-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
 
    #device-timer {
      margin-left: 10px;
    }
 
    .device-name {
      font-size: 18px;
      font-weight: 600;
      color: #FF6A00;
      white-space: normal;
      overflow: visible;
      text-overflow: unset;
      word-break: break-word;
      line-height: 1.2;
      text-align: center;
    }
    
    .control-btn {
      background: #2A2A2A;
      border: none;
      color: #FFFFFF;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }
    
    .control-btn:hover {
      background: #FF6A00;
    }
    
    .control-btn.active {
      background: #FF6A00;
    }
    
    .pulse-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .pulse-viewer-container {
      flex: 1;
      background: #1E1E1E;
      border: groove 1px #7c7c7c;
      border-radius: 8px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    
    .pulse-viewer-header {
      padding: 8px 12px;
      background: rgba(0,0,0,0.3);
      font-size: 14px;
    }
    
    .pulse-viewer-content {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    
    .pulse-viewer-placeholder {
      color: #BBBBBB;
      font-size: 16px;
    }
    
    .pulse-viewer-iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
 
    .alert {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 16px;
      background: #2A2A2A;
      color: white;
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 8px;
    }
 
    .alert-success {
      border-left: 4px solid #4CAF50;
    }
 
    .alert-error {
      border-left: 4px solid #F44336;
    }
 
    .alert-info {
      border-left: 4px solid #2196F3;
    }
 
    .fade-out {
      opacity: 0;
      transition: opacity 0.5s;
    }
  </style>
</head>
<body>
  <div class="pulse-container">
    <div class="header">
      <div class="device-info">
        <div class="device-name-row">
          <div class="device-name">${device.name}</div>
          <div id="device-timer"></div>
        </div>
      </div>
      <div class="controls">
        <button class="control-btn" id="launch-btn">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Launch PulseView
        </button>
      </div>
    </div>
 
    <div class="pulse-content">
      <div class="pulse-viewer-container">
        <div class="pulse-viewer-header">
          <span>PulseView</span>
        </div>
        <div class="pulse-viewer-content">
          <div class="pulse-viewer-placeholder" id="pulse-viewer-feed">PulseView not launched</div>
          <iframe
            id="pulse-viewer-iframe"
            class="pulse-viewer-iframe"
            allow="fullscreen"
            style="display: none;"
          ></iframe>
        </div>
      </div>
    </div>
  </div>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      const launchBtn = document.getElementById('launch-btn');
      const pulseViewerFeed = document.getElementById('pulse-viewer-feed');
      const pulseViewerIframe = document.getElementById('pulse-viewer-iframe');
      const ipAddress = "${ipAddress}";
 
      function showAlert(type, message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = \`alert alert-\${type}\`;
        alertDiv.innerHTML = \`
          <div>\${message}</div>
        \`;
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
          alertDiv.classList.add('fade-out');
          setTimeout(() => document.body.removeChild(alertDiv), 500);
        }, 3000);
      }
 
      // Launch PulseView control
      launchBtn.addEventListener('click', async () => {
        if (launchBtn.textContent.includes('Launch')) {
          // Show loading state
          pulseViewerFeed.innerHTML = '<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">' +
            '<div style="border: 4px solid rgba(255, 255, 255, 0.3); border-radius: 50%; border-top: 4px solid #FF6A00; width: 40px; height: 40px; animation: spin 1s linear infinite;"></div>' +
            '<p style="margin-top: 10px;">Launching PulseView...</p>' +
            '</div>';
          
          try {
            // First call the API to launch PulseView
            const response = await fetch(\`http://\${ipAddress}:7417/launch_pulseview\`, {
              method: 'GET',
              mode: 'cors',
              headers: {
                'Accept': 'application/json'
              }
            });
 
            const data = await response.json();
            
            if (!response.ok || !data.success) {
              throw new Error(data.message || 'Failed to launch PulseView');
            }
            
            showAlert('success', 'PulseView launched successfully');
            
            // Then load the PulseView interface after a short delay to ensure it's ready
            setTimeout(() => {
              pulseViewerIframe.src = \`http://\${ipAddress}:7417/\`;
              pulseViewerIframe.onload = () => {
                pulseViewerFeed.style.display = 'none';
                pulseViewerIframe.style.display = 'block';
                launchBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> Close PulseView';
                launchBtn.classList.add('active');
              };
              
              pulseViewerIframe.onerror = () => {
                pulseViewerFeed.innerHTML = '<div style="color: #ff4d4d;">Failed to load PulseView interface</div>';
                launchBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> Retry';
                launchBtn.classList.remove('active');
              };
            }, 1000);
            
          } catch (error) {
            console.error('PulseView launch error:', error);
            pulseViewerFeed.innerHTML = \`<div style="color: #ff4d4d;">\${error.message || 'Failed to launch PulseView'}</div>\`;
            launchBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> Retry';
            showAlert('error', error.message || 'Failed to launch PulseView');
          }
        } else {
          // Close PulseView
          pulseViewerIframe.src = '';
          pulseViewerIframe.style.display = 'none';
          pulseViewerFeed.style.display = 'block';
          pulseViewerFeed.innerHTML = '<div class="pulse-viewer-placeholder">PulseView not launched</div>';
          launchBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> Launch PulseView';
          launchBtn.classList.remove('active');
        }
      });
    });
  </script>
</body>
</html>`;
    } else if (device.name.includes("PC")) {
      popupHTML = `<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  ${postMessageScript}
  ${timerScript}
  <style>
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #121212;
      color: #FFFFFF;
      margin: 0;
      padding: 0;
      height: 100vh;
      overflow: hidden;
    }
    
    .pc-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 16px;
      box-sizing: border-box;
      gap: 16px;
      max-width: 2000px;
      margin: 0 auto;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #1E1E1E;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
    
    .controls {
      display: flex;
      gap: 12px;
    }
    
    .control-btn {
      background: #2A2A2A;
      border: none;
      color: #FFFFFF;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }

    .device-info {
      display: flex;
      flex-direction: column;
    }

     .device-name-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    #device-timer {
      margin-left: 10px;
    }

    .device-name {
      font-size: 18px;
      font-weight: 600;
      color: #FF6A00;
      white-space: normal;
      overflow: visible;
      text-overflow: unset;
      word-break: break-word;
      line-height: 1.2;
      text-align: center;
    }
    
    .control-btn:hover {
      background: #FF6A00;
    }
    
    .control-btn.active {
      background: #FF6A00;
    }
    
    .pc-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .remote-desktop-container {
      flex: 1;
      background: #1E1E1E;
      border: groove 1px #7c7c7c;
      border-radius: 8px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    
    .remote-desktop-header {
      padding: 8px 12px;
      background: rgba(0,0,0,0.3);
      font-size: 14px;
    }
    
    .remote-desktop-content {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    
    .remote-desktop-placeholder {
      color: #BBBBBB;
      font-size: 16px;
    }
    
    .remote-desktop-iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
    
    .remote-desktop-controls {
      position: absolute;
      bottom: 16px;
      left: 0;
      right: 0;
      display: flex;
      justify-content: center;
      gap: 8px;
    }
    
    .remote-desktop-btn {
      background: rgba(0,0,0,0.7);
      border: none;
      color: white;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .remote-desktop-btn:hover {
      background: #FF6A00;
      transform: scale(1.1);
    }
    
    .pc-info {
      background: #1E1E1E;
      border-radius: 8px;
      padding: 16px;
    }
    
    .pc-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    
    .pc-box {
      background: #2A2A2A;
      padding: 12px;
      border-radius: 8px;
    }
    
    .pc-label {
      font-size: 12px;
      color: #BBBBBB;
      margin-bottom: 4px;
    }
    
    .pc-value {
      font-size: 14px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="pc-container">
    <div class="header">
      <div class="device-info">
        <div class="device-name-row">
          <div class="device-name">${device.name}</div>
          <div id="device-timer"></div>
        </div>
      </div>
      <div class="controls">
        <button class="control-btn" id="connect-btn">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Connect
        </button>
        <!--<button class="control-btn" id="fullscreen-btn">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Fullscreen
        </button> -->
      </div>
    </div>

    <div class="pc-content">
      <div class="remote-desktop-container">
        <div class="remote-desktop-header">
          <span>Remote Desktop</span>
        </div>
        <div class="remote-desktop-content">
          <div class="remote-desktop-placeholder" id="remote-desktop-feed">Not connected</div>
          <iframe 
            id="remote-desktop-iframe"
            class="remote-desktop-iframe"
            allow="fullscreen"
            style="display: none;"
          ></iframe>
        </div>
      </div>

      <!--<div class="pc-info">
        <div class="pc-grid">
          <div class="pc-box">
            <div class="pc-label">IP Address</div>
            <div class="pc-value">${ipAddress}</div>
          </div>
          <div class="pc-box">
            <div class="pc-label">Connection Type</div>
            <div class="pc-value">Remote Desktop</div>
          </div>
          <div class="pc-box">
            <div class="pc-label">Status</div>
            <div class="pc-value" id="status-value">Disconnected</div>
          </div>
          <div class="pc-box">
            <div class="pc-label">Last Connected</div>
            <div class="pc-value" id="last-connected">Never</div>
          </div>
        </div>
      </div>-->
    </div>
  </div>

  <script>
    document.addEventListener('DOMContentLoaded', () => {
      const connectBtn = document.getElementById('connect-btn');
      const remoteDesktopFeed = document.getElementById('remote-desktop-feed');
      const remoteDesktopIframe = document.getElementById('remote-desktop-iframe');
      const statusValue = document.getElementById('status-value');
      const lastConnected = document.getElementById('last-connected');
      const fullscreenBtn = document.getElementById('fullscreen-btn');
      
      // Connect control
      connectBtn.addEventListener('click', () => {
        if (connectBtn.textContent.includes('Connect')) {
          // Show loading state
          remoteDesktopFeed.innerHTML = '<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">' +
            '<div style="border: 4px solid rgba(255, 255, 255, 0.3); border-radius: 50%; border-top: 4px solid #FF6A00; width: 40px; height: 40px; animation: spin 1s linear infinite;"></div>' +
            '<p style="margin-top: 10px;">Connecting to ${ipAddress}...</p>' +
            '</div>';
          
          // Set up the iframe with the actual streaming URL
          remoteDesktopIframe.src = 'http://${ipAddress}/';
          remoteDesktopIframe.onload = () => {
            remoteDesktopFeed.style.display = 'none';
            remoteDesktopIframe.style.display = 'block';
            connectBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>Disconnect';
            connectBtn.classList.add('active');
            statusValue.textContent = 'Connected';
            lastConnected.textContent = new Date().toLocaleString();
          };
          
          remoteDesktopIframe.onerror = () => {
            remoteDesktopFeed.innerHTML = '<div style="color: #ff4d4d;">Connection failed. Please check the IP address and try again.</div>';
          };
        } else {
          // Disconnect
          remoteDesktopIframe.src = '';
          remoteDesktopIframe.style.display = 'none';
          remoteDesktopFeed.style.display = 'block';
          remoteDesktopFeed.innerHTML = '<div class="remote-desktop-placeholder">Not connected</div>';
          connectBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>Connect';
          connectBtn.classList.remove('active');
          statusValue.textContent = 'Disconnected';
        }
      });

      // Fullscreen control
      fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
        } else {
          if (document.exitFullscreen) {
            document.exitFullscreen();
          }
        }
      });
    });
  </script>
</body>
</html>`;
    } else {
      popupHTML = `<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  ${postMessageScript}
  ${timerScript}
  <style>
    body {
      font-family: sans-serif;
      padding: 40px;
      background: #f0f0f0;
      color: #333;
    }
  </style>
</head>
<body>
  <h2>Welcome to ${device.name}</h2>
  <div id="device-timer"></div>
  <div class="ip-container">
    <h3>Device IP Address:</h3>
    <div>
    <div class="ip-item">
      <span class="ip-type">${device.ipType}:</span> 
      <span>${ipAddress || "Not available"}</span>
    </div>
  </div>
</body>
</html>`;
    }

    const blob = new Blob([popupHTML], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    const popup = window.open(
      url,
      `device_${deviceId}`,
      "width=1000,height=700,left=100,top=100,resizable=yes"
    );

    if (!popup) {
      URL.revokeObjectURL(url);
      alert("Please allow popups for this site");
      return;
    }

    // Timer update function to send to popup
    const updatePopupTimer = () => {
      if (!popup.closed && deviceEndTime) {
        const now = new Date();
        const difference = deviceEndTime - now;
        const minutesLeft = Math.floor(difference / (1000 * 60));

        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference / (1000 * 60)) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        const timeLeft = `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
        const isLast10Minutes = minutesLeft <= 10;

        popup.postMessage(
          {
            type: "updateTimer",
            timeLeft,
            isLast10Minutes,
          },
          "*"
        );
      }
    };

    // Set up timer interval to update popup
    const timerInterval = setInterval(updatePopupTimer, 1000);
    updatePopupTimer(); // Initial update

    const cleanup = () => {
      clearInterval(timerInterval);
      URL.revokeObjectURL(url);
      setActiveDevices((prev) => prev.filter((id) => id !== deviceId));
    };

    popup.onbeforeunload = cleanup;

    const checkPopupClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkPopupClosed);
        cleanup();
      }
    }, 500);

    setActiveDevices((prev) => [...prev, deviceId]);
  };

  return (
    <div className={`dashboard-container ${isDarkTheme ? "dark-theme" : ""}`}>
      <Navbar
        isDarkTheme={isDarkTheme}
        toggleTheme={toggleTheme}
        userData={{ ...userData, device_id: deviceIdParam }} // Pass the device_id from URL params
      />

      <div className="dashboard-header">
        <button
          className="settings-toggle-btn"
          ref={settingsToggleRef}
          onClick={() => setShowSettings(!showSettings)}
        >
          <LayoutGrid size={24} color="#0971B3" />
        </button>

        {showSettings && (
          <div
            className={`settings-dropdown ${isDarkTheme ? "dark" : "light"}`}
            ref={settingsRef}
          >
            <div className="user-info">
              <div className="user-avatar">{userData.avatar}</div>
              <div className="user-details">
                <div className="user-name">{userData.name}</div>
                <div className="user-email">{userData.email}</div>
              </div>
            </div>

            <div className="theme-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={isDarkTheme}
                  onChange={toggleTheme}
                />
                <span className="slider"></span>
                <span className="theme-label">
                  {isDarkTheme ? "Dark Mode" : "Light Mode"}
                </span>
              </label>
            </div>

            <button
              className={`logout-button ${isDarkTheme ? "dark" : ""}`}
              onClick={() => {
                userData.onLogout(); // Call logout
                navigate("/auth"); // Redirect to /auth
              }}
            >
              Logout
            </button>
          </div>
        )}
      </div>

      <div className="dashboard-center-wrapper">
        <div className="dashboard-content-wrapper">
          <h1 className="dashboard-title">Device Dashboard</h1>
          <h2 className="dashboard-para">
            Control and monitor your selected devices
          </h2>
          <div className="dashboard-content">
            <div className="devices-grid">
              {selectedDevices.map((device) => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  isActive={activeDevices.includes(device.id)}
                  onClick={() => {
                    const ipInfo = deviceIpMapping[device.id];
                    openDeviceWindow(device.id, ipInfo);
                  }}
                  renderIcon={(type, color) => {
                    switch (type) {
                      case "MonitorSmartphone":
                        return <MonitorSmartphone size={32} color={color} />;
                      case "ChartColumnStacked":
                        return <ChartColumnStacked size={32} color={color} />;
                      case "ThermoCamIcon":
                        return (
                          <span
                            style={{
                              display: "flex",
                              gap: "2px",
                              alignItems: "center",
                            }}
                          >
                            <ThermometerSun size={30} color={color} />
                            <CameraIcon size={30} color={color} />
                          </span>
                        );
                      default:
                        return <MonitorSmartphone size={32} color={color} />;
                    }
                  }}
                  isDarkTheme={isDarkTheme}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
