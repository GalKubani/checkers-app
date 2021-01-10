const http= require('http')
const express= require('express');
const app= require('./app')
const path= require('path');
const socketio= require('socket.io')
// const runSocketio= require('./io')

const server= http.createServer(app)
const io= socketio(server)

const publicDirectoryPath= path.join(__dirname,'../public')
const port= process.env.PORT || 3000



const {getUser,addUser,removeUser,updateUserRatings}= require('./utils/usersutils')

app.use(express.static(publicDirectoryPath));

io.on('connection',(socket)=>{
    console.log('New connection')

    
    socket.on('Login', ({username,ratings,userId}, callback)=>{
        const user= addUser({id:socket.id, username, ratings, userId:userId})
        callback(user)
    })


    socket.on('disconnect',({},callback)=>{
        const user= removeUser(socket.id)
        if(user.room!=="lobby"){
            getUsersInRoom(user.room).room="lobby" //possible error, nn to check what removeUser returns to confirm
        }
    })
}) 




// runSocketio(server)

server.listen(port,()=>{
    console.log('server is running on port:'+port)
})