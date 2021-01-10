const socketio= require('socket.io')

const {getUser,addUser,removeUser,updateUserRatings}= require('./utils/usersutils')

const runSocketio= (server)=>{
    const io= socketio(server)   
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
}

module.exports=runSocketio