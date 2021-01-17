const socket = io()
const {token,room,username}= Qs.parse(location.search,{ ignoreQueryPrefix: true})
if(!room||!token||!username)
    location.href='/'

const headerText=document.getElementById("text");
const startButton=document.getElementById("start")
const board= document.getElementById('board')
const skipButton=document.getElementById("skipturn");
const updateRatingsURL=`/users/updateratings?ratings=`

alert("Whoever clicks start first will begin as the white player")
skipButton.disabled=true;
let firstClick=false,gameOver=false,whiteTurn=true, burntBox=null,currentCheckerSquaresIndex;
let squares=[];
let data= new GameData(squares,false);
let currentChecker=document.createElement('div')
currentChecker.id="default"
function GameData(board,didPlayerJustEat){
    this.board=board;
    this.didPlayerJustEat= didPlayerJustEat
}
function Square(pawn){this.pawn=pawn}
function Pawn(isWhite,isQueen){
    this.isWhite=isWhite;
    this.isQueen=isQueen;
}
function Player(color){
    this.color=color;
    this.remainingCheckers=12;
}
let black= new Player("black");
let white= new Player("white");
let currentUser={}

socket.emit('Entered room',{username,roomname:room},(user)=>{
    if(!user){  
        alert("User error")
        location.href='/'
    }
    currentUser=user
    headerText.innerHTML="Hello "+ username
})
socket.on('start game',({whiteplayer})=>{
    startGameFunc();
    if(username!==whiteplayer)
        document.addEventListener('click',changeControls,true)
})
socket.on('change turn',({})=>{
    document.removeEventListener('click',changeControls,true)
    headerText.innerHTML="Its your turn"
    data.didPlayerJustEat=false;
    currentCheckerSquaresIndex=-1 
    currentChecker=null;
    firstClick=false;
    whiteTurn=!whiteTurn; 
    black.countCheckers()
    white.countCheckers()  
})
socket.on('update UI',({updatedBoard,checkerThatBurnt})=>{
    updateBoard(updatedBoard)
    updateCheckersUI()
    if(checkerThatBurnt){
        burntBox=document.getElementById(checkerThatBurnt)
        burntBox.classList.add("burntchecker");
        burntBox.innerHTML="Burnt";
    }
})
socket.on('Player left',async ({username})=>{
    alert(username +" has left the game, Going back to lobby, your ratings will be updated")
    let url=updateRatingsURL+"3"
    await fetch(url,{
        method:'PATCH', 
        headers: {'Authorization':'Bearer '+token}
    }).then((res)=>{
        if(res.ok){
            return res.json()
        }else{
            res.status(500).send("error")
        }
    }).catch((err)=>{
        alert(err)
    })
    socket.emit('close room',{username,room})
    location.href="/"
})
socket.on('Player victory',async ({winner})=>{
    let ratings;
    let url=updateRatingsURL+3
    headerText.innerHTML= winner+" has won!"
    if(username!==winner){
        alert("Congratulations to the winner "+winner+",better luck next time "+ username);
        url=updateRatingsURL+1
    }   
    await fetch(url,{
        method:'PATCH',
        headers: {'Authorization':'Bearer '+token}
    }).then((res)=>{
        if(res.ok){
            return res.json()
        }else{
            res.status(500).send("error")
        }
    }).then((jsonObj)=>{
        ratings=jsonObj.ratings
    }).catch((err)=>{
        confirm(err)
    })
    confirm("Your updated rating is "+ ratings)
    //maybe add a rematch button here
    socket.emit('close room',{username,room})
    location.href="/"
})
const updateBoard=(newBoard)=>{
    for(let i=0;i<64;i++){
        data.board[i]=newBoard[i]
    }
    const brownBoxes=document.getElementsByClassName('brownBox')
    for(let box of brownBoxes){
        if(box.hasChildNodes()){
            box.removeChild(box.lastChild)
        }
    }
}
function updateData(checkerToEatIndex,checkerThatBurnt){
    if(checkerToEatIndex!=null){
        squares[checkerToEatIndex-1]=new Square(null);
    }
    socket.emit('update UI',{updatedBoard:data.board,id:socket.id,checkerThatBurnt},(updatedBoard)=>{
        updateBoard(updatedBoard)
        updateCheckersUI()
    })
}
function endGameUI(){
    socket.emit('Player victory',{username,room})
    gameOver=true;
}
function changeControls(event){
    event.stopPropagation();
    event.preventDefault();
}
function updateCheckersUI(){
    for(let i=0;i<squares.length;i++){
        if(squares[i].pawn){
            const brownBox=document.getElementById((i+1)+"")
            const checker=document.createElement('div')
            checker.id=brownBox.id
            if(squares[i].pawn.isWhite){
                checker.className="white checker"
                brownBox.appendChild(checker)
                if(squares[i].pawn.isQueen)
                    upgradeToQueenUI(checker)
            }
            else{
                checker.className="black checker"
                brownBox.appendChild(checker)
                if(squares[i].pawn.isQueen)
                    upgradeToQueenUI(checker)
            }
            checker.addEventListener("click",(event)=> {
                event.stopImmediatePropagation();
                if(burntBox!== null){
                    burntBox.innerHTML="";
                    burntBox=null;
                }
                if(!firstClick){
                    if(((squares[parseInt(checker.id)-1].pawn.isWhite===false) && whiteTurn) || 
                    ((squares[parseInt(checker.id)-1].pawn.isWhite===true) && !whiteTurn)){
                        alert("Not your checker!");   
                    }
                    else{
                        if((whiteTurn&& !data.didPlayerJustEat)|| (!whiteTurn && !data.didPlayerJustEat)){
                            currentChecker=checker;
                            currentCheckerSquaresIndex= parseInt(checker.id)
                            markPotentialMoveBox(checker);
                        }
                        firstClick=true;
                        currentChecker=document.getElementById(currentCheckerSquaresIndex)
                        currentChecker.classList.add("markedChecker");// doesnt mark the checker?
                    }
                }
                else{
                    unmarkBoxes();
                    currentChecker.classList.remove("markedChecker");
                    firstClick=false;
                }
            })
        }
    }
}
function switchTurn(){
    clearMarks=document.getElementsByClassName("markedChecker")
    for(let box of clearMarks){
        box.classList.remove("markedChecker")
    }
    if(currentChecker!==null)
        currentChecker.classList.remove("markedChecker");
    skipButton.disabled=true;
    socket.emit('change turn',{id:socket.id,username},()=>{
        document.addEventListener('click',changeControls,true)
        headerText.innerHTML="Please wait for your turn"
        data.didPlayerJustEat=false;
        currentCheckerSquaresIndex=-1 
        currentChecker=null;
        firstClick=false;
        whiteTurn=!whiteTurn; 
        console.log("turn changed")
    })
}
startButton.onclick=function(){
    socket.emit('start game',{room,username},()=>{
        console.log("started")
    })
}
const startGameFunc=()=>{
    addCheckersData();
    updateCheckersUI();
    white.countCheckers();
    black.countCheckers();
    startButton.remove();
}
Player.prototype.countCheckers=function(){
    let totalCheckers=document.getElementsByClassName("black checker");
    if(this.color==="white"){
        totalCheckers=document.getElementsByClassName("white checker")
        let whiteScore= document.getElementById("whitescore");
        whiteScore.innerHTML="White checkers remaining: " + totalCheckers.length;
    }
    else {
        let blackScore= document.getElementById("blackscore");
        blackScore.innerHTML="Black checkers remaining: " + totalCheckers.length;
    }
    this.remainingCheckers=totalCheckers.length;
    if(this.remainingCheckers===0){
        endGameUI();
    }
}
Player.prototype.didPlayerMissAnEatMove=function(){
    if(data.didPlayerJustEat)
        return false;
    else{
        let allCheckers= document.getElementsByClassName("white");
        if(this.color==="black")
            allCheckers= document.getElementsByClassName("black");
        let ignoreThisChecker=currentChecker;
        for(let checker of allCheckers){
            if(ignoreThisChecker!==checker){
                currentChecker=checker;
                currentCheckerSquaresIndex=parseInt(checker.id)
                if(canPlayerContinueEating(true,this.color)){
                    burnCheckerUI();
                    alert(username+", your checker just burnt, pay more attention!");
                    updateData(0,currentCheckerSquaresIndex)
                     return true;
                }
            }
        }
    }
    return false;
}

function attemptEatMove(possibleDestinationBoxID, delta, scanning){
    let boxId= currentCheckerSquaresIndex;
    boxId+=delta*7;
    let possibleBoxToEatIndex= boxId
    if( currentCheckerSquaresIndex + (delta*18)===(possibleDestinationBoxID)){
        boxId= currentCheckerSquaresIndex;
        boxId+=delta*9;
        possibleBoxToEatIndex= boxId
    }
    if(possibleBoxToEatIndex !== possibleDestinationBoxID)
        if(squares[possibleDestinationBoxID-1].pawn || !squares[possibleBoxToEatIndex-1].pawn){
            return false;
    }
    if(squares[possibleBoxToEatIndex-1].pawn!=null){
        if((whiteTurn && !squares[possibleBoxToEatIndex-1].pawn.isWhite)||
         (!whiteTurn && squares[possibleBoxToEatIndex-1].pawn.isWhite)){
            if(!scanning){
                data.didPlayerJustEat=true;
                validateMoveConfirmation(possibleDestinationBoxID,possibleBoxToEatIndex);
            }
            return true;
        }
        else{
            firstClick=false;
            return false;
        }     
    }
}
function isCheckRelevantMinus(number){
    if((currentCheckerSquaresIndex)<16)
        return false;
    if(number===-7){
        switch(currentCheckerSquaresIndex){
            case 24: case 31: case 40: case 47: case 56: case 63: return false; break;
            default:
                return true;
        }
    }
    else{
        switch(currentCheckerSquaresIndex){
            case 18: case 25: case 34: case 41: case 50: case 57: return false; break;
            default:
                return true;
        }
    }
}
function isCheckRelevantPlus(number){
    if((currentCheckerSquaresIndex)>49)
        return false;
    if(number===7){
        switch(currentCheckerSquaresIndex){
            case 2: case 9: case 18: case 25: case 41: case 34: return false; break;
            default:
                return true;
        }
    }
    else{
        switch(currentCheckerSquaresIndex){
            case 8: case 15: case 24: case 31: case 40: case 47: return false; break;
            default:
                return true;
        }
    }
}
function checkQueenMove(selectedBoxID){
    if((isCheckerMovePossible(selectedBoxID,-7)) || (isCheckerMovePossible(selectedBoxID,-9))
    || (isCheckerMovePossible(selectedBoxID, 7)) || (isCheckerMovePossible(selectedBoxID, 9))
    && (!data.didPlayerJustEat && !data.didPlayerJustEat))
        validateMoveConfirmation(selectedBoxID);
    else if((isCheckerMovePossible(selectedBoxID,-14)) || (isCheckerMovePossible(selectedBoxID,-18)))
        attemptEatMove(selectedBoxID, -1);
    else if((isCheckerMovePossible(selectedBoxID, 14)) || (isCheckerMovePossible(selectedBoxID, 18)))
        attemptEatMove(selectedBoxID, 1);
    else if(data.didPlayerJustEat || data.didPlayerJustEat){
        if(!attemptEatMove(selectedBoxID, -1));
            attemptEatMove(selectedBoxID, +1);
    }
}
function checkSecondEatMove(boxID){
    if(isCheckerMovePossible(boxID, 14)|| (isCheckerMovePossible(boxID, 18)))
        attemptEatMove(boxID, +1);
    else if(isCheckerMovePossible(boxID, -14) || (isCheckerMovePossible(boxID, -18)))
        attemptEatMove(boxID, -1);
}
function isCheckerMovePossible(selectedBoxID,delta){
    if((currentCheckerSquaresIndex+delta === selectedBoxID) && !squares[selectedBoxID-1].pawn)
        return true;
    return false;
}
skipButton.addEventListener("click",(event)=>{
    switchTurn();
})
function createBoard(){
    let isWhite=false;
    let count=1;
    for(let j=0;j<8;j++){
        if(j%2===0)
            isWhite=true;
        else
            isWhite=false;
        for(let i=0;i<8;i++){
            const box= document.createElement('div')
            box.className="whiteBox box";
            if(isWhite===false){
                box.className="brownBox box";
                box.id= count+"";
                box.addEventListener("click",()=>{
                    event.stopImmediatePropagation();
                    if(firstClick===true ){
                        if(!box.hasChildNodes()){
                            if(!squares[currentCheckerSquaresIndex-1].pawn.isQueen){
                                if(whiteTurn){
                                    if((isCheckerMovePossible((box.id *1),-7)|| isCheckerMovePossible((box.id *1),-9)) && !data.didPlayerJustEat)   
                                        validateMoveConfirmation((box.id *1));
                                    else if((isCheckerMovePossible((box.id *1),-14)) || (isCheckerMovePossible((box.id *1),-18)))
                                        attemptEatMove((box.id *1), -1);
                                    else if(data.didPlayerJustEat)
                                        checkSecondEatMove((box.id *1)); 
                                }
                                else{
                                    if ((isCheckerMovePossible((box.id *1), 7) || isCheckerMovePossible((box.id *1), 9))&& !data.didPlayerJustEat)
                                        validateMoveConfirmation((box.id *1));
                                    else if((isCheckerMovePossible((box.id *1), 14)) || (isCheckerMovePossible((box.id *1), 18)))
                                        attemptEatMove((box.id *1), +1);
                                    else if(data.didPlayerJustEat) 
                                        checkSecondEatMove((box.id *1)); 
                                } 
                            }
                            else {
                                if(((squares[currentCheckerSquaresIndex-1].pawn.isWhite) && whiteTurn)
                                || ((!squares[currentCheckerSquaresIndex-1].pawn.isWhite) && !whiteTurn))
                                    checkQueenMove((box.id *1));
                            }
                        }
                    }
                })
            }
            board.appendChild(box);
            isWhite=!isWhite;
            squares[count-1]= new Square(null);
            count++;
        }
    }
}
window.onload= function(){createBoard(); }
function markPotentialMoveBox(checker){
    let checkerID= parseInt(checker.id);
    let delta= whiteTurn?-1:1;
        let potentialBox=document.getElementById((checkerID+(delta*7))+"");
        if(potentialBox!==null&&(isCheckerMovePossible(checkerID+(delta*7),(delta*7))))
            potentialBox.classList.add("marked")
        potentialBox=document.getElementById((checkerID+(delta*9))+"");
        if(potentialBox!==null&&(isCheckerMovePossible(checkerID+(delta*9),(delta*9))))
            potentialBox.classList.add("marked")
}
function isCheckerMovePossible(selectedBoxID,delta){
    if((currentCheckerSquaresIndex+delta === selectedBoxID) && !squares[selectedBoxID-1].pawn)
        return true;
    return false;
}
function calculateIndex(count){
    let index=count*2+1;;
    if (count>3|| count >23)
        index=count*2;
    if (count>7 || count>27)
        index=count*2+1;
    if (count>19 || count>27)
        index=count*2;
    if (count >23 && count<28)
        index=count*2+1;
    return index;
}
function addCheckersData(){
    const brownBoxes=document.getElementsByClassName('brownBox')
    let count=0;
    for(let brownBox of brownBoxes){// nn to create default board on the squares then use this
        if(count<12 || count > 19)  // nn to update to create the board from the squares sent
        {
            let index= calculateIndex(count);
            if(count>19)
                squares[index].pawn= new Pawn(true  ,false)
            else
                squares[index].pawn= new Pawn(false  ,false)
        }
        count++;
    }
}
function unmarkBoxes(){
    let markedBoxes=document.getElementsByClassName("marked");
    for(let markedBox of markedBoxes){
        markedBox.classList.remove("marked");
    }
    if(markedBoxes[0]!=null)
        markedBoxes[0].classList.remove("marked");
}
function burnCheckerUI(){
    squares[currentCheckerSquaresIndex-1]=new Square(null);// might not need
    currentChecker.remove();
}
function validateMoveConfirmation(destinationBoxID,checkerToEatID){
    unmarkBoxes();
    squares[destinationBoxID-1].pawn= squares[currentCheckerSquaresIndex-1].pawn;
    squares[currentCheckerSquaresIndex-1]= new Square(null);
    checkIfCheckerUpgradesToQueen(destinationBoxID);
    if(checkerToEatID)
        updateData(checkerToEatID);
    else
        updateData()
    if((whiteTurn && data.didPlayerJustEat)||(!whiteTurn && data.didPlayerJustEat)){
        document.getElementById(checkerToEatID+"").firstChild.remove();
        black.countCheckers();
        white.countCheckers();
        currentCheckerSquaresIndex=destinationBoxID
        if(!canPlayerContinueEating(false))
            switchTurn();
    }
    else{
        if(whiteTurn)
            white.didPlayerMissAnEatMove()
        else
            black.didPlayerMissAnEatMove()
        switchTurn();
    }   
}
function upgradeToQueenUI(thisChecker){
    if(!thisChecker){
        currentChecker.innerHTML="Q";
        currentChecker.classList.add("queen");
    }
    else{
        thisChecker.innerHTML="Q";
        thisChecker.classList.add("queen");
    }
}
function checkIfCheckerUpgradesToQueen(destinationBoxID){
    if(whiteTurn){
        switch (destinationBoxID){
            case 2: case 4: case 6: case 8: 
            squares[destinationBoxID-1].pawn.isQueen=true;
            break;
        }
    }
    else{
        switch (destinationBoxID){
            case 57: case 59: case 61: case 63: 
            squares[destinationBoxID-1].pawn.isQueen=true;
            break;
        }
    }
}
function isEatingDirectionPossible(delta,scanning,color){
    let boxToEatIndex=null;
    if(delta<0){
        if(isCheckRelevantMinus(delta) &&(!scanning || color ==="white"))
            boxToEatIndex=currentCheckerSquaresIndex+delta
    }
    else{
        if(isCheckRelevantPlus(delta) &&(!scanning || color ==="black"))
            boxToEatIndex=currentCheckerSquaresIndex+delta
    }
    if(boxToEatIndex!==null ){
        let possibleDestinationBoxID = currentCheckerSquaresIndex +delta*2
        if(delta<0)
            delta=-1
        else
            delta=1
        return attemptEatMove(possibleDestinationBoxID,delta,true);
    }
    return false
}
function canPlayerContinueEating(scanning, color){
    if(isEatingDirectionPossible(-7,scanning,color))
        return true
    if(isEatingDirectionPossible(-9,scanning,color))
        return true
    if(isEatingDirectionPossible(7,scanning,color))
        return true
    if(isEatingDirectionPossible(9,scanning,color))
        return true
    return false
}