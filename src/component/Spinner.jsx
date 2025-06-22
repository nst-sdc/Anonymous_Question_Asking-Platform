import React from 'react';

const Spinner = ({ fullScreen = false }) => {
  return (
    <div
      className={`${
        fullScreen ? 'fixed top-0 left-0 w-screen h-dvh z-50' : ''
      } flex items-center justify-center`}
    >
      <div className="three-body">
        <div className="three-body__dot" />
        <div className="three-body__dot" />
        <div className="three-body__dot" />
      </div>
    </div>
  );
};

export default Spinner;
