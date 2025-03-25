import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../../stores/authStore';
import './UserManagement.css'; // Import CSS file

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const { accessToken } = useAuthStore();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:5000/api/auth/users', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        setUsers(response.data.users);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch users');
      }
    };

    fetchUsers();
  }, [accessToken]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.put(
        `http://127.0.0.1:5000/api/auth/users/${userId}`,
        { role: newRole },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      // Refresh user list after role change
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update role');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
        try {
            await axios.delete(`http://127.0.0.1:5000/api/auth/users/${userId}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            // Remove the deleted user from the state
            setUsers(users.filter(user => user.user_id !== userId));
        } catch (err) {
            console.error('Error deleting user:', err);
            setError(err.response?.data?.error || 'Failed to delete user');
        }
    }
};

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:5000/api/auth/users', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setUsers(response.data.users);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch users');
    }
  };

  return (
    <div className="user-management-container">
      <h2 className="user-management-heading">User Management</h2>
      {error && <p className="user-error">{error}</p>}
      <table className="user-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.user_id}>
              <td>{user.user_name}</td>
              <td>{user.email}</td>
              <td>
                <select
                  className="role-select"
                  value={user.role}
                  onChange={(e) =>
                    handleRoleChange(user.user_id, e.target.value)
                  }
                >
                  <option value="player">Player</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td>
                <button
                  className="delete-button"
                  onClick={() => handleDeleteUser(user.user_id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UserManagement;