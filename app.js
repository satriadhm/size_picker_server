const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer'); // Import nodemailer

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Temporary storage for the data
let dataStore = [];

// Email configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.post('/api/export', (req, res) => {
  const data = req.body;
  console.log('Received data:', data);

  // Add new data to the store
  dataStore.push(data);

  if (dataStore.length >= 5) {
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(dataStore);

    xlsx.utils.book_append_sheet(workbook, worksheet, 'Size Chart');

    const filePath = path.join('/tmp', 'size_chart.xlsx'); // Use /tmp directory
    xlsx.writeFile(workbook, filePath);

    // Clear dataStore after exporting
    dataStore = [];

    // Send email with attachment
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'glorioussatria@gmail.com',
      subject: 'Size Chart Export',
      text: 'Please find the attached size chart file.',
      attachments: [
        {
          filename: 'size_chart.xlsx',
          path: filePath,
        },
      ],
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        return res.status(500).send('Error sending email.');
      }

      // Remove file after sending email
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting file:', err);
      });

      res.status(200).send('Email sent successfully.');
    });
  } else {
    res.json({ message: 'Data received, waiting for more entries to export.' });
  }
});

// Export the app as a serverless function
module.exports = app;
