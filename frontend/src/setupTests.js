// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock the scrollTo function
window.scrollTo = jest.fn();

// Mock the ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserverMock;

// Mock the localStorage API
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

// Mock the navigator.clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn(),
  },
});

// Mock the react-toastify module
jest.mock('react-toastify', () => {
  const actual = jest.requireActual('react-toastify');
  return {
    ...actual,
    toast: {
      ...actual.toast,
      success: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      dismiss: jest.fn(),
      isActive: jest.fn(),
      update: jest.fn(),
    },
    ToastContainer: () => <div data-testid="toast-container">ToastContainer</div>,
  };
});

// Mock the uuid module
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('test-uuid'),
  v1: jest.fn().mockReturnValue('test-uuid-v1'),
  validate: jest.fn().mockReturnValue(true),
  version: jest.fn().mockReturnValue(4),
}));

// Mock the react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useParams: () => ({}),
  useLocation: () => ({}),
  Link: ({ children, ...props }) => <a {...props}>{children}</a>,
  NavLink: ({ children, ...props }) => <a {...props}>{children}</a>,
}));

// Mock the react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { changeLanguage: jest.fn() },
  }),
  initReactI18next: { type: '3rdParty', init: jest.fn() },
}));

// Mock the react-helmet-async
jest.mock('react-helmet-async', () => ({
  Helmet: () => null,
  HelmetProvider: ({ children }) => children,
}));

// Add a mock for the IntersectionObserver
class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: IntersectionObserver,
});

Object.defineProperty(global, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: IntersectionObserver,
});

// Mock the scrollIntoView method
Element.prototype.scrollIntoView = jest.fn();
