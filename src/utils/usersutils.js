const users= []
const User= require('../models/usermodel')

const usersPlaying=[]

const addUserPlaying=(user)=>{
    usersPlaying.push(user)
}
const addUserToLobby=(user)=>{
    users.push(user)
}
const removePlayer=(user)=>{
    const index= usersPlaying.findIndex((user)=>{
        return user.id=== id
    })
    if(index !==-1){
        return usersPlaying.splice(index,1)[0]
    }
}
const getUsersPlaying=()=>{
    return usersPlaying
    // filter returns a filtered array that returns
    // true to the statement in the arrow func
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
const getUserList=()=>{
    return users
}
const getUser=(id)=>{
    return users.find((user)=> user.id===id )
}
const getUsersInRoom=(room)=>{
    return users.filter((user)=> user.room===room)
    // filter returns a filtered array that returns
    // true to the statement in the arrow func
}
const updateUserRatings=async (id,ratings)=>{
    const index= users.findIndex((user)=>{
        return user.id=== id
    })
    const user= await User.findOneAndUpdate(index,ratings)
}
module.exports= {
    addUser,
    removeUser,
    getUser,
    updateUserRatings,
    updateUserRoom,
    getUserList,
    getUsersInRoom,
    addUserPlaying,
    addUserToLobby,getUsersPlaying,removePlayer
}