const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Temporary storage for the data
let dataStore = [];

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail', // Use 'gmail' for service, or configure host/port if using custom SMTP
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.post('/api/export', async (req, res) => {
  const data = req.body;
  console.log('Received data:', data);

  // Add new data to the store
  dataStore.push(data);

  if (dataStore.length >= 35) {
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(dataStore);

    const filePath = path.join('/tmp', 'size_chart.xlsx'); // Use /tmp directory
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Size Chart');
    xlsx.writeFile(workbook, filePath);

    // Clear dataStore after exporting
    dataStore = [];

    try {
      // Verify connection configuration
      await transporter.verify();

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: 'michaeltimonuli@gmail.com',
        subject: 'Size Chart Export',
        text: 'Please find the attached size chart file.',
        attachments: [
          {
            filename: 'size_chart.xlsx',
            path: filePath,
          },
        ],
      };

      // Send email
      await new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error('Error sending email:', error);
            reject(error);
          } else {
            console.log('Email sent:', info.response);
            resolve(info);
          }
        });
      });

      // Remove file after sending email
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting file:', err);
      });

      res.status(200).send('Email sent successfully.');
    } catch (error) {
      console.error('Error:', error);
      res.status(500).send('Error sending email.');
    }
  } else {
    res.json({ message: 'Data received, waiting for more entries to export.' });
  }
});

// Export the app as a serverless function
module.exports = app;
