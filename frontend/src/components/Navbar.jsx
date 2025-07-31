import React from 'react';
import Navbar from '../components/Navbar';

export default function ProfilePage({ profile }) {
  // Backend should pass this object:
  const {
    email = 'jdoe.copilot@example.com',
    username = 'jdoe.mobbin@gmail.com',
    avatar = '', // if empty, fallback will be used
    linkedAccounts = {
      google: 'jdoe.copilot@gmail.com',
      slack: '@jdoe-dev',
      jira: 'jdoe'
    }
  } = profile || {};

  const defaultAvatar = 'https://img.icons8.com/arcade/64/c-key.png';
  const userAvatar = avatar || defaultAvatar;

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Navbar />

      <main className="container-fluid flex-grow-1 p-4">
        <h2 className="mb-4 fw-bold">User Profile</h2>

        {/* Profile Header */}
        <div className="card p-4 mb-4 d-flex flex-column flex-md-row align-items-center align-items-md-start text-center text-md-start shadow-sm gap-4">
          <img
            src={userAvatar}
            alt="User Avatar"
            width="100"
            height="100"
            className="rounded-circle"
            style={{ objectFit: 'cover' }}
          />
          <div>
            <h4 className="fw-bold mb-1">{email}</h4>
            <p className="text-muted small mb-2">{username}</p>
            <button className="btn btn-outline-primary btn-sm">Edit Profile</button>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="row gy-4">
          {/* Account Settings */}
          <div className="col-12 col-lg-6">
            <div className="card p-4 shadow-sm h-100">
              <h5 className="fw-bold mb-3">Account Settings</h5>
              <div className="mb-3">
                <i className="bi bi-lock me-2"></i>
                <strong>Change Password</strong>
              </div>
              <div className="mb-3">
                <i className="bi bi-shield-lock me-2"></i>
                <strong>Two-Factor Authentication</strong>
              </div>
              <div className="text-danger">
                <i className="bi bi-trash3 me-2"></i>
                <strong>Delete Account</strong>
              </div>
            </div>
          </div>

          {/* Privacy + Linked Accounts */}
          <div className="col-12 col-lg-6">
            <div className="card p-4 mb-4 shadow-sm h-100">
              <h5 className="fw-bold mb-3">Privacy Settings</h5>
              <div className="form-check mb-2">
                <input className="form-check-input" type="checkbox" id="dataSharing" />
                <label className="form-check-label" htmlFor="dataSharing">
                  Allow data sharing with third-party partners
                </label>
              </div>
              <div className="form-check">
                <input className="form-check-input" type="checkbox" id="adsPersonalization" defaultChecked />
                <label className="form-check-label" htmlFor="adsPersonalization">
                  Receive personalized advertisements
                </label>
              </div>
            </div>

            {/* Linked Accounts */}
            <div className="card p-4 shadow-sm">
              <h5 className="fw-bold mb-3">Linked Accounts</h5>
              {Object.entries(linkedAccounts).map(([platform, account], idx) => (
                <div className="d-flex justify-content-between align-items-center mb-2" key={idx}>
                  <span className="fw-semibold text-capitalize">{platform}</span>
                  <span className="text-muted small">{account}</span>
                  <button className="btn btn-sm btn-outline-danger">Disconnect</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
