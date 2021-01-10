function GameData(board,didPlayerJustEat){
    this.board=board;
    this.didPlayerJustEat=didPlayerJustEat;
}
let whiteTurn=true;
let currentCheckerSquaresIndex;
let squares=[];
let data= new GameData(squares,false);
function Square(pawn){
    this.pawn=pawn;
}
function Pawn(isWhite,isQueen){
    this.isWhite=isWhite;
    this.isQueen=isQueen;
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
module.exports={
    checkIfCheckerUpgradesToQueen,
    checkSecondEatMove,
    isCheckerMovePossible,
    checkQueenMove,
    attemptEatMove,
    isCheckRelevantMinus,
    isCheckRelevantPlus
}