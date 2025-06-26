// Mock for openapi-fetch to prevent MetaMask SDK errors
// This module is not needed for browser-based Dynamic authentication

const mockFetch = () => {
  console.warn('openapi-fetch called - this is mocked for browser compatibility');
  return Promise.resolve({
    data: null,
    error: new Error('openapi-fetch is mocked - not available in browser'),
    response: new Response()
  });
};

// Mock the default export function
const openapiMock = () => ({
  GET: mockFetch,
  POST: mockFetch,
  PUT: mockFetch,
  DELETE: mockFetch,
  OPTIONS: mockFetch,
  HEAD: mockFetch,
  PATCH: mockFetch,
  TRACE: mockFetch
});

// Export as both default and named export to handle different import styles
module.exports = openapiMock;
module.exports.default = openapiMock;
module.exports.createClient = openapiMock; 