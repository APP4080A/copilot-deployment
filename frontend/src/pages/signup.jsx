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
        <h2>Create Your Co-pilot Account</h2>
        <p>Start streamlining your projects and collaboration.</p>
        <form>
          <button type="submit" className="login-button" id="signup">Sign Up</button>
          <button type="submit" className="login-button" id="login">Login</button>
          <input type="text" placeholder="Full Name" required />
          <input type="text" placeholder="Email" required />
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
          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm Password"
              required
            />
            <span
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              👁
            </span>
          </div>
          <button type="submit" className="login-button">Sign Up</button>
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
