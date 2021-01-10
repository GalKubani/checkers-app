const socket = io()

const createRoomButton= document.getElementById("createroom")
const {username,password}= Qs.parse(location.search,{ ignoreQueryPrefix: true})
const loginURL=`http://localhost:3000/users/login?name=${username}&password=${password}`
const logoutURL=`http://localhost:3000/users/logout`
const logoutButton= document.getElementById("log-out")
const userProfileLabel= document.getElementById("userprofile")
// nn to add lobby features
// 1- show available rooms + buttons to join
// 2- show how many users are currently online
// 4- create new room-- will take room name and check if it already exists in the lobby
// 5- when a player clicks to join a room, it will be removed from lobby but not from the room list, 
// wait for events

// const buttons= document.getElementsByTagName("button")
// for(let button of buttons){
//     button.disabled= !button.disabled
// } also for divs in game checkers
let userToken
logoutButton.addEventListener('click',(event)=>{
    event.preventDefault()
    fetch(logoutURL,{
        method: 'POST',
        headers: {'Authorization': `Bearer ${userToken}`}
    }).then((res)=>{
        if(res.ok)
            return location.href='/'
        else
            throw new Error(res.status)
    }).catch((err)=>{
        alert(err)
    })
})

createRoomButton.addEventListener('click',(event)=>{
    event.preventDefault();
    // here we open an input text box to allow user to insert room name
    // once user enters the name, the room name will be emitted to the server, checking if it exists
    // if it exists, will reply a message of room already exists, please enter a diffrent name
    // if it doesnt exist, will add the room to the server room list
    // as well as on the client side adding the room to the rooom list
    // the user himself will be send to the room via emit.to(roomname)
    // will also add a button next to room description to allow another user to join
})
const attemptEntryToLobby= ()=>{
    fetch(loginURL,{
        method:'POST',
    }).then((res)=>{
        if(res.ok){
            return res.json()
        }
        else{
            location.href='/'
        }
    }).then((jsonObj)=>{
        let ratings=jsonObj.user.ratings
        userToken=jsonObj.token
        userProfileLabel.innerHTML="Welcome back "+jsonObj.user.username+", Your current rating is "+ratings
        try{
            socket.emit('Login',{username,ratings},(error)=>{
                if(!error){
                    alert(error)
                    location.href='/'
                }
            })
        }catch(err){
            alert(err)
        }
        
    }).catch((err)=>{
        alert("Invalid details")
    })
}
attemptEntryToLobby();

