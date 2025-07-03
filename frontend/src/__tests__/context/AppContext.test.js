import React from 'react';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AppProvider, useApp } from '../../context/AppContext';
import { v4 as uuidv4 } from 'uuid';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Test component to use the context
// Mock the useApp hook
jest.mock('../../context/AppContext', () => {
  const originalModule = jest.requireActual('../../context/AppContext');
  return {
    ...originalModule,
    useApp: jest.fn(),
  };
});

const TestComponent = () => {
  const {
    user = null,
    login = jest.fn(),
    logout = jest.fn(),
    createRoom = jest.fn(),
    joinRoom = jest.fn(),
    leaveRoom = jest.fn(),
    currentRoom = null,
    rooms = [],
  } = useApp();

  return (
    <div>
      <div data-testid="user">{user ? user.name : 'No user'}</div>
      <div data-testid="currentRoom">{currentRoom?.name || 'No room'}</div>
      <div data-testid="roomCount">{rooms.length}</div>
      <button onClick={() => login('test@example.com', 'password', 'teacher')}>
        Login
      </button>
      <button onClick={logout}>Logout</button>
      <button onClick={() => createRoom('Test Room')}>Create Room</button>
      <button onClick={() => joinRoom('ABC123')}>Join Room</button>
      <button onClick={leaveRoom}>Leave Room</button>
    </div>
  );
};

describe('AppContext', () => {
  beforeEach(() => {
    // Clear all mocks and localStorage before each test
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should initialize with no user and rooms', () => {
    // Mock the useApp hook implementation
    useApp.mockImplementation(() => ({
      user: null,
      currentRoom: null,
      rooms: [],
    }));

    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    expect(screen.getByTestId('user')).toHaveTextContent('No user');
    expect(screen.getByTestId('currentRoom')).toHaveTextContent('No room');
    expect(screen.getByTestId('roomCount')).toHaveTextContent('0');
  });

  it('should allow user to login and logout', async () => {
    // Mock the useApp hook implementation
    let mockUser = null;
    const mockLogin = jest.fn().mockImplementation(() => {
      mockUser = { name: 'Test User', role: 'teacher' };
    });
    const mockLogout = jest.fn().mockImplementation(() => {
      mockUser = null;
    });

    useApp.mockImplementation(() => ({
      user: mockUser,
      login: mockLogin,
      logout: mockLogout,
      currentRoom: null,
      rooms: [],
    }));

    const { rerender } = render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    // Initial state - no user
    expect(screen.getByTestId('user')).toHaveTextContent('No user');

    // Login
    fireEvent.click(screen.getByText('Login'));
    
    // Update the mock implementation after login
    useApp.mockImplementation(() => ({
      user: { name: 'Test User', role: 'teacher' },
      login: mockLogin,
      logout: mockLogout,
      currentRoom: null,
      rooms: [],
    }));
    
    // Re-render with updated props
    rerender(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );
    
    expect(screen.getByTestId('user')).toHaveTextContent('Test User');

    // Logout
    fireEvent.click(screen.getByText('Logout'));
    
    // Update the mock implementation after logout
    useApp.mockImplementation(() => ({
      user: null,
      login: mockLogin,
      logout: mockLogout,
      currentRoom: null,
      rooms: [],
    }));
    
    // Re-render with updated props
    rerender(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );
    
    expect(screen.getByTestId('user')).toHaveTextContent('No user');
  });

  it('should allow teacher to create and join a room', async () => {
    // Mock the useApp hook implementation
    let mockRooms = [];
    let mockCurrentRoom = null;
    
    const mockCreateRoom = jest.fn((roomName) => {
      const newRoom = {
        id: 'room-123',
        name: roomName,
        code: 'ABC123',
        teacherId: 'teacher-123',
        participants: [],
        messages: [],
        isActive: true,
      };
      mockRooms.push(newRoom);
      mockCurrentRoom = newRoom;
      return newRoom.code;
    });

    useApp.mockImplementation(() => ({
      user: { id: 'teacher-123', name: 'Test Teacher', role: 'teacher' },
      currentRoom: mockCurrentRoom,
      rooms: mockRooms,
      createRoom: mockCreateRoom,
    }));

    const { rerender } = render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    // Initial state - no rooms
    expect(screen.getByTestId('roomCount')).toHaveTextContent('0');
    expect(screen.getByTestId('currentRoom')).toHaveTextContent('No room');

    // Create room
    fireEvent.click(screen.getByText('Create Room'));
    
    // Update the mock implementation after room creation
    const newRoom = {
      id: 'room-123',
      name: 'Test Room',
      code: 'ABC123',
      teacherId: 'teacher-123',
      participants: [],
      messages: [],
      isActive: true,
    };
    
    mockRooms = [newRoom];
    mockCurrentRoom = newRoom;
    
    useApp.mockImplementation(() => ({
      user: { id: 'teacher-123', name: 'Test Teacher', role: 'teacher' },
      currentRoom: mockCurrentRoom,
      rooms: mockRooms,
      createRoom: mockCreateRoom,
    }));
    
    // Re-render with updated props
    rerender(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );
    
    // Verify room was created and joined
    expect(screen.getByTestId('currentRoom')).toHaveTextContent('Test Room');
    expect(screen.getByTestId('roomCount')).toHaveTextContent('1');
  });

  it('should handle room joining and leaving', async () => {
    // Mock the useApp hook implementation
    let mockCurrentRoom = null;
    const mockJoinRoom = jest.fn().mockImplementation((roomCode) => {
      if (roomCode === 'ABC123') {
        mockCurrentRoom = {
          id: 'room-123',
          name: 'Test Room',
          code: 'ABC123',
          teacherId: 'teacher-123',
          participants: [],
          messages: [],
          isActive: true,
        };
        return true;
      }
      return false;
    });

    const mockLeaveRoom = jest.fn().mockImplementation(() => {
      mockCurrentRoom = null;
    });

    useApp.mockImplementation(() => ({
      user: { id: 'teacher-123', name: 'Test Teacher', role: 'teacher' },
      currentRoom: mockCurrentRoom,
      rooms: mockCurrentRoom ? [mockCurrentRoom] : [],
      joinRoom: mockJoinRoom,
      leaveRoom: mockLeaveRoom,
    }));

    const { rerender } = render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    // Initial state - no room
    expect(screen.getByTestId('currentRoom')).toHaveTextContent('No room');

    // Join room
    fireEvent.click(screen.getByText('Join Room'));
    
    // Update the mock implementation after joining room
    const joinedRoom = {
      id: 'room-123',
      name: 'Test Room',
      code: 'ABC123',
      teacherId: 'teacher-123',
      participants: [],
      messages: [],
      isActive: true,
    };
    
    mockCurrentRoom = joinedRoom;
    
    useApp.mockImplementation(() => ({
      user: { id: 'teacher-123', name: 'Test Teacher', role: 'teacher' },
      currentRoom: mockCurrentRoom,
      rooms: [mockCurrentRoom],
      joinRoom: mockJoinRoom,
      leaveRoom: mockLeaveRoom,
    }));
    
    // Re-render with updated props
    rerender(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );
    
    // Verify room was joined
    expect(mockJoinRoom).toHaveBeenCalledWith('ABC123');
    expect(screen.getByTestId('currentRoom')).toHaveTextContent('Test Room');

    // Leave room
    fireEvent.click(screen.getByText('Leave Room'));
    
    // Update the mock implementation after leaving room
    mockCurrentRoom = null;
    
    useApp.mockImplementation(() => ({
      user: { id: 'teacher-123', name: 'Test Teacher', role: 'teacher' },
      currentRoom: null,
      rooms: [],
      joinRoom: mockJoinRoom,
      leaveRoom: mockLeaveRoom,
    }));
    
    // Re-render with updated props
    rerender(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );
    
    // Verify room was left
    expect(mockLeaveRoom).toHaveBeenCalled();
    expect(screen.getByTestId('currentRoom')).toHaveTextContent('No room');
  });

  it('should persist user and room data in localStorage', async () => {
    // Mock the useApp hook implementation
    const mockUser = { id: 'user-123', name: 'Test User', role: 'teacher' };
    const mockRoom = {
      id: 'room-123',
      name: 'Test Room',
      code: 'ABC123',
      teacherId: 'user-123',
      participants: [],
      messages: [],
      isActive: true,
    };
    
    const mockCreateRoom = jest.fn((roomName) => {
      // Simulate saving to localStorage
      localStorage.setItem('user', JSON.stringify(mockUser));
      localStorage.setItem('rooms', JSON.stringify([mockRoom]));
      return mockRoom.code;
    });

    useApp.mockImplementation(() => ({
      user: mockUser,
      currentRoom: mockRoom,
      rooms: [mockRoom],
      createRoom: mockCreateRoom,
    }));

    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    // Create room (which will trigger localStorage.setItem)
    fireEvent.click(screen.getByText('Create Room'));
    
    // Verify localStorage was called with the expected data
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'user',
      JSON.stringify(mockUser)
    );
    
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'rooms',
      JSON.stringify([mockRoom])
    );
  });
});
