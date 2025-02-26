import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function App() {
  const [message, setMessage] = useState('Loading...');

  useEffect(() => {
    axios.get(process.env.REACT_APP_API_URL)
      .then(response => setMessage(response.data))
      .catch(error => setMessage('Error fetching data'));
  }, []);

  return <h1>{message}</h1>;
}
