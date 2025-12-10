import React, { useState, useEffect } from "react";
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

  const [currentView, setCurrentView] = useState<"login" | "register" | "app">(
    () => {
      const stored = localStorage.getItem("authState");
      return stored ? "app" : "login";
    }
  );

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    localStorage.setItem("authState", JSON.stringify(authState));
    if (authState.isLoggedIn) {
      setCurrentView("app");
    }
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
    setAuthState({
      isLoggedIn: false,
      accessToken: null,
      refreshToken: null,
      userId: null,
      email: null,
    });
    localStorage.removeItem("authState");
    setCurrentView("login");
  };

  const handleImageUploaded = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const axiosInstance = axios.create({
    baseURL: "/",
    headers: {
      "Content-Type": "application/json",
    },
  });

  axiosInstance.interceptors.request.use((config) => {
    if (authState.accessToken) {
      config.headers.Authorization = `Bearer ${authState.accessToken}`;
    }
    return config;
  });

  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (
        error.response?.status === 401 &&
        !originalRequest._retry &&
        authState.refreshToken
      ) {
        originalRequest._retry = true;

        try {
          const response = await axios.post("/api/auth/refresh", {
            refreshToken: authState.refreshToken,
          });

          const newAccessToken = response.data.accessToken;
          setAuthState((prev) => ({
            ...prev,
            accessToken: newAccessToken,
          }));

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          handleLogout();
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );

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
        {currentView === "login" && !authState.isLoggedIn && (
          <Login
            onLogin={handleLogin}
            onSwitchToRegister={() => setCurrentView("register")}
          />
        )}

        {currentView === "register" && !authState.isLoggedIn && (
          <Register
            onRegister={handleRegister}
            onSwitchToLogin={() => setCurrentView("login")}
          />
        )}

        {currentView === "app" && authState.isLoggedIn && (
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
