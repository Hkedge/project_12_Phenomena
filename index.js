
const dotenv = require('dotenv').config();

const PORT = 3000;

const express = require('express');
const server = express();

const { client } = require('./db');
client.connect();

server.listen(PORT, () => {
    console.log('The server is up on port', PORT)
  });


const bodyParser = require('body-parser');
server.use(bodyParser.json())

const morgan = require('morgan');
server.use(morgan('dev'));



/**
 * Cors allow access to other user origins and bypasses SOP - not a good standard pratice to use orignin * and allow
 *   all with sensitive data. 
 */
const cors = require('cors');
server.use(cors({
    origin: "*",
}))


server.use((req, res, next) => {
    console.log("<____Body Logger START____>");
    console.log(req.body);
    console.log("<_____Body Logger END_____>");
  
    next();
});

const apiRouter = require('./api');
server.use('/api', apiRouter);

apiRouter.use((req, res, next) => {
    const err = new Error("Not found")
    err.status = 404
    next(err)
});


apiRouter.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.send({
        error: {
            status: err.status || 500, 
            message: err.message
        }
    });
});


// Use the dotenv package, to create environment variables
// Create a constant variable, PORT, based on what's in process.env.PORT or fallback to 3000
// Import express, and create a server
// Require morgan and body-parser middleware
// Have the server use morgan with setting 'dev'
// Import cors 
// Have the server use cors()
// Cors allow access to other user origins and bypasses SOP - not a good standard pratice to use orignin * and allow
// all with sensitive data. 
// Have the server use bodyParser.json()
// Have the server use your api router with prefix '/api'
// Import the client from your db/index.js
// Create custom 404 handler that sets the status code to 404.
// Create custom error handling that sets the status code to 500
// and returns the error as an object
// Start the server listening on port PORT
// On success, connect to the database
