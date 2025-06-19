import { useState } from 'react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white shadow-md fixed w-full z-10 top-0 left-0">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <div className="text-xl font-bold">Anon Platform</div>
        <div className="hidden md:flex space-x-6">
          <a href="#" className="text-gray-700 hover:text-blue-600">Home</a>
          <a href="#" className="text-gray-700 hover:text-blue-600">Ask</a>
          <a href="#" className="text-gray-700 hover:text-blue-600">About</a>
        </div>
        <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)} className="text-gray-700 text-2xl focus:outline-none">
            ☰
          </button>
        </div>
      </div>
      {isOpen && (
        <div className="md:hidden px-4 pb-4">
          <a href="#" className="block text-gray-700 py-1 hover:text-blue-600">Home</a>
          <a href="#" className="block text-gray-700 py-1 hover:text-blue-600">Ask</a>
          <a href="#" className="block text-gray-700 py-1 hover:text-blue-600">About</a>
        </div>
      )}
    </nav>
  );
}

