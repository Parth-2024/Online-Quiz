import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import './PlayerLayout.css'; // Import CSS file

function PlayerLayout() {
  return (
    <div className="player-layout">
      <header className="player-header">
        <nav className="player-nav">
          <ul>
            <li>
              <NavLink
                to="/" // Assuming "/" is the QuizList (player dashboard)
                className="player-nav-link"
                activeClassName="player-nav-link-active"
              >
                Quizzes
              </NavLink>
            </li>
          </ul>
        </nav>
      </header>
      <main className="player-content">
        <Outlet /> {/* Render nested routes here */}
      </main>
    </div>
  );
}

export default PlayerLayout;