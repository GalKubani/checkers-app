const users= []

const usersPlaying=[]

const addUserPlaying=(user,id)=>{
    user.id=id
    usersPlaying.push(user)
}
const addUserToLobby=(user)=>{
    users.push(user)
}
const removePlayer=(id)=>{
    const index= usersPlaying.findIndex((user)=>{
        return user.id=== id
    })

    if(index !==-1){
        return usersPlaying.splice(index,1)[0]
    }
}
const getUsersPlaying=()=>{
    return usersPlaying
}
const addUser=({id, username, ratings,userId})=>{
    username=username.trim().toLowerCase()
    const user= {id, username, ratings,userId,room:"lobby"}
    users.push(user)
    return user
}
const updateUserRoom=({id,roomname})=>{
    const index= users.findIndex((user)=>{
        return user.id=== id
    })
    if(index !==-1){
        user=users.splice(index,1)[0]
        user.room=roomname
        users.push(user)
        return user
    }
}
const removeUser=(id)=>{
    const index= users.findIndex((user)=>{
        return user.id=== id
    })
    if(index !==-1){
        return users.splice(index,1)[0]
    }
}
const getUser=(id)=>{
    return users.find((user)=> user.id===id )
}
const getUserByUsername=(username)=>{
    return users.find((user)=> user.username===username)
}
const getPlayer=(id)=>{
    return usersPlaying.find((player)=> player.id===id )
}
const getUsersInRoom=(room)=>{
    return users.filter((user)=> user.room===room)
    // filter returns a filtered array that returns
    // true to the statement in the arrow func
}
const getPlayersInRoom=(room)=>{
    return usersPlaying.filter((player)=> player.room===room)
    // filter returns a filtered array that returns
    // true to the statement in the arrow func
}
module.exports= {
    addUser,
    removeUser,getUsersInRoom,
    updateUserRoom,getUser,
    addUserPlaying,getPlayer,getUserByUsername,
    addUserToLobby,getUsersPlaying,removePlayer,getPlayersInRoom
}