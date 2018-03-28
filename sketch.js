var phase = 0;

function setup() {
  createCanvas(1500, 1500);
}
    
function draw() {
    // Choose whether to display instructions, controls, or map.
    if (phase == 0) { 
      noLoop();    
      draw_0();
    } else if (phase == 1) { 
      noLoop();    
      draw_1();
    } else if (phase == 2) {
      draw_2();
    }
}

function draw_0() {
    // Draw the page of instructions.
    // textSize(14);
    message = "Now you, too, can gerrymander districts, just like your elected officials!\n"+
    "\n" +
    "The idea is that each colored cell (red or blue) represents a single vote.\n" +
    "Voters are arranged in districts. Each district is red or blue, depending\n" +
    "on the majority vote in that district (yellow represents a tie). The color\n" +
    "that wins the most districts is the overall winner.\n"+
    "\n" +
    "Begin by choosing your favorite color, the odds against you, and the\n" +
    "degree of segregation.\n" +
    "\n" +
    "You can enlarge a district by clicking inside it and dragging into another\n" +
    "district, with the following restrictions:\n" +
    "  * No district can be more than three times its original size.\n" +
    "  * No district can be less than half its original size.\n" +
    "  * Each district must remain contiguous.\n" +
    "If dragging doesn't work, you are trying to break one of these rules.\n" +
    "\n" +
    "You can win more districts for your color by causing your opponent's\n" +
    "votes to be wasted. A vote is \"wasted\" if (1) it is cast for the losing\n" +
    "side in a district, or (2) if it is in excess of the votes needed to\n" +
    "win that district. Hence, there are two basic gerrymandering strategies:   \n" +
    "  * Packing: If your opponent is solidly winning a district, move more\n" +
    "      of their voters into it, thus making those votes \"surplus\".   \n" +
    "  * Cracking: If you are solidly winning a district, move some of your\n" +
    "      surplus voters to a district that they can help you win.  \n" +
    "\n" +
    "Besides just trying to win a majority of districts, you could try to\n" +
    "see how large an \"efficiency gap\" you can create. The efficiency gap\n" +
    "is the difference between the wasted votes of the two sides, divided\n" +
    "by the total number of votes cast. That is:\n" +
    "  efficiency gap = abs(red votes wasted - blue votes wasted) / total votes\n" +
    "\n" +
    "Here's a fun article:\n" +
    "    http://www.benjerry.com/whats-new/2017/04/district-or-inkblot-quiz\n" +
    "\n" +
    "The larger you can make the efficiency gap, the more effective is your\n" +
    "gerrymandering.\n" +
    "\n" +
    "This is a toy, not a game, so there are no defined ending conditions.\n" +
    "Play with it as long as you like, and stop when you are tired of it.\n" +
    "\n" +
    "Happy gerrymandering!\n";
    
    text(message, 30, 30);
    
    begin = "Set Preferences";
    beginButton = createButton(begin);
    beginButton.position(250, 630);
    beginButton.mousePressed(startPhase1);
}
  
//----------------------------------------------------------------------------------

var segregation;

function startPhase1() {
  phase = 1;
  removeElements();
  resizeCanvas(1000, 1000);
  redraw();
}

function draw_1() {
  div0 = createDiv("Choose parameters, then hit 'Start' to play.");
  div0.position(10, 20);
  
  var v = ['None', 'Some', 'Moderate', 'Very', 'Extreme'];
  segregationRB = createRadioButtons("Amount of segregation:", v, 2, 50);
  
  v = ['50-50', '55-45', '60-40', '65-35', '70-30', '75-25'];
  balanceRB = createRadioButtons("Voter balance:", v, 2, 100);
  
  v = ["Small (3x3)", "Medium (4x4)", "Large (5x5)"];
  boardSizeRB = createRadioButtons("Board size:", v, 1, 150);
  
  v = ["Red", "Blue"];
  myColorRB = createRadioButtons("Your color:", v, 0, 200);
  
  var button = createButton("Start");
  button.position(250, 250);
  button.mousePressed(startPhase2);
}

function createRadioButtons(label, values, chosen, y) {
  var div = createDiv(label);
  div.position(10, y);
  var radio = createRadio();
  for (var i = 0; i < values.length; i++) {
    var opt = radio.option(values[i]);
    if (i == chosen) {
      radio.value(values[chosen]);
    }
  }
  radio.position(10, y + 20);
  return radio;
}

function getParameters() {
  segregationString = segregationRB.value();
  balanceString     = balanceRB.value();
  boardSizeString   = boardSizeRB.value();
  myColorString     = myColorRB.value();
}
  
//----------------------------------------------------------------------------------
// OBJECTS

function District(row, column) {
	this.row = row;       // constant, part of unique id
	this.column = column; // constant, part of unique id
  this.size = rowsPerDistrict * columnsPerDistrict;  // changeable
}

function Cell(vote, district) {
	// vote is -1 for red, +1 for blue; district is Pair(row, column)
	this.vote = vote;          // constant
	this.district = district;  // changeable
}

function Location(row, column) {
	this.row = row;       // constant, part of unique id
	this.column = column; // constant, part of unique id
}

Location.prototype.toString = function locationToString() {
  return "[" + this.row + "][" + this.column + "]";
}

Location.prototype.equals = function (that) {
    return this.row == that.row && this.column == that.column;
};

//----------------------------------------------------------------------------------

resultsHeight = 70;

function startPhase2() {
	phase = -1; // hack to keep draw() from doing anything
  getParameters();
  interpretParameters();
  removeElements();
  resizeCanvas(800, 800);
  createDistricts();
  createMap();
  message = "";
  touching = false;
  phase = 2;
	
  loop();
}

function interpretParameters() {
	// Define constants: segregation, percentRed, percentBlue, myColor, districtRows,
	//     districtColumns, rowsPerDistrict, columnsPerDistrict, rows, columns
  interpretBoardSize();
  interpretSegregation();
  interpretBalance();
  interpretChosenColor();
}

function interpretSegregation() {
	// Determine the number of 'swaps' to achieve desired segregation
  // Must have previously called interpretBoardSize
  var factor = rows * columns;
	switch (segregationString) {
    case 'None':
      segregation = 0;
      break;
    case 'Some':
      segregation = 2 * factor;
      break;
    case 'Moderate':
      segregation = 4 * factor;
      break;
    case 'Very':
      segregation = 12 * factor;
      break;
    case 'Extreme':
      segregation = 100 * factor;
      break;
  }
}

function interpretBalance() {
	// Determine balance assuming Red is in the majority; adjust later
  switch (balanceString) {
    case '50-50':
      percentRed = 50;
      break;
    case '55-45':
      percentRed = 55;
      break;
    case '60-40':
      percentRed = 60;
      break;
    case '65-35':
      percentRed = 65;
      break;
    case '70-30':
      percentRed = 70;
      break;
    case '75-25':
      percentRed = 75;
      break;
  }
  percentBlue = 100 - percentRed;
}

function interpretChosenColor() {
  // Chosen color should be on the losing side
  myColor = myColorString;
  if (myColor == "Red") {
    percentRed = 100 - percentRed;
  }
}

function interpretBoardSize() {
	// Board is composed of districts, which are composed of individual Cells
  // Set the number of districts (districtRows x districtColumns)
  switch (boardSizeString) {
    case "Small (3x3)":
      districtRows = districtColumns = 3;
      break;
    case "Medium (4x4)":
      districtRows = districtColumns = 4;
      break;
    case "Large (5x5)":
      districtRows = districtColumns = 5;
      break;
  }
  // Set the initial number of rows and columns in each district
  rowsPerDistrict = columnsPerDistrict = 5;
	// Set the total number of cells (rows x columns)
	rows = districtRows * rowsPerDistrict;
	columns = districtColumns * columnsPerDistrict;
}
  
function createDistricts() {
  // Creates a global array of Districts, accessed by districts[i][j], with initial size
  districts = new Array();
  initialDistrictSize = rowsPerDistrict * columnsPerDistrict; // global
	for (var i = 0; i < districtRows; i++) {
    districts[i] = new Array();
		for (var j = 0; j < districtColumns; j++) {
      districts[i][j] = new District(i, j);
      districts[i][j].size = initialDistrictSize;
    }
  }
  noSuchDistrict = new District(-1, -1);  // global
}

function initialDistrictOf(row, col) {
	// Return initial district of a Cell, based on its row and column
	return districts[div(row, rowsPerDistrict)][div(col, columnsPerDistrict)];
}

function districtOf(row, col) {
  // Return current district of a given cell
  return matrix[row][col].district;
}

function outOfBounds(row, col) {
  return row < 0 || col < 0 || row >= rows || col >= columns;
}

function createMap() {
	// Create a 2D array of Cells
  text("rows=" + rows + "  columns=" + columns, 30, 20);
	matrix = new Array();
	for (var i = 0; i < rows; i++) {
		matrix[i] = new Array();
	}
  var voteList = makeVoteList();
  var k = 0;
	for (var i = 0; i < rows; i++) {
		for (var j = 0; j < columns; j++) {
			matrix[i][j] = new Cell(voteList[k], initialDistrictOf(i, j));
      k += 1;
		}
	}
  segregate(segregation);
}

function makeVoteList() {
  var voteArray = new Array();
  var votes = rows * columns;
  redCellCount = Math.trunc((votes * percentRed) / 100);  // global
  blueCellCount = votes - redCellCount;                   // global
  for (var i = 0; i < votes; i++) {
    voteArray[i] = i < redCellCount ? -1 : +1;
  }
  randomize(voteArray);
  return voteArray;
}

function randomize(anArray) {
  for (var i = anArray.length; i > 1; i--) {
    var choice = randomInt(i);
    var temp = anArray[choice];
    anArray[choice] = anArray[i - 1];
    anArray[i - 1] = temp;
  }
}

function segregate(nMoves) {
  // Move votes around until desired degree of segregation is achieved
  for (var m = 0; m < nMoves; m++) {
    ii = randomInt(rows);
    jj = randomInt(columns);
    myVote = matrix[ii][jj].vote;
    otherVotes = getSurroundingVotes(ii, jj);
    if (myVote * otherVotes < 0) {
      oi = randomInt(rows);
      oj = randomInt(columns);
      matrix[ii][jj].vote = matrix[oi][oj].vote;
      matrix[oi][oj].vote = myVote;
    }
  }
}

function getSurroundingVotes(ii, jj) {
  // Sum votes surrounding cell (ii, jj), where red=-1 and blue=+1
  count = -matrix[ii][jj].vote;
  for (var i = ii - 1; i <= ii + 1; i++) {
    for (var j = jj - 1; j <= jj + 1; j++) {
      if (i >= 0 && i < rows && j >= 0 && j < columns) {
        count += matrix[i][j].vote;
      }
    }
  }
  return count;
}

function countVotes() {
  // countPopularVotes();
  countVotesInEachDistrict();
  countDistrictVotes();
  countWastedVotes();
  efficiencyGap = computeEfficiencyGap();
}

function countPopularVotes() {
  // Set 'popularVote' to total blue votes - total red votes
  popularVote = 0;
  for (var i = 0; i < rows; i++) {
    for (var j = 0; j < columns; j++) {
      popularVote += matrix[i][j].vote;
    }
  }
}

function countVotesInEachDistrict() {
  // Determine how each district has voted, as - to + district size
	for (var i = 0; i < districtRows; i++) {
		for (var j = 0; j < districtColumns; j++) {
      districts[i][j].vote = 0;   // global, changed in next pair of loops
    }
  }
	for (var i = 0; i < rows; i++) {
		for (var j = 0; j < columns; j++) {
      matrix[i][j].district.vote += matrix[i][j].vote; 
    }
  }
}

function countSizeOfEachDistrict() {
  // Determine how many cells in each district
	for (var i = 0; i < districtRows; i++) {
		for (var j = 0; j < districtColumns; j++) {
      districts[i][j].size = 0;
    }
  }
	for (var i = 0; i < rows; i++) {
		for (var j = 0; j < columns; j++) {
      matrix[i][j].district.size += 1; 
    }
  }
}

function countDistrictVotes() {
  // Count how districts voted, therefore also electoral vote
  electoralVote = redDistricts = blueDistricts = 0; // all global
  for (var i = 0; i < districtRows; i++) {
    for (var j = 0; j < districtColumns; j++) {
      if (districts[i][j].vote < 0) {
        redDistricts += 1;
        electoralVote -= 1;
      } else if (districts[i][j].vote > 0) {
        blueDistricts += 1;
        electoralVote += 1;
      }
    }
  }
}

function countWastedVotes() {
  wastedRedVotes = wastedBlueVotes = 0;  
  for (var i = 0; i < districtRows; i++) {
    for (var j = 0; j < districtColumns; j++) {
      var vote = districts[i][j].vote;
      var size = districts[i][j].size;
      var votesNeededToWin = div(size, 2) + 1;
      var blueVotes = div(size + vote, 2);
      var redVotes = size - blueVotes;
      if (vote < 0) { // Red wins district
        wastedRedVotes += redVotes - votesNeededToWin;
        wastedBlueVotes += blueVotes;
      } else if (vote > 0) { // blue wins district
        wastedRedVotes += redVotes;
        wastedBlueVotes += blueVotes - votesNeededToWin;
      } else { // all votes wasted
        wastedRedVotes += redVotes;
        wastedBlueVotes += blueVotes;
      }
    }
  } 
}

function computeEfficiencyGap() {
  return Math.abs(wastedRedVotes - wastedBlueVotes) / (rows * columns);
}

startRow = startCol = -1;

function draw_2() {
	// Draw the map in its current state
	fill(255, 255, 255);
  rect(0, 0, width, height);
	// The following variables are all global
  mapWidth = width;
  mapHeight = height - resultsHeight;
  hGap = mapWidth / 4 / columns;
  vGap = mapHeight / 4 / rows;
  gap = (hGap + vGap) / 2;
  cellWidth = mapWidth / (columns + 1.5) - hGap;
  cellHeight = mapHeight / (rows + 1.5) - vGap;
	drawSquares();
  drawDistrictOutlines();
  showVoteDifference();
  drawStatus();
  drawMessage();
  
  countVotes();
  inCell(mouseX, mouseY);
  
text("Starting at " + startRow + " " + startCol, 550, mapHeight + 50);
}

function drawSquares() {
	//Draw squares on map, red if -1, blue if +1
	stroke(0)
  for (var i = 0; i < rows; i++) {
    for (var j = 0; j < columns; j++) {
      var cell = matrix[i][j];
      setCellFill(cell.vote);
      rect(cellLeft(i, j), cellTop(i, j), cellWidth, cellHeight);
		}
	}
}

function drawDistrictOutlines() {
  // Draw outlines around regions depending on the winning color (yellow if tie)
  countVotes();
  noStroke();
  for (var i = 0; i < rows; i++) {
    for (var j = 0; j < columns; j++) {
      var cell = matrix[i][j];
      // vote = districtVote[cell.district];
      vote = cell.district.vote;
      setBorderFill(vote);
      
      var halfgap = hGap / 2;
      var inset = 5;
      var outset = halfgap;
      var thickness = inset + outset;
      // left
      if (j == 0 || districtsDiffer(i, j, i, j - 1)) {
        rect(cellLeft(i, j) - outset, cellTop(i, j) - vGap / 2, thickness, cellHeight + vGap);
      }
      // right
      if (j == columns - 1 || districtsDiffer(i, j, i, j + 1)) {
        rect(cellRight(i, j) - inset, cellTop(i, j) - vGap / 2, thickness, cellHeight + vGap);
      }
      
      halfgap = vGap / 2;
      var inset = 5;
      var outset = halfgap;
      var thickness = inset + outset;
      // top
      if (i == 0 || districtsDiffer(i, j, i - 1, j)) {
        rect(cellLeft(i, j) - hGap / 2, cellTop(i, j) - outset, cellWidth + hGap, thickness);
      }
      // bottom
      if (i == rows - 1 || districtsDiffer(i, j, i + 1, j)) {
        rect(cellLeft(i, j) - hGap / 2, cellBottom(i, j) - inset, cellWidth + hGap, thickness);
      }
    }
  }
}

function showVoteDifference() {
    if (phase == 0 || phase == 1) return;
    var district = -1;
    var location = inCell(mouseX, mouseY);
    if (location == -1) return;
    district = districtOf(location.row, location.column);
    var votes = district.vote;
    if (myColor == "Red") votes = -votes;
    fill(255, 255, 255, 128);
    ellipse(mouseX + 10, mouseY - 8, 50, 40);
    fill(0, 0, 0);
    stroke(0, 0, 0);
    var spacer = votes > -1 && votes < 10 ? "  " : "";
    text(spacer + votes, mouseX - 5, mouseY);
}

function districtsDiffer(i, j, ii, jj) {
  // Test if two cells are in different districts (hence should be bordered)
  return matrix[i][j].district != matrix[ii][jj].district;
}

function cellTop(i, j) {
  // Returns the y coordinate of the top edge of the Cell in matrix[i][j]
  var y = mapHeight / (rows + 1.5);
  return (i + 1) * y;
}
         
function cellBottom(i, j) {
  // Returns the y coordinate of the bottom of matrix[i][j]
  return cellTop(i, j) + cellHeight;
}
         
function cellLeft(i, j) {
  // Returns the x coordinate of the left edge of the Cell in matrix[i][j]
  var x = mapWidth / (columns + 1.5);
  return (j + 1) * x;
}

function cellRight(i, j) {
  // Returns the x coordinate of the right of matrix[i][j]
  return cellLeft(i, j) + cellWidth;
}

function setCellFill(t) {
    // Set color (red, blue, or yellow) for cells
    if (t < 0) {
        fill(255, 0, 0);
		} else if (t > 0) {
         fill(50, 50, 255);
		} else if (t == 0) {
        fill(255, 255, 0);
		} else {
        fill(127, 127, 127); // Should not happen
		}
}

function setBorderFill(t) {
    // Set color (red, blue, or yellow) for borders
    if (t < 0) {
        fill(128, 0, 0);
		} else if (t > 0) {
         fill(0, 0, 192);
		} else if (t == 0) {
        fill(255, 255, 0);
		} else {
        fill(127, 127, 127); // Should not happen
		}
}


function setTextColor(t) {
    // Set color (red, blue, or gold) for text
    if (t < 0) {
        stroke(255, 0, 0);
        fill(255, 0, 0);
		} else if (t > 0) {
         stroke(50, 50, 255);
         fill(50, 50, 255);
		} else if (t == 0) {
        stroke(218,165,32);
        fill(218,165,32);
		} else {
        stroke(127, 127, 127); // Should not happen
        fill(255, 255, 255);
		}
}

function inCell(x, y) {
  // Returns the (row, column) of the cell at (x, y)
  var topY = mapHeight / (rows + 1.5) - vGap / 2;
  var row = int(floor((y - topY) / (cellHeight + vGap)));
  var leftX = mapWidth / (columns + 1.5) - hGap / 2;
  var column = int(floor((x - leftX) / (cellWidth + hGap)));
  if (row < 0 || row >= rows || column < 0 || column >= columns) {
    return -1;
  }
  return new Location(row, column);
}

function mousePressed() {
  // Sets global 'districtToExtend' to the district mouse starts in
  if (phase != 2) return;
  var location = whereIAm();
  startExtension(location);
  return false;
}

function touchStarted() {  
  if (phase != 2) return;
  touching = true;
  var location = whereIAm();
  startExtension(location);
}

function whereIAm() {
  if (mouseIsPressed) return inCell(mouseX, mouseY);
  if (touching) {
    var lastTouch = touches[touches.length - 1];
    return inCell(lastTouch.x, lastTouch.y);
  }
  return -1;
}

function startExtension(location) {
  if (location == -1) {
    districtToExtend = noSuchDistrict;
    previousLocation = -1;
  } else {
    districtToExtend = districtOf(location.row, location.column);
    previousLocation = location;
  }
}

function adjacentLocations(loc1, loc2) {
  if (loc1 == -1 || loc2 == -1) return false;
  if (loc1.row == loc2.row) return Math.abs(loc1.column - loc2.column) == 1;
  if (loc1.column == loc2.column) return Math.abs(loc1.row - loc2.row) == 1;
  return false;
}

function mouseDragged() {
  // Change district membership of cells while dragging
  // global districtToExtend
  if (phase != 2 || districtToExtend == -1) return;
  var location = whereIAm();
  extendDistrict(location);
}

function touchMoved() {
  if (phase != 2 || districtToExtend == -1) return;
  var location = whereIAm();
  extendDistrict(location);
}

function touchEnded() {
  districtToExtend = -1;
  touching = false;
  return false;
}
  
function extendDistrict(location) {
  if (location == -1) {
    districtToExtend = noSuchDistrict;
    return;
  }
  var row = location.row;
  var col = location.column;
  var districtToReduce = matrix[row][col].district;
  if ( ! sameDistrict(districtToReduce, districtToExtend)) {
    if (legalToExtend(districtToExtend, districtToReduce, row, col)) {
      matrix[row][col].district = districtToExtend;
      districtToExtend.size += 1;
      districtToReduce.size -= 1;
    } else {
      districtToExtend = noSuchDistrict;
    }
  }
}
  
function legalToExtend(bully, victim, row, col) {
  // Decide if a bully district can be extended to take over a victim
  //    district. Size and contiguity restrictions apply
  // *** Modifies 'previousLocation'
  
  // Can't start from outside array of cells
  if (bully == noSuchDistrict || victim == noSuchDistrict) return false;
  
  //  Can't reduce a district to less than half its original size
  if (victim.size <= initialDistrictSize / 2) return false;

  // Can't enlarge a district to more than three times its original size
  if (bully.size > 3 * initialDistrictSize) return false;
  
  // Can't split a district into two or more pieces
  if ( ! contiguousDistrict(row, col)) return false;
  
  // Can't move diagonally or skip over cells
  var newLocation = new Location(row, col);
  if ( ! adjacentLocations(newLocation, previousLocation)) return false;
  
  previousLocation = newLocation;  
  return true;  
}

function sameDistrict(district1, district2) {
  // Determine if two districts (or locations) are the same
  return district1.row == district2.row && district1.column == district2.column;
}

function inSameDistrict(row1, col1, row2, col2) {
  var district1 = matrix[row1][col1].district;
  var district2 = matrix[row2][col2].district;
  return sameDistrict(district1, district2);
}

function contiguousDistrict(row, col) {
  // Is the district of (row, col) contiguous if that cell is removed?
  var district = matrix[row][col].district;
  var startingPoint = findStartingPoint(row, col);
  startRow = startingPoint.row;
  startCol = startingPoint.column;
  var cells = new Array();
  matrix[row][col].district = noSuchDistrict;    // temporary
  explore(district, startRow, startCol, cells);
  matrix[row][col].district = district;          // restored
  return district.size == cells.length + 1;
}

function findStartingPoint(row, col) {
  // Find any one cell adjacent to (row, col) that is in the same district
  
  if (row > 0 && inSameDistrict(row, col, row - 1, col)) {
    return new Location(row - 1, col);
  }
  if (col > 0 && inSameDistrict(row, col, row, col - 1)) {
    return new Location(row, col - 1);
  }
  if (row + 1 < rows && inSameDistrict(row, col, row + 1, col)) {
    return new Location(row + 1, col);
  }
  if (col + 1 < columns && inSameDistrict(row, col, row, col + 1)) {
    return new Location(row, col + 1);
  }
  // Happens only if (row, col) is isolated, which should be impossible
  return noSuchDistrict;
}

function explore(district, row, col, cells) {
  // Starting with 'cells', which is an Array of Location,
  //   find all contiguous cells that are in the same district
  
  // If out of bounds, don't explore further
  if (outOfBounds(row, col)) return cells;
  
  // If it's a different district, don't explore further
  var cellDistrict = matrix[row][col].district;  
  if ( ! sameDistrict(district, cellDistrict)) return cells;
  
  // If we've already explored from here, don't explore further 
  for (var i = 0; i < cells.length; i++) {
    if (cells[i].row == row && cells[i].column == col) return cells;
  }
  
  // Mark this location as explored and explore from here
  cells.push(new Location(row, col));
  cells = explore(district, row - 1, col, cells);
  cells = explore(district, row + 1, col, cells);
  cells = explore(district, row, col - 1, cells);
  cells = explore(district, row, col + 1, cells);
  return cells;
}

function drawStatus() {
  // Display information at bottom of map
  translate(25, mapHeight - 10);
  fill(0);
  textFont("Helvetica", 18);
  text("Your color:", 15, 10);
  text("Popular vote:", 145, 10);
  text("Red", 150, 30);
  text(redCellCount, 200, 30);
  text("Blue", 150, 50);
  text(blueCellCount, 200, 50);
    
  text("District vote:", 300, 10);
  text("Red", 305, 30);
  text(redDistricts, 355, 30);
  text("Blue", 305, 50);
  text(blueDistricts, 355, 50);
    
  winningColor = redDistricts > blueDistricts ? "Red" : "Blue";
    
  text("Wasted votes:", 440, 10);
  text("Red", 450, 30);
  text(wastedRedVotes, 500, 30);
  text("Blue", 450, 50);
  text(wastedBlueVotes, 500, 50);
    
  efficiencyGap = abs(wastedRedVotes - wastedBlueVotes) / (rows * columns);
  eg = int(100000 * efficiencyGap) / 100000.0;
  text("Efficiency gap:", 580, 10);
  text(eg, 590, 30);
    
  textFont("Helvetica", 24);
  
  if (redDistricts > blueDistricts) {
    msg = "Red is winning";
  } else if (blueDistricts > redDistricts) {
    msg = "Blue is winning";
  } else {
    msg = "Tie vote";
  }
  setTextColor(blueDistricts - redDistricts);
  text(msg, 580, 55);
  
  setTextColor(myColor == 'Red' ? -1 : +1);
  text(myColor, 25, 45);
}

function drawMessage() {
  text(message, 250, mapHeight + 50);
}

function randomInt(limit) {
  return Math.floor(Math.random() * limit);
}

function div(x, y) {
  return Math.trunc(x / y);
}

function sgn(x) {
  return x < 0 ? -1 : (x > 0 ? 1 : 0);
}

function odd(x) { return x & 1; };
