const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const xlsx = require("xlsx");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer"); // Import nodemailer
require("dotenv").config();
const app = express();
app.use(bodyParser.json());
app.use(cors());

// Temporary storage for the data
let dataStore = [];

// Email configuration
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465, // Port 465 for SSL or 587 for TLS
  secure: true, // true for port 465, false for port 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.get("/", (req, res) => {
  res.send("Server is running.");
});

app.post("/api/export", (req, res) => {
  const data = req.body;
  console.log("Received data:", data); // Log the received data

  // Add new data to the store
  dataStore.push(data);

  // Check if we have at least 5 entries
  if (dataStore.length >= 1) {
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(dataStore);

    xlsx.utils.book_append_sheet(workbook, worksheet, "Size Chart");

    const filePath = path.join(__dirname, "size_chart.xlsx");
    xlsx.writeFile(workbook, filePath);

    // Clear dataStore after exporting
    dataStore = [];

    // Send email with attachment
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: "glorioussatria@gmail.com",
      subject: "Size Chart Export",
      text: "Please find the attached size chart file.",
      attachments: [
        {
          filename: "size_chart.xlsx",
          path: filePath,
        },
      ],
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res.status(500).send("Error sending email.");
      }

      // Remove file after sending email
      fs.unlink(filePath, (err) => {
        if (err) console.error("Error deleting file:", err);
      });

      res.status(200).send("Email sent successfully.");
    });
  } else {
    res.json({ message: "Data received, waiting for more entries to export." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
