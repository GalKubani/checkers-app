const express= require('express');
const app= require('./app')
const path= require('path');
require('./io')

const publicDirectoryPath= path.join(__dirname,'../public')

app.use(express.static(publicDirectoryPath));