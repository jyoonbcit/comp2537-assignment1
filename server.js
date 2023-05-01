// Setup
const mongoose = require('mongoose');
const app = require('./app.js');
const dotenv = require('dotenv');
dotenv.config();

// Main function needs to be called after inputting environment variables
main().catch(err => console.log(err));

async function main() {
    // TODO: connect to the atlas cluster
    await mongoose.connect(process.env.MONGODB_CONNECTION_STRING);
    console.log("connected to db");
    app.listen(process.env.PORT || 3000, () => {
        console.log('Server is running!')
    })
}