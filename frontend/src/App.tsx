import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Login from "./components/Login.tsx";
import Register from "./components/Register.tsx";
import ImageUpload from "./components/ImageUpload.tsx";
import ImageGallery from "./components/ImageGallery.tsx";
import "./App.css";

interface AuthState {
  isLoggedIn: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  email: string | null;
}

function App() {
  const [authState, setAuthState] = useState<AuthState>(() => {
    const stored = localStorage.getItem("authState");
    return stored
      ? JSON.parse(stored)
      : {
          isLoggedIn: false,
          accessToken: null,
          refreshToken: null,
          userId: null,
          email: null,
        };
  });

  const [currentView, setCurrentView] = useState<"login" | "register">("login");
  const [refreshKey, setRefreshKey] = useState(0);

  // Sync authState to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("authState", JSON.stringify(authState));
  }, [authState]);

  const handleLogin = (loginData: any) => {
    setAuthState({
      isLoggedIn: true,
      accessToken: loginData.accessToken,
      refreshToken: loginData.refreshToken,
      userId: loginData.userId,
      email: loginData.email,
    });
  };

  const handleRegister = (registerData: any) => {
    setAuthState({
      isLoggedIn: true,
      accessToken: registerData.accessToken,
      refreshToken: registerData.refreshToken,
      userId: registerData.userId,
      email: registerData.email,
    });
  };

  const handleLogout = () => {
    // Clear all auth data completely
    setAuthState({
      isLoggedIn: false,
      accessToken: null,
      refreshToken: null,
      userId: null,
      email: null,
    });
    // Clear localStorage to force fresh login
    localStorage.clear();
    // Reset view to login
    setCurrentView("login");
  };

  const axiosInstance = axios.create({
    baseURL: window.location.origin,
    headers: {
      "Content-Type": "application/json",
    },
  });

  axiosInstance.interceptors.request.use((config) => {
    if (authState.accessToken) {
      config.headers.Authorization = `Bearer ${authState.accessToken}`;
    }
    console.log("Request:", config.method?.toUpperCase(), config.url);
    return config;
  });

  axiosInstance.interceptors.response.use(
    (response) => {
      console.log("Response:", response.status, response.config.url);
      return response;
    },
    async (error) => {
      const originalRequest = error.config;
      console.error(
        "Response Error:",
        error.response?.status,
        originalRequest?.url,
        error.message
      );

      if (error.response?.status === 401) {
        console.error("Unauthorized - logging out");
        handleLogout();
      }

      return Promise.reject(error);
    }
  );

  const handleImageUploaded = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Image Gallery</h1>
        {authState.isLoggedIn && (
          <div className="user-info">
            <span>Welcome, {authState.email}</span>
            <button onClick={handleLogout}>Logout</button>
          </div>
        )}
      </header>

      <main className="App-main">
        {!authState.isLoggedIn ? (
          <>
            {currentView === "login" && (
              <Login
                onLogin={handleLogin}
                onSwitchToRegister={() => setCurrentView("register")}
              />
            )}
            {currentView === "register" && (
              <Register
                onRegister={handleRegister}
                onSwitchToLogin={() => setCurrentView("login")}
              />
            )}
          </>
        ) : (
          <div className="app-content">
            <ImageUpload
              axiosInstance={axiosInstance}
              onImageUploaded={handleImageUploaded}
            />
            <ImageGallery key={refreshKey} axiosInstance={axiosInstance} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
