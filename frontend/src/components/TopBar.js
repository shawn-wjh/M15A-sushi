import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";

const TopBar = () => {
  const history = useHistory();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      history.push("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
    } catch (e) {
      console.error("Failed to parse user data");
      history.push("/login");
    }
  }, [history]);

  return (
    <div className="topbar">
      <div className="search-bar">
        <input type="text" placeholder="Search..." />
      </div>
      <div className="user-menu">
        <div className="notification-icon"></div>
        <div className="user-info">
          <span className="user-name">{user?.name || user?.email}</span>
          <div className="user-avatar">
            {user?.name
              ? user.name[0].toUpperCase()
              : user?.email[0].toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
