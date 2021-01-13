const socket = io()
const {token,room,username}= Qs.parse(location.search,{ ignoreQueryPrefix: true})
if(!room||!token||!username)
    location.href='/'

const headerText=document.getElementById("text");
const startButton=document.getElementById("start")
const board= document.getElementById('board')
const skipButton=document.getElementById("skipturn");

let firstClick=false,gameOver=false,whiteTurn=true, burntBox=null;
let squares=[];
let data= new GameData(squares,false);
let currentChecker=document.createElement('div')
currentChecker.id="default"
let currentCheckerSquaresIndex;
function GameData(board,didPlayerJustEat){
    this.board=board;
    this.didPlayerJustEat= didPlayerJustEat
}
function Square(pawn){
    this.pawn=pawn;
}
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
socket.on('update UI',({updatedBoard})=>{
    updateBoard(updatedBoard)
    updateCheckersUI()
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
socket.on('Player left',({username})=>{
    alert(username +" has left the game, Going back to lobby")
    // later will try to get him to return to lobby 
    // nn to add ratings here, the player getting this notification will get 3 ratings
    // the leaver will not get points
    // in a normal game, winner will get 3 points loser 1
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
function updateData(originIndex ,destinationIndex,checkerToEatIndex,checkerBurnt){
    if(!checkerBurnt){
        squares[destinationIndex-1].pawn= squares[originIndex-1].pawn;
        squares[originIndex-1]= new Square(null);
        currentCheckerSquaresIndex=destinationIndex;
        if(checkerToEatIndex!=null){
            squares[checkerToEatIndex-1]=new Square(null);
        }
    }
    socket.emit('update UI',{updatedBoard:data.board,id:socket.id},(updatedBoard)=>{
        updateBoard(updatedBoard)
        updateCheckersUI()
    })
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
                if(squares[i].pawn.isQueen){
                    currentChecker=checker
                    upgradeToQueenUI()
                }
            }
            else{
                checker.className="black checker"
                brownBox.appendChild(checker)
                if(squares[i].pawn.isQueen){
                    currentChecker=checker
                    upgradeToQueenUI()
                }
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
                        currentChecker.classList.add("markedChecker");
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
    if(currentChecker!==null){
        currentChecker.classList.remove("markedChecker");
    }
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
    skipButton.disabled=false;
    headerText.innerHTML="Its the white player's turn";
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
        endGameUI(this);
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
                    burnCheckerUI(this);
                    updateData(0,0,0,true)
                    return true;
                }
            }
        }
    }
    return false;
}
function checkIfCheckerUpgradesToQueen(){
    if(whiteTurn){
        switch (currentCheckerSquaresIndex){
            case 2: case 4: case 6: case 8: 
            upgradeToQueenUI();
            squares[currentCheckerSquaresIndex-1].pawn.isQueen=true;
            break;
        }
    }
    else{
        switch (currentCheckerSquaresIndex){
            case 57: case 59: case 61: case 63: 
            upgradeToQueenUI();
            squares[currentCheckerSquaresIndex-1].pawn.isQueen=true;
            break;
        }
    }
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
skipButton.disabled=true;
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
function endGameUI(player){
    gameOver=true;
    skipButton.disabled=true;
    alert("Congratulations to the winner!");
    if(player.color==="white")
        headerText.innerHTML= "Black player won";
    else
        headerText.innerHTML="White player won";
    const allBoxes= document.getElementsByClassName("box");
    for(let box of allBoxes){
        box.disabled=true;
    }
    const allCheckers= document.getElementsByClassName("checker")
    for(let checker of allCheckers){
        checker.disabled=true;
    }
}
function burnCheckerUI(player){
    squares[(currentChecker.id*1)-1]=new Square(null);
    data.board[(currentChecker.id*1)-1]= new Square(null)
    burntBox=document.getElementById(currentChecker.id)
    burntBox.classList.add("burntchecker");
    burntBox.innerHTML="Burnt";
    currentChecker.remove();
    player.countCheckers();
    alert(player.color+" player, your checker has burnt, pay more attention!");
}
function confirmMoveUI(destinationBoxID){
    const destinationBox=document.getElementById(destinationBoxID+"")
    destinationBox.appendChild(currentChecker);
    currentChecker.id=destinationBox.id;    
    currentChecker.classList.remove("markedChecker");
}
function validateMoveConfirmation(destinationBoxID,checkerToEatID){
    unmarkBoxes();
    if((whiteTurn && !data.didPlayerJustEat )||(!whiteTurn &&!data.didPlayerJustEat)){
        let color=whiteTurn?"white":"black";
        if(!canPlayerContinueEating(true,color))
            confirmMoveUI(destinationBoxID);
        else{
            if(color==="white")
                burnCheckerUI(white);
            else
                burnCheckerUI(black);
        }
    }
    else
        confirmMoveUI(destinationBoxID);
    if(checkerToEatID)
        updateData((currentCheckerSquaresIndex),destinationBoxID,checkerToEatID);
    else
        updateData(currentCheckerSquaresIndex,destinationBoxID)
    checkIfCheckerUpgradesToQueen();
    if((whiteTurn && data.didPlayerJustEat)||(!whiteTurn && data.didPlayerJustEat)){
        document.getElementById(checkerToEatID+"").firstChild.remove();
        black.countCheckers();
        white.countCheckers();
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
function upgradeToQueenUI(){
    currentChecker.innerHTML="Q";
    currentChecker.classList.add("queen");
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