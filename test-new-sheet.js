const { google } = require('googleapis');
require('dotenv').config();

async function testNewSheet() {
  try {
    console.log('Testing connection to new sheet...');
    
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    console.log('Attempting to read new sheet:', process.env.MASTER_SHEET_ID);
    console.log('Tab: [Mai] PL Active students_Updated');
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.MASTER_SHEET_ID,
      range: "'[Mai] PL Active students_Updated'!A1:AE10", // Test first 10 rows
    });

    console.log('Success! Retrieved', response.data.values?.length || 0, 'rows');
    console.log('Headers:', response.data.values?.[0]?.slice(0, 5)); // First 5 columns
    console.log('Sample row:', response.data.values?.[1]?.slice(0, 5)); // Second row, first 5 columns
    console.log('Column AD (index 29):', response.data.values?.[1]?.[29]);
    console.log('Column AE (index 30):', response.data.values?.[1]?.[30]);
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.code) console.error('Error code:', error.code);
  }
}

testNewSheet();