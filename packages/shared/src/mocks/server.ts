import { setupServer } from 'msw/node';
import { rest } from 'msw';

// Define your mock handlers here
const handlers = [
  // Example handler for API endpoints
  rest.get('*/api/*', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        message: 'Mocked response',
      })
    );
  }),
];

// Create and export the server instance
export const server = setupServer(...handlers); 