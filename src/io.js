const socketio= require('socket.io')
const http= require('http')
const app= require('./app')
const server= http.createServer(app)
const io= socketio(server)
const port= process.env.PORT || 3000


const {getUser,addUser,removeUser,getUsersPlaying,addUserPlaying,updateUserRatings,getUsersInRoom,getUserList,updateUserRoom}= require('./utils/usersutils')
io.on('connection',(socket)=>{
    console.log('New connection')

    
    socket.on('Login', ({userId,username,ratings}, callback)=>{
        socket.join('lobby')
        const user= addUser({id:socket.id, username, ratings, userId})
        callback(user)
    })
    socket.on('arrived',({roomname},cb)=>{
        socket.join(roomname)
        // console.log(io.sockets.adapter.rooms)
        cb()
    })
    socket.on('getusers', ({},callback)=>{
        const users=getUserList()
        callback(users)
    })
    socket.on('checkroom',({roomname},cb)=>{
        if(io.sockets.adapter.rooms.has(roomname)){
            cb(false)
        }
        else{
            socket.join(roomname)
            updateUserRoom({id:socket.id, roomname})
            cb(true)
        }
    })
    socket.on('join room',({roomname},cb)=>{
        socket.join(roomname)
        socket.leave('lobby')
        updateUserRoom({id:socket.id,roomname})
        const users= getUsersInRoom(roomname)
        for(let user of users){
            addUserPlaying(user)
        }
        io.to(roomname).emit('send to room',({roomname}))
        io.to('lobby').emit('room full',({roomname}))
        
        cb()
    })
    socket.on('update UI',({board,id},cb)=>{
        const user= getUser(id)//nn to check or change to playing users
        io.to(user.room).emit('update UI',{board})
        cb()
    })
    socket.on('updatedata',({username,roomname},cb)=>{

        io.to('lobby').emit('addaroom',{username,roomname})
        cb()
    })
    socket.on('close room',({username,roomname},cb)=>{
        //nn to find the user playing, then add him back to lobby
        socket.join('lobby')
        socket.leave(roomname)
        updateUserRoom({id:socket.id,roomname})
        io.to('lobby').emit('remove room',{roomname})
    })
    socket.on('disconnect',({},callback)=>{
        try{
        const user= removeUser(socket.id)
        // nn to emit to game, check 
        const playingUsers=getUsersPlaying()
        console.log(playingUsers)
        console.log("===================")
        const userCheck=playingUsers.filter((player)=> player.userId===user.userId)
        // console.log(userCheck)
        // console.log("===================")
        console.log(user.username+' has disconnected')
        if(!userCheck){
            // console.log(user.room)
                if(user.room!=="lobby"){
                    const users=getUsersInRoom(user.room)
                    // console.log(users)
                    // console.log(io.sockets.adapter.rooms)
                    io.to(user.room).emit('Player left',{username:user.username})
                    for(let user of users){
                        io.sockets.sockets[user.id].leave(user.room)
                    }
                }
        }
        callback()
        }catch(err){
        }
    })
}) 
server.listen(port,()=>{
    console.log('server is running on port:'+port)
})
module.exports=io