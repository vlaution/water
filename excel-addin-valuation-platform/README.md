# Excel Add-in for Valuation Platform

This is a React-based Excel Add-in that connects to the Valuation Platform API.

## Prerequisites
- Node.js & npm
- Microsoft Excel (Desktop or Web)

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```
   This will start the dev server at `https://localhost:3000`.

## Sideloading (Testing)
1. **Excel on Web**:
   - Go to Insert > Add-ins > Manage My Add-ins > Upload My Add-in.
   - Select `manifest.xml`.

2. **Excel on Desktop (Windows)**:
   - Run `npm run sideload`.
   - Or manually share the folder as a network share and add it to the Trusted Add-in Catalogs in Excel Options.

## Features
- **Login**: Authenticate with the Valuation Platform.
- **Load to Excel**: Fetch valuation data and populate "Valuation Overview", "Financial Inputs", and "Valuation Outputs" sheets.
- **Sync to Platform**: Read data from Excel and update the valuation in the platform (Optimistic Concurrency Control via ETags).
