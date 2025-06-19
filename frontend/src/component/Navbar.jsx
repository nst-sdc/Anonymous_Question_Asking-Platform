import React from 'react';

export default function Navbar({ username }) {
  return (
    <nav style={{ padding: '1rem', backgroundColor: '#f0f0f0' }}>
      <h3>Welcome, {username}</h3>
    </nav>
  );
}
