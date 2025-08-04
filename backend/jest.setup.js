// jest.setup.js
const originalLog = console.log;
const originalError = console.error;

beforeAll(() => {
  console.log = jest.fn(); // Silence all logs
  console.error = jest.fn(); // Silence errors too (optional)
});

afterAll(() => {
  console.log = originalLog;
  console.error = originalError;
});
