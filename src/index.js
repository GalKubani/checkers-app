const express= require('express');
const app= require('./app')
const http = require('http');
const path= require('path');
const runSocketIo= require ('./io')
const server = http.createServer(app);

const port = process.env.PORT;

const publicDirectoryPath= path.join(__dirname,'../public')

app.use(express.static(publicDirectoryPath));
runSocketIo(server)
server.listen(port,()=>{
    console.log('server is running on port:'+port)
})
