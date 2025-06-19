const express = require('express');
const { google } = require('googleapis');
require('dotenv').config();
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Google Sheets setup
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets.readonly',
    'https://www.googleapis.com/auth/drive.readonly'
  ],
});

const sheets = google.sheets({ version: 'v4', auth });
const drive = google.drive({ version: 'v3', auth });

// Helper function to clean up teacher names - remove duplicates and filter out non-names
function cleanTeacherNames(teacherString) {
  if (!teacherString) return '';
  
  // Split by comma and clean each name
  const names = teacherString.split(',')
    .map(name => name.trim())
    .filter(name => name && name.length > 0)
    .filter(name => !['Instructor', 'instructor', 'Teacher', 'teacher'].includes(name))
    .filter(name => name.length > 1); // Filter out single characters
  
  // Remove duplicates using Set
  const uniqueNames = [...new Set(names)];
  
  return uniqueNames.join(', ');
}

// Helper function to get actual last modified date and user from Google Drive
async function getSheetLastModified(sheetId) {
  try {
    if (!sheetId || sheetId.trim() === '') return null;
    
    const response = await drive.files.get({
      fileId: sheetId,
      fields: 'modifiedTime,name,lastModifyingUser'
    });
    
    return {
      lastModified: response.data.modifiedTime,
      name: response.data.name,
      lastModifiedBy: response.data.lastModifyingUser?.displayName || response.data.lastModifyingUser?.emailAddress || 'Unknown'
    };
  } catch (error) {
    console.error(`Error getting sheet info for ${sheetId}:`, error.message);
    return null;
  }
}

// Helper function to calculate status based on lesson type and last modified date
function calculateStatus(actualLastModified, lessonType) {
  if (!actualLastModified) return 'unknown';
  
  const lastModifiedDate = new Date(actualLastModified);
  const now = new Date();
  const hoursSinceUpdate = Math.floor((now - lastModifiedDate) / (1000 * 60 * 60));
  const daysSinceUpdate = Math.floor(hoursSinceUpdate / 24);
  
  // Different logic for Private vs Group lessons
  const isGroupLesson = lessonType && lessonType.toLowerCase().includes('group');
  
  if (isGroupLesson) {
    // Group lessons: due soon after 24 hours, overdue after 48 hours
    if (hoursSinceUpdate <= 24) return 'up-to-date';
    if (hoursSinceUpdate <= 48) return 'due-soon';
    return 'overdue';
  } else {
    // Private lessons: due soon after 7 days, overdue after 10.5 days (1.5 weeks)
    if (daysSinceUpdate <= 7) return 'up-to-date';
    if (daysSinceUpdate <= 10.5) return 'due-soon';
    return 'overdue';
  }
}

// API Routes
app.get('/api/sheets', async (req, res) => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.MASTER_SHEET_ID,
      range: "'[Mai] PL Active students_Updated'!A:AE", // New tab and extended range for columns AD and AE
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return res.json([]);
    }

    // Skip header row and process data
    const headers = rows[0];
    const studentsData = rows.slice(1)
      .map(row => ({
        name: `${row[0] || ''} ${row[1] || ''}`.trim(), // Combine first and last name from columns A and B
        firstName: row[0] || '',
        lastName: row[1] || '',
        sheetId: row[29] || '', // Column AD (30th column, index 29)
        currentTeachers: cleanTeacherNames(row[30] || ''), // Column AE (31st column, index 30)
        lessonType: 'Private', // Default to Private since we don't have this data in new sheet
        term: '',
        updateFrequency: 'Weekly',
        onHoliday: '',
        notes: ''
      }))
      .filter(student => student.name.trim() && student.sheetId.trim()); // Only include rows with name and sheet ID

    // Get actual last modified dates for each sheet
    const data = await Promise.all(studentsData.map(async (student) => {
      const sheetInfo = await getSheetLastModified(student.sheetId);
      
      if (sheetInfo) {
        student.actualLastModified = sheetInfo.lastModified;
        student.sheetName = sheetInfo.name;
        student.lastModifiedBy = sheetInfo.lastModifiedBy;
        student.calculatedStatus = calculateStatus(sheetInfo.lastModified, student.lessonType);
        
        // Format the date for display
        const lastModDate = new Date(sheetInfo.lastModified);
        student.lastModifiedDisplay = lastModDate.toLocaleDateString() + ' ' + lastModDate.toLocaleTimeString();
      } else {
        student.calculatedStatus = 'unknown';
        student.lastModifiedDisplay = 'Sheet not shared with service account';
        student.lastModifiedBy = 'Need access to sheet';
      }
      
      return student;
    }));

    res.json(data);
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    res.status(500).json({ error: 'Failed to fetch sheet data' });
  }
});

// Get individual sheet last modified date
app.get('/api/sheet-info/:sheetId', async (req, res) => {
  try {
    const { sheetId } = req.params;
    
    // Get sheet metadata to find last modified date
    const response = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
      fields: 'properties'
    });
    
    // Note: Google Sheets API doesn't directly provide last modified date
    // This would require Drive API or parsing revision history
    res.json({
      sheetId,
      title: response.data.properties.title,
      // lastModified: 'Would need Drive API for this'
    });
  } catch (error) {
    console.error('Error fetching sheet info:', error);
    res.status(500).json({ error: 'Failed to fetch sheet info' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`PL Sheet Tracker running on http://localhost:${port}`);
});