# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Private Language (PL) Sheet Tracker - a Node.js Express web application that monitors Google Sheets for language lesson tracking. The application provides a dashboard to track student lesson sheets, their update status, and teacher assignments.

## Architecture

The application follows a simple client-server architecture:

- **Backend**: Express.js server (`server.js`) that integrates with Google Sheets and Drive APIs
- **Frontend**: Single-page vanilla HTML/CSS/JavaScript dashboard (`public/index.html`)
- **Data Source**: Google Sheets containing student information and individual lesson tracking sheets

### Key Components

- **Google API Integration**: Uses googleapis library with service account authentication
- **Sheet Monitoring**: Tracks last modified dates using Google Drive API to determine update status
- **Status Calculation**: Different logic for Private vs Group lessons (Private: 7-day due soon, 10.5-day overdue; Group: 24-hour due soon, 48-hour overdue)
- **Teacher Data Cleaning**: Filters and deduplicates teacher names from sheet data

## Common Development Commands

```bash
# Start the server in development mode with auto-restart
npm run dev

# Start the server in production mode
npm start

# Test Google Sheets API connection
node test-api.js

# Test specific sheet tab connection
node test-new-sheet.js

# Test server API endpoints
node test-server.js
```

## Environment Configuration

Copy `.env.example` to `.env` and configure:
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`: Service account email for Google API access
- `GOOGLE_PRIVATE_KEY`: Private key for service account authentication  
- `MASTER_SHEET_ID`: ID of the master Google Sheet containing student data
- `PORT`: Server port (defaults to 3000)

## Data Flow

1. Server reads student data from the `[Mai] PL Active students_Updated` tab in the master sheet
2. For each student, it extracts sheet ID (column AD) and current teachers (column AE)
3. Uses Google Drive API to get actual last modified dates for individual lesson sheets
4. Calculates status based on lesson type and time since last update
5. Frontend displays dashboard with filtering and real-time status updates

## Testing

Use the provided test scripts to verify different aspects:
- `test-api.js`: Tests basic Google Sheets API connectivity
- `test-new-sheet.js`: Tests access to the specific data tab and columns
- `test-server.js`: Tests the running server's API endpoints