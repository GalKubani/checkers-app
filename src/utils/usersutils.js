const users= []
const User= require('../models/usermodel')

const addUser=({id, username, ratings,userId})=>{
    username=username.trim().toLowerCase()

    const user= {id, username, ratings,userId,room:"lobby"}
    users.push(user)
    return user
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
const getUsersInRoom=(room)=>{
    return users.filter((user)=> user.room===room)
    // filter returns a filtered array that returns
    // true to the statement in the arrow func
}
const updateUserRatings=async (id,ratings)=>{
    const index= users.findIndex((user)=>{
        return user.id=== id
    })
    const user= await User.findOneAndUpdate
}
module.exports= {
    addUser,
    removeUser,
    getUser,
    updateUserRatings
}