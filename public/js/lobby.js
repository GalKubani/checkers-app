const socket = io()
const createRoomButton= document.getElementById("createroom")
const {username,password}= Qs.parse(location.search,{ ignoreQueryPrefix: true})
const loginURL=`/users/login?name=${username}&password=${password}`
const logoutURL=`/users/logout`
const logoutButton= document.getElementById("log-out")
const userProfileLabel= document.getElementById("userprofile")
const roomNameInput=document.getElementById("roomname")
const roomListContainer=document.getElementById("rooms")
const userListContainer=document.getElementById("userlist")
const whoIsOnlineButton=document.getElementById("checkonline")

roomNameInput.style.visibility="true"
let userToken
let currentUser
whoIsOnlineButton.addEventListener('click',(event)=>{
    event.preventDefault()
    socket.emit('Get lobby users',{},(userList)=>{
        for(let user of userList){
            const label=document.createElement('label')
            label.classList.add("userlabel")
            label.id="removelabel"
            label.innerHTML= user.username+" with a rating of "+user.ratings+"</br>"
            userListContainer.appendChild(label)
        }
        whoIsOnlineButton.disabled=true
        const closeButton=document.createElement('button')
        closeButton.innerHTML="Close"
        userListContainer.appendChild(closeButton)
        closeButton.addEventListener('click',(event)=>{
            event.preventDefault()
            const labels=document.getElementsByClassName("userlabel")
            for(let label of labels){
                label.remove()
            }
            try{
                document.getElementById("removelabel").remove()
            }catch(err){}
            closeButton.remove()
            whoIsOnlineButton.disabled=false
        })
    })
})
logoutButton.addEventListener('click', async (event)=>{
    event.preventDefault()
    await fetch(logoutURL,{
        method: 'POST',
        headers: {'Authorization': `Bearer `+userToken}
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
    let roomname=roomNameInput.value
    socket.emit('Create room',{currentUser,roomname},(wasRoomCreated)=>{
        roomNameInput.value=""
        if(!wasRoomCreated){
            return alert("room already exists, please enter a new room")
        }
        socket.emit('Update room list',{username:currentUser.username,roomname},()=>{
            console.log("room created")
            createRoomButton.disabled=true
        })
    })
})
socket.on('remove room',({roomname})=>{
    try{
        document.getElementById(roomname+"room").remove()
    }catch(err){
    }
    
})
socket.on('addaroom',({username,roomname})=>{
    const roomCheck=document.getElementById(roomname)
    if(roomCheck){return} 
    const roomUI=document.createElement('form')
    roomUI.action= "/checkers.html"
    roomUI.id= roomname+"room"
    roomUI.innerHTML= roomname+ "</br> Created by: "+username+"   ";
    const joinRoomButton= document.createElement('button')
    if(currentUser.username===username){ // nn to make sure if user is in a room, all rooms are unjoinable until he leaves
        joinRoomButton.disabled=true
        const cancel= document.createElement('button')
        cancel.innerHTML="Cancel"
        roomUI.appendChild(cancel)
        cancel.addEventListener('click',(event)=>{
            event.preventDefault()
            roomUI.remove()
            createRoomButton.disabled=false
            socket.emit('close room',{roomname})
        })
    }
    joinRoomButton.innerHTML="Join room"
    joinRoomButton.id=roomname
    joinRoomButton.addEventListener('click',(event)=>{
        event.preventDefault()
        socket.emit('join room',{currentUser,roomname},()=>{
        })
    })
    roomUI.appendChild(joinRoomButton)
    roomListContainer.appendChild(roomUI)
})
socket.on('send to room',({roomname})=>{
    const roomUI=document.getElementById(roomname+"room")
    const tokenInput=document.createElement('input')
    tokenInput.type="text"
    tokenInput.name="token"
    tokenInput.value=userToken
    tokenInput.visibility=false
    const roomValue=document.createElement('input')
    roomValue.type="text"
    roomValue.name="room"
    roomValue.value=roomname
    const usernameValue=document.createElement('input')
    usernameValue.type="text"
    usernameValue.name="username"
    usernameValue.value= currentUser.username
    roomUI.appendChild(usernameValue)
    roomUI.appendChild(roomValue)
    roomUI.appendChild(tokenInput)
    roomUI.submit()
})
socket.on('room full',({roomname})=>{
    const roomButton= document.getElementById(roomname)
    roomButton.disabled=true
    roomButton.innerHTML="Room is full"
})
function changeControls(event){
    event.stopPropagation();
    event.preventDefault();
}
document.addEventListener('click',changeControls,true)
const attemptEntryToLobby= async ()=>{
    await fetch(loginURL,{
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
        currentUser=jsonObj.user
        let userId=jsonObj.user._id
        userProfileLabel.innerHTML="Welcome back "+jsonObj.user.username+", Your current rating is "+ratings
        try{
            socket.emit('Login',{userId,username,ratings},(user)=>{
                if(!user){
                    alert("User error")
                    location.href='/'
                }
                document.removeEventListener('click',changeControls,true)
                updateRooms();
            })
        }catch(err){
            alert(err)
        }
    }).catch((error)=>{
        alert(error)
    })    
}
attemptEntryToLobby();
const updateRooms=()=>{
    socket.emit('Get users playing',{},(users)=>{
        for(let user of users){
            if(user.room!=="lobby"){
                socket.emit('Update room list',{username:user.username,roomname:user.room},()=>{
                    console.log("room updated")
                })
            }
        }
    })
}