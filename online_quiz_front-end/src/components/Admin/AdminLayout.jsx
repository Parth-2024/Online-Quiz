import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import './AdminLayout.css'; // Import CSS file

function AdminLayout() {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h3>Admin Menu</h3>
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li>
              <NavLink
                to="/admin/dashboard"
                className="sidebar-link"
                activeClassName="sidebar-link-active"
              >
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/users"
                className="sidebar-link"
                activeClassName="sidebar-link-active"
              >
                User Management
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/quizzes"
                className="sidebar-link"
                activeClassName="sidebar-link-active"
              >
                Quiz Management
              </NavLink>
            </li>
          </ul>
        </nav>
      </aside>
      <main className="admin-content">
        <Outlet /> {/* Render nested routes here */}
      </main>
    </div>
  );
}

export default AdminLayout; // ADD THIS LINE