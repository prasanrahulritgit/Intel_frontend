import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import rutomatrixLogo from "../../assets/images/rutomatrix.png";
import tessolveLogo from "../../assets/images/tessolve.png";
import "./Navbar.css";
import { ChevronLeft, TimerIcon } from 'lucide-react'; 

const Navbar = ({ isDarkTheme, toggleTheme, userData }) => {
  // State and ref declarations
  const [timeLeft, setTimeLeft] = useState(null);
  const [deviceName, setDeviceName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLast10Minutes, setIsLast10Minutes] = useState(false);
  
  const timerRef = useRef(null);
  const alertShownRef = useRef({
    thirtyMinutes: false,
    tenMinutes: false,
    expired: false
  });

  // Navigation handlers
  const handleBackToReservations = () => {
    window.location.href = "http://127.0.0.1:5000/reservations";
  };

  const navigateToReservations = () => {
    window.location.href = "http://127.0.0.1:5000/reservations";
  };

const fetchDeviceData = async (deviceId) => {
  try {
    setIsLoading(true);
    setError(null);

    const token = localStorage.getItem('access_token');
    const response = await fetch('http://127.0.0.1:5000/api/booked-devices', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.data?.success || !response.data?.data?.booked_devices) {
      throw new Error('Failed to load device data');
    }

    const bookedDevices = response.data.data.booked_devices;
    const device = bookedDevices.find(d => 
      d.device?.id === deviceId || 
      d.id === deviceId.toString()
    );

    if (!device) {
      throw new Error(`Device ${deviceId} not found in bookings`);
    }

    return {
      name: `Device ${device.device?.id || device.id}`,
      endTime: new Date(device.time?.end)
    };
  } catch (error) {
    console.error('API request failed:', error);
    setError(error.message || 'Failed to load device data');
    return null;
  } finally {
    setIsLoading(false);
  }
};

  // Alert and sound functions
  const playAlertSound = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');
      audio.volume = 0.3;
      audio.play().catch(e => console.log('Audio play failed:', e));
    } catch (e) {
      console.log('Audio error:', e);
    }
  };

  const showAlert = (message) => {
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

  // Countdown timer logic
  const startCountdown = (endTime, deviceName) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    alertShownRef.current = {
      thirtyMinutes: false,
      tenMinutes: false,
      expired: false,
      isAlertActive: false
    };
    setIsLast10Minutes(false);

    timerRef.current = setInterval(async () => {
      const now = new Date();
      const difference = endTime - now;
      const minutesLeft = Math.floor(difference / (1000 * 60));

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference / (1000 * 60)) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);

      if (minutesLeft <= 10 && !isLast10Minutes) {
        setIsLast10Minutes(true);
      }

      if (difference <= 0) {
        clearInterval(timerRef.current);
        setTimeLeft('00:00:00');
        if (!alertShownRef.current.expired) {
          await showAlert(`Your booking for ${deviceName} has expired!`);
          alertShownRef.current.expired = true;
          setTimeout(navigateToReservations, 1000);
        }
      } else if (minutesLeft === 10 && !alertShownRef.current.tenMinutes) {
        await showAlert(`Warning: Only 10 minutes left for ${deviceName}`);
        alertShownRef.current.tenMinutes = true;
      } else if (minutesLeft === 30 && !alertShownRef.current.thirtyMinutes) {
        await showAlert(`Warning: Only 30 minutes left for ${deviceName}`);
        alertShownRef.current.thirtyMinutes = true;
      }
    }, 1000);
  };

  // Effect for initializing and refreshing timer
  useEffect(() => {
    if (!userData?.device_id) {
      setError('No device selected');
      setIsLoading(false);
      return;
    }

    const initializeTimer = async () => {
      const deviceData = await fetchDeviceData(userData.device_id);
      if (deviceData) {
        setDeviceName(deviceData.name);
        startCountdown(deviceData.endTime, deviceData.name);
      } else {
        setTimeLeft(null);
      }
    };

    initializeTimer();

    const refreshInterval = setInterval(initializeTimer, 60000);

    return () => {
      clearInterval(timerRef.current);
      clearInterval(refreshInterval);
    };
  }, [userData?.device_id]);

  // Render component
  return (
    <div className={`navbar-container ${isDarkTheme ? "dark" : ""}`}>
      <header className="navbar1">
        <div className="navbar-left">
          <img src={rutomatrixLogo} alt="Rutomatrix Logo" className="logo" />
        </div>
        <div className="navbar-right">
          <button 
            className="back-button" 
            onClick={handleBackToReservations}
          >
            <ChevronLeft 
              size={24} 
              className="back-icon"
            />
            <span className="back-text">Back</span>
          </button>

          {isLoading ? (
            <div className="timer-loading">Loading...</div>
          ) : error ? (
            <div className="timer-error">{error}</div>
          ) : timeLeft ? (
            <div className={`device-timer`}>
              <span className="Device-name" title={deviceName}>
                {deviceName.length > 12 ? `${deviceName.substring(0, 10)}...` : deviceName} -
              </span>
              <span className={`timer ${isLast10Minutes ? 'last-10-minutes' : ''}`}> 
                <TimerIcon size={20} style={{ marginRight: '4px'}} /> {timeLeft} 
              </span>
            </div>
          ) : (
            <div className="timer-error">No active booking</div>
          )}
          <img src={tessolveLogo} alt="Tessolve Logo" className="logo" />
        </div>
      </header>
    </div>
  );
};

export default Navbar;