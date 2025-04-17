import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import apiClient from "../utils/axiosConfig";
import { getSearchList, SearchList } from "./SearchList";
import "./TopBar.css";

const TopBar = () => {
  const history = useHistory();
  const [user, setUser] = useState(null);
  const [searchList, setSearchList] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  useEffect(() => {
    const initialSearchList = async () => {
      const list = await getList();
      setSearchList(list);
    };
    initialSearchList();
  }, []);

  useEffect(() => {
    if (searchInput.trim() !== "") {
      const results = getSearchList({ input: searchInput, list: searchList });
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchInput, searchList]);

  const handleSearchBlur = () => {
    setTimeout(() => {
      setIsSearchFocused(false);
    }, 100);
  };

  return (
    <div className="topbar">
      <div className="search-container">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={handleSearchBlur}
          />
        </div>
        {(isSearchFocused && searchResults.length > 0) && (
          <SearchList searchResults={searchResults} />
        )}
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

const getList = async () => {
  const response = await apiClient.get('/v1/invoices/list');
  if (response.status === 200) {
    return response.data.data.invoices;
  } else if (response.status === 401) {
    history.push("/login");
    return [];
  } else {
    console.log("Failed to fetch search list");
    return [];
  }
}

export default TopBar;
