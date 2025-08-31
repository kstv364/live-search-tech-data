# Playwright UI Tests

This directory contains comprehensive UI tests for the BuiltWith Company Intelligence application using Playwright.

## Test Structure

### Test Files

- **`page-load.spec.ts`** - Tests for initial page load, layout, and responsive design
- **`filter-functionality.spec.ts`** - Tests for filter adding, clearing, and validation
- **`search-functionality.spec.ts`** - Tests for search operations, loading states, and error handling
- **`table-functionality.spec.ts`** - Tests for table sorting, filtering, and pagination
- **`export-functionality.spec.ts`** - Tests for CSV export features and dialogs
- **`query-preview.spec.ts`** - Tests for query preview and saved queries functionality
- **`integration.spec.ts`** - Comprehensive end-to-end workflow tests
- **`helpers.ts`** - Utility functions for common test operations

## Running Tests

### Prerequisites

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

3. Ensure the application is set up:
   ```bash
   npm run setup
   ```

### Test Commands

- **Run all tests**: `npm test`
- **Run tests with UI**: `npm run test:ui`
- **Run tests in headed mode**: `npm run test:headed`
- **Debug tests**: `npm run test:debug`

### Running Specific Tests

```bash
# Run a specific test file
npx playwright test page-load.spec.ts

# Run tests matching a pattern
npx playwright test --grep "should sort"

# Run tests in a specific browser
npx playwright test --project=chromium
```

## Test Coverage

### Core Functionality
- ✅ Page loading and layout verification
- ✅ Filter addition and removal
- ✅ Search operations with results handling
- ✅ Table sorting (ascending/descending toggle)
- ✅ Table column filtering
- ✅ Pagination controls
- ✅ Export functionality
- ✅ Query preview updates
- ✅ Responsive design testing

### User Workflows
- ✅ Complete search workflow from filters to results
- ✅ Error state handling
- ✅ State management across interactions
- ✅ Concurrent user actions

### Browser Support
- ✅ Chromium
- ✅ Firefox
- ✅ WebKit (Safari)

## Test Environment

Tests are configured to:
- Start the development server automatically
- Run in multiple browsers in parallel
- Capture screenshots on failure
- Generate detailed HTML reports
- Provide tracing for debugging

## Configuration

The tests are configured in `playwright.config.ts` with:
- Base URL: `http://localhost:3000`
- Automatic dev server startup
- Parallel execution
- Retry on CI environments
- Screenshot and trace collection

## Test Helpers

The `helpers.ts` file provides utility functions for:
- Adding technology filters
- Performing searches
- Checking result states
- Managing table interactions
- Handling export operations
- Taking debug screenshots

## Debugging Tests

1. **UI Mode**: Use `npm run test:ui` for interactive debugging
2. **Headed Mode**: Use `npm run test:headed` to see browser actions
3. **Debug Mode**: Use `npm run test:debug` to step through tests
4. **Screenshots**: Failed tests automatically capture screenshots
5. **Traces**: Enable tracing for detailed debugging information

## CI/CD Integration

Tests are configured for CI environments with:
- Retry logic for flaky tests
- Single worker for stability
- HTML report generation
- Screenshot and trace artifacts

## Writing New Tests

When adding new tests:

1. Use the helper functions in `helpers.ts`
2. Follow the existing naming conventions
3. Group related tests in `describe` blocks
4. Add proper assertions and error handling
5. Consider different viewport sizes
6. Test both success and error scenarios

## Troubleshooting

### Common Issues

1. **Tests timing out**: Increase timeout in configuration or add proper waits
2. **Flaky tests**: Add stability waits or better selectors
3. **Server startup issues**: Ensure port 3000 is available
4. **Browser installation**: Run `npx playwright install` again

### Debug Commands

```bash
# Run with verbose output
npx playwright test --reporter=line

# Generate trace for failed tests
npx playwright test --trace=on

# Run single test with debugging
npx playwright test --debug page-load.spec.ts
```
