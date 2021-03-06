const socketio= require('socket.io')

let playerOne={}
let playerTwo={}
let firstUser=true
const {getUser,getUsersInRoom,addUser,getPlayer,removePlayer,removeUser,getUsersPlaying,getPlayersInRoom,addUserPlaying,updateUserRoom}= require('./utils/usersutils')

const runSocketIo=(server)=>{
    const io=socketio(server)
    io.on('connection',(socket)=>{
        console.log('New connection')
        socket.on('Login', ({userId,username,ratings}, callback)=>{
            socket.join('lobby')
            const user= addUser({id:socket.id, username, ratings, userId})
            callback(user)
        })
        socket.on('Get users playing', ({},callback)=>{
            const users=getUsersPlaying()
            callback(users)
        })
        socket.on('Get lobby users',({},cb)=>{
            const userList= getUsersInRoom('lobby')
            cb(userList)
        })
        socket.on('Create room',({currentUser,roomname},cb)=>{
            if(io.sockets.adapter.rooms.has(roomname)){
                cb(false)
            }
            else{
                socket.join(roomname)
                updateUserRoom({id:socket.id, roomname})
                addUserPlaying(getUser(socket.id),socket.id)
                playerOne=currentUser
                cb(true)
            }
        })
        socket.on('close room',({roomname})=>{
            socket.join('lobby')
            socket.leave(roomname)
            updateUserRoom({id:socket.id,roomname:'lobby'})
            io.to('lobby').emit('remove room',{roomname})
        })
        socket.on('join room',({currentUser,roomname,ratingsMultiplier},cb)=>{
            socket.join(roomname)
            socket.leave('lobby')
            playerTwo= currentUser
            updateUserRoom({id:socket.id,roomname})
            io.to(roomname).emit('send to room',({roomname,playerTwo,ratingsMultiplier}))
            io.to('lobby').emit('room full',({roomname}))
            cb()
        })
        socket.on('Update room list',({username,roomname},cb)=>{
            let roomFull=getPlayersInRoom(roomname).length>1?true:false
            let roomFullplayers=getUsersInRoom(roomname).length>1?true:false
            io.to('lobby').emit('addaroom',{username,roomname})
            if(roomFull||roomFullplayers)
                io.to('lobby').emit('room full',({roomname}))
            cb()
        })
        socket.on('Entered room',({username,roomname},cb)=>{
            socket.join(roomname)
            let user
            if(firstUser){
                user= playerOne
                user.ratings=playerOne.ratings
                user.userId=playerOne._id
                socket.broadcast.to(roomname).emit('change turn',{})
                playerOne={}
            }else{
                user= playerTwo
                user.ratings=playerTwo.ratings
                user.userId=playerTwo._id
                playerTwo={}
            }
            firstUser=!firstUser
            user.room=roomname
            const player= addUser({id:socket.id, username,ratings: user.ratings,userId:user.userId})
            player.room=roomname
            addUserPlaying(player,socket.id)
            cb(user)
        })
        socket.on('start game',({room,username})=>{
            const whiteplayer=username
            io.to(room).emit('start game',{whiteplayer})
        })
        socket.on('change turn',({id,username},cb)=>{
            const player= getPlayer(id)
            const room= player.room
            const playerEndingTurn=username
            socket.broadcast.to(room).emit('change turn',{playerEndingTurn})
            cb()
        })
        socket.on('update UI',({updatedBoard,id,checkerThatBurnt},cb)=>{
            const player= getPlayer(id)
            const room= player.room
            socket.broadcast.to(room).emit('update UI',{updatedBoard,checkerThatBurnt})
            cb(updatedBoard)
        })
        socket.on('Player victory',({username,room})=>{
            // here will nn to update the players back to users list and lobby
            io.to(room).emit('Player victory',{winner:username})
        })
        socket.on('disconnect',({})=>{
            console.log("Disconnected")
            try{
                const user= removeUser(socket.id)
                if(getPlayer(socket.id)){
                    const player= removePlayer(socket.id)
                    if(player){
                        console.log(player.username+' has disconnected')
                        io.to(player.room).emit('Player left',({username:player.username}))
                    }
                }
                else
                    console.log(user.username+' has disconnected')
            }catch(err){
            }
        })
    }) 

}


module.exports=runSocketIo