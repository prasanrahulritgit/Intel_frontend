import React, { useEffect } from "react";
import "./login.css";
import lucide from "lucide-react"; // install via: npm install lucide-react

const Login = () => {
  useEffect(() => {
    lucide.createIcons();

    const alerts = document.querySelectorAll(".alert");
    const togglePassword = document.querySelector("#togglePassword");
    const passwordInput = document.querySelector(".password-input");
    const icon = togglePassword ? togglePassword.querySelector("i") : null;

    if (togglePassword && passwordInput && icon) {
      togglePassword.addEventListener("mousedown", () => {
        passwordInput.setAttribute("type", "text");
        icon.setAttribute("data-lucide", "eye-off");
        lucide.createIcons();
      });

      togglePassword.addEventListener("mouseup", () => {
        passwordInput.setAttribute("type", "password");
        icon.setAttribute("data-lucide", "eye");
        lucide.createIcons();
      });

      togglePassword.addEventListener("mouseleave", () => {
        passwordInput.setAttribute("type", "password");
        icon.setAttribute("data-lucide", "eye");
        lucide.createIcons();
      });
    }

    alerts.forEach((alert) => {
      setTimeout(() => {
        alert.style.opacity = "0";
        setTimeout(() => alert.remove(), 300);
      }, 5000);
    });
  }, []);

  return (
    <div>
      {/* Logos */}
      <div className="logos">
        <img
          src="/images/RutoMatrix_Nonbackground.png"
          alt="RutoMatrix Logo"
          className="logo"
        />
        <img
          src="/images/tessolve.png"
          alt="Tessolve Logo"
          className="logo"
        />
      </div>

      {/* Login Card */}
      <div className="login-card">
        <div className="header">
          <h2>Sign In</h2>
        </div>

        {/* Example Alerts (static placeholders) */}
        <div className="alert alert-danger">
          <i data-lucide="alert-circle"></i>
          <span style={{ marginLeft: "8px" }}>Invalid credentials</span>
        </div>
        <div className="alert alert-success">
          <i data-lucide="check-circle"></i>
          <span style={{ marginLeft: "8px" }}>Login successful</span>
        </div>

        {/* Form */}
        <form method="POST" action="">
          <div className="form-group">
            <i data-lucide="user" className="icon"></i>
            <input type="text" className="form-control" placeholder=" " />
            <label>Username</label>
          </div>

          <div className="form-group password-group">
            <i data-lucide="lock" className="icon"></i>
            <input
              type="password"
              className="form-control password-input"
              placeholder=" "
            />
            <label>Password</label>

            {/* Eye Icon */}
            <span className="toggle-password" id="togglePassword">
              <i data-lucide="eye"></i>
            </span>
          </div>

          <button type="submit" className="btn-login">
            Sign In
            <i data-lucide="arrow-right"></i>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
