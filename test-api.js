const { google } = require('googleapis');
require('dotenv').config();

async function testGoogleSheetsAPI() {
  try {
    console.log('Testing Google Sheets API connection...');
    
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    console.log('Attempting to read sheet:', process.env.MASTER_SHEET_ID);
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.MASTER_SHEET_ID,
      range: 'A:J',
    });

    console.log('Success! Retrieved', response.data.values?.length || 0, 'rows');
    console.log('First row:', response.data.values?.[0]);
    console.log('Second row:', response.data.values?.[1]);
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.code) console.error('Error code:', error.code);
  }
}

testGoogleSheetsAPI();