
// Mock for @react-native-async-storage/async-storage
// Uses browser localStorage as fallback

const AsyncStorageMock = {
  getItem: async (key) => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('AsyncStorage.getItem failed:', error);
      return null;
    }
  },
  
  setItem: async (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn('AsyncStorage.setItem failed:', error);
    }
  },
  
  removeItem: async (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('AsyncStorage.removeItem failed:', error);
    }
  },
  
  clear: async () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.warn('AsyncStorage.clear failed:', error);
    }
  },
  
  getAllKeys: async () => {
    try {
      return Object.keys(localStorage);
    } catch (error) {
      console.warn('AsyncStorage.getAllKeys failed:', error);
      return [];
    }
  }
};

module.exports = AsyncStorageMock;
module.exports.default = AsyncStorageMock; 