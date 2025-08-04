import React, { useState } from "react";
import "./Login.css"; 
import logo from '../assets/logo.png';
import google from '../assets/google.jpg';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="login-container">
      <div className="login-box">
        <img src={logo} alt="Login Icon" className="login-icon" />
        <h2>Log In</h2>
        <p>Start streamlining your projects and collaboration.</p>
        <form>
          <input type="text" placeholder="Username" required />
          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              required
            />
            <span
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              👁
            </span>
          </div>
          <button type="submit" className="login-button">Login</button>
          <div className="login-footer">
            <a href="#">Forgot Password?</a>
          </div>
        </form>
        <div className="divider">
          <hr /> <span>OR</span> <hr />
        </div>
        <button className="google-login">
          <img src={google} alt=" google Icon" className="google-icon" /> 
           Continue with Google
        </button>
      </div>
    </div>
  );
}
