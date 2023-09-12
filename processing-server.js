const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors'); // Import the cors package
const app = express();
const port = 3000;
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

// Enable CORS for all routes
app.use(cors());

let lastUploadedFile = null; // Store the last uploaded file
let orders = []; // A simple array to store orders

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Store uploaded files in the 'uploads' directory
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
    lastUploadedFile = filename; // Save the name of the uploaded file
    cb(null, filename);
  }
});

const upload = multer({ storage: storage });

// Serve HTML form for file upload
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Handle file upload
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  res.send('File uploaded successfully: ' + req.file.filename);
});

// Create an order based on the last uploaded file
app.post('/createOrder', (req, res) => {
  if (!lastUploadedFile) {
    return res.status(400).send('No file has been uploaded to create an order.');
  }
  console.log("createOrder")

  const order = {
    id: Math.round(Math.random() * 1E9), // Random order ID
    fileName: lastUploadedFile,
    btcAddress: 'mockBitcoinAddress12345' // Mock BTC address
  };

  orders.push(order);

  // Return the Bitcoin address for the client to generate a QR code
  res.send(order.btcAddress);
});

// Execute the order by sending the file to another server
app.post('/executeOrder', (req, res) => {
  if (!lastUploadedFile) {
    return res.status(400).send('No file has been uploaded to execute the order.');
  }

  const filePath = path.join(__dirname, 'uploads', lastUploadedFile);
  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath));

  axios.post('http://other-server-address/inscribeEndpoint', formData, {
    headers: {
      ...formData.getHeaders()
    }
  })
  .then(response => {
    // Handle success. This assumes the other server sends back a success message.
    res.send(response.data.message);
  })
  .catch(error => {
    // Handle error
    res.status(500).send('Failed to inscribe the file on the other server.');
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
