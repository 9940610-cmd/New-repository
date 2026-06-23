let currentScreen = "LOGIN"; 
let accountInput, passwordInput, loginButton; 
let loginErrorMessage = ""; 

let currentLetter = "";     
let letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
let levelPositions = [];    

let unlockedLevels = {}; 

let isLevelCompleted = false;
let objectX; 
let objectAlpha = 0; 

let isPencilChecked = false;
let praiseTimer = 0;
let praiseText = ""; 
let isWritingCorrect = false; 

let fireworks = [];
let floatingLetters = [];
let currentTool = "PEN"; 

let scribbleLayer; 
let pencilLayer;   
let templateLayer; 

let targetPoints = []; 
let userCoveredPoints = 0; 
let outOfBoundsCount = 0; 
let errorFlashFrameStart = 0; 

const wordData = {
  'A': { word: "Ant", ch: "螞蟻", spell: "a - n - t", draw: drawAnt },
  'B': { word: "Bus", ch: "公車", spell: "b - u - s", draw: drawBus },
  'C': { word: "Cat", ch: "貓咪", spell: "c - a - t", draw: drawCat },
  'D': { word: "Dog", ch: "狗狗", spell: "d - o - g", draw: drawDog },
  'E': { word: "Egg", ch: "雞蛋", spell: "e - g - g", draw: drawEgg },
  'F': { word: "Fox", ch: "狐狸", spell: "f - o - x", draw: drawFox },
  'G': { word: "Gum", ch: "糖果", spell: "g - u - m", draw: drawGum },
  'H': { word: "Hat", ch: "帽子", spell: "h - a - t", draw: drawHat },
  'I': { word: "Ice", ch: "冰塊", spell: "i - c - e", draw: drawIce }, 
  'J': { word: "Jam", ch: "果醬", spell: "j - a - m", draw: drawJam },
  'K': { word: "Key", ch: "鑰匙", spell: "k - e - y", draw: drawKey },
  'L': { word: "Log", ch: "木頭", spell: "l - o - g", draw: drawLog },
  'M': { word: "Mud", ch: "泥巴", spell: "m - u - d", draw: drawMud },
  'N': { word: "Nut", ch: "堅果", spell: "n - u - t", draw: drawNut },
  'O': { word: "Owl", ch: "貓頭鷹", spell: "o - w - l", draw: drawOwl },
  'P': { word: "Pig", ch: "小豬", spell: "p - i - g", draw: drawPig },
  'Q': { word: "Queen", ch: "女王", spell: "q - u - e - e - n", draw: drawQueen },
  'R': { word: "Red", ch: "紅色", spell: "r - e - d", draw: drawRed },
  'S': { word: "Sun", ch: "太陽", spell: "s - u - n", draw: drawSun }, // ✨ 修正點：stroke 改回 ch
  'T': { word: "Toy", ch: "玩具", spell: "t - o - y", draw: drawToy },
  'U': { word: "UFO", ch: "飛碟", spell: "u - f - o", draw: drawUFO },
  'V': { word: "Van", ch: "貨車", spell: "v - a - n", draw: drawVan },
  'W': { word: "Web", ch: "蜘蛛網", spell: "w - e - b", draw: drawWeb },
  'X': { word: "Box", ch: "盒子", spell: "b - o - x", draw: drawBoxObj },
  'Y': { word: "Yo-yo", ch: "溜溜球", spell: "y - o - y - o", draw: drawYoyo },
  'Z': { word: "Zoo", ch: "動物園", spell: "z - o - o", draw: drawZoo }
};

const KEY_MAP = {
  'Q': 'A', 'W': 'B', 'E': 'C', 'R': 'D', 'T': 'E', 'Y': 'F', 'U': 'G', 'I': 'H', 'O': 'I', 'P': 'J',
  'A': 'K', 'S': 'L', 'D': 'M', 'F': 'N', 'G': 'O', 'H': 'P', 'J': 'Q', 'K': 'R', 'L': 'S',
  'Z': 'T', 'X': 'U', 'C': 'V', 'V': 'W', 'B': 'X', 'N': 'Y', 'M': 'Z'
};

function setup() {
  pixelDensity(1); // ✨ 修正點：強制鎖定像素比，避免 iPad/Retina 高解析度螢幕導致寫字偵測失靈
  
  // 用程式碼直接在網頁上建立一個專屬盒子
  let holder = createElement('div');
  holder.id("game-container");
  holder.style('position', 'relative');
  holder.style('width', '100vw');
  holder.style('height', '100vh');
  holder.style('overflow', 'hidden');
  
  // 建立畫布並移入剛剛變出來的盒子裡
  let cnv = createCanvas(windowWidth, windowHeight);
  cnv.parent("game-container"); 
  cnv.style('position', 'absolute'); // ✨ 修正點：讓畫布絕對定位
  cnv.style('top', '0');
  cnv.style('left', '0');
  cnv.style('z-index', '1');         // ✨ 修正點：將畫布移至底層，防止擋住 HTML 輸入框與按鈕
  
  textAlign(CENTER, CENTER);
  
  createLoginUI();
  recalculateLayout();

  for (let i = 0; i < letters.length; i++) {
    unlockedLevels[letters[i]] = false; 
  }

  // 阻止整個網頁被手指拉動或放大縮小
  document.body.addEventListener('touchmove', function(e) {
    e.preventDefault();
  }, { passive: false });
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  recalculateLayout();
}

// 當螢幕長寬改變時，重新動態計算畫面比例位置
function recalculateLayout() {
  scribbleLayer = createGraphics(width, height);
  pencilLayer = createGraphics(width, height);
  templateLayer = createGraphics(width, height);
  clearCanvasLayers();

  if (accountInput) accountInput.position(width / 2 - 100, height / 2 - 60);
  if (passwordInput) passwordInput.position(width / 2 - 100, height / 2);
  if (loginButton) loginButton.position(width / 2 - 60, height / 2 + 60);

  // 重新生成隨機漂浮背景字母
  floatingLetters = [];
  let tempLetters = ["A", "B", "C"];
  for (let i = 0; i < 15; i++) {
    floatingLetters.push({
      x: random(width),
      y: random(height),
      size: random(width * 0.04, width * 0.07),
      char: random(tempLetters),
      speedY: random(0.5, 1.5),
      color: color(random(100, 230), random(120, 230), random(200, 255), 70)
    });
  }

  // 依據目前平板長寬，動態重新排列 26 關卡的小燈泡（保持完美等距網格）
  levelPositions = [];
  let cols = 7;
  let rows = 4;
  let hSpacing = width / (cols + 1);
  let vSpacing = (height - 140) / (rows + 1);
  
  for (let i = 0; i < 26; i++) {
    let col = i % cols; 
    let gridRow = Math.floor(i / cols); 
    let x = hSpacing * (col + 1); 
    let y = 140 + vSpacing * (gridRow + 1); // 💡 微調 y 軸起始高度，完美避開最上排標題
    levelPositions.push({ x: x, y: y, letter: letters[i] });
  }
}

function createLoginUI() {
  accountInput = createInput('');
  accountInput.parent("game-container");          
  accountInput.style('position', 'absolute');      
  accountInput.size(200, 32);
  accountInput.style('font-size', '16px');
  accountInput.style('border-radius', '8px');
  accountInput.style('border', '1px solid #ccc');
  accountInput.style('padding', '0 8px');
  accountInput.style('z-index', '9999'); // ✨ 修正點：提高層級           
  accountInput.attribute('placeholder', '請輸入數字 123');

  passwordInput = createInput('', 'password');
  passwordInput.parent("game-container");         
  passwordInput.style('position', 'absolute');     
  passwordInput.size(200, 32);
  passwordInput.style('font-size', '16px');
  passwordInput.style('border-radius', '8px');
  passwordInput.style('border', '1px solid #ccc');
  passwordInput.style('padding', '0 8px');
  passwordInput.style('z-index', '9999'); // ✨ 修正點：提高層級          
  passwordInput.attribute('placeholder', '請輸入數字 123');

  loginButton = createButton('登入 🔐');
  loginButton.parent("game-container");            
  loginButton.style('position', 'absolute');        
  loginButton.size(120, 40);
  loginButton.style('font-size', '16px');
  loginButton.style('font-weight', 'bold');
  loginButton.style('background-color', '#4b96eb');
  loginButton.style('color', '#fff');
  loginButton.style('border', 'none');
  loginButton.style('border-radius', '20px');
  loginButton.style('cursor', 'pointer');
  loginButton.style('z-index', '9999'); // ✨ 修正點：補上層級防止點擊穿透到 Canvas             
  
  loginButton.mousePressed(handleLogin); 
}

function handleLogin() {
  let userAcc = accountInput.value();
  let userPass = passwordInput.value();

  if (userAcc === "123" && userPass === "123") {
    loginErrorMessage = "";
    accountInput.hide();
    passwordInput.hide();
    loginButton.hide();
    currentScreen = "MENU"; 
  } else {
    loginErrorMessage = "❌ 帳號或密碼錯誤！請輸入數字 123 登入";
  }
}

function clearCanvasLayers() {
  if(scribbleLayer) scribbleLayer.clear();
  if(pencilLayer) pencilLayer.clear();
  if(templateLayer) templateLayer.clear();
}

function checkAllUnlocked() {
  for (let i = 0; i < letters.length; i++) {
    if (!unlockedLevels[letters[i]]) return false;
  }
  return true;
}

function getUnlockedCount() {
  let count = 0;
  for (let i = 0; i < letters.length; i++) {
    if (unlockedLevels[letters[i]]) count++;
  }
  return count;
}

function initLevel(letChar) {
  currentLetter = letChar;
  currentScreen = "GAME_" + letChar;
  clearCanvasLayers();
  isLevelCompleted = false;
  isPencilChecked = false; 
  isWritingCorrect = false;
  currentTool = "PEN"; 
  praiseTimer = 0;
  praiseText = "";
  objectAlpha = 0;
  objectX = width / 4; 
  
  targetPoints = [];
  userCoveredPoints = 0;
  outOfBoundsCount = 0;
  errorFlashFrameStart = 0; 
}

function generateTemplatePoints() {
  templateLayer.clear();
  templateLayer.textAlign(LEFT, BASELINE); 
  templateLayer.textStyle("bold");
  templateLayer.fill(255, 0, 0); 
  templateLayer.noStroke();
  
  let lineYStart = height * 0.42; 
  let targetRedDashY = (lineYStart + 180) - 60; 
  let data = wordData[currentLetter];
  let chars = data.word.toLowerCase().split("");
  
  let tSize = chars.length > 4 ? width * 0.07 : width * 0.085;
  let stepX = chars.length > 4 ? width * 0.075 : width * 0.1; 
  let startX = width / 2 + (width * 0.05); 
  
  templateLayer.textSize(tSize);
  
  for (let i = 0; i < chars.length; i++) {
    templateLayer.text(chars[i], startX + (i * stepX), targetRedDashY);
  }
  
  targetPoints = [];
  templateLayer.loadPixels();
  
  let scanYStart = max(0, int(targetRedDashY - tSize * 1.2));
  let scanYEnd = min(height, int(targetRedDashY + tSize * 0.4));
  let scanXStart = int(startX - 20); 
  
  for (let y = scanYStart; y < scanYEnd; y += 4) {
    for (let x = scanXStart; x < width - 20; x += 4) {
      let idx = (x + y * templateLayer.width) * 4;
      if (templateLayer.pixels[idx] > 200) { 
        targetPoints.push({ x: x, y: y, covered: false });
      }
    }
  }
}

function draw() {
  document.oncontextmenu = function() { return false; };

  if (currentScreen === "LOGIN") {
    drawLoginScreen();
  } else if (currentScreen === "HOME") {
    drawHomeScreen();
  } else if (currentScreen === "MENU") {
    drawMenu();
  } else {
    drawGameScreen();
  }
}

function drawLoginScreen() {
  background(243, 247, 250); 

  for (let fl of floatingLetters) {
    fl.y -= fl.speedY;
    if (fl.y < -60) {
      fl.y = height + 60;
      fl.x = random(width);
    }
    push();
    fill(fl.color);
    noStroke();
    textSize(fl.size);
    textStyle("bold");
    text(fl.char, fl.x, fl.y);
    pop();
  }

  let accY = accountInput ? accountInput.y : height / 2 - 60;
  let passY = passwordInput ? passwordInput.y : height / 2;

  push();
  textSize(min(width * 0.045, 44));
  textStyle("bold");
  fill(90, 105, 120);
  text("English ABC Adventure", width / 2, accY - 100); 
  
  textSize(16);
  textStyle("normal"); 
  fill(130, 140, 150);
  text("請在下方欄位輸入「123」解鎖字母冒險！", width / 2, accY - 50);
  pop();

  push();
  textSize(16);
  textStyle("bold");
  fill(80, 90, 100);
  textAlign(RIGHT, CENTER);
  text("帳號：", width / 2 - 110, accY + 16); 
  text("密碼：", width / 2 - 110, passY + 16); 
  pop();

  if (loginErrorMessage !== "") {
    push();
    textSize(14);
    textStyle("bold");
    fill(235, 75, 75);
    text(loginErrorMessage, width / 2, passY + 80); 
    pop();
  }
}

function drawHomeScreen() {
  background(243, 247, 250); 
  
  for (let fl of floatingLetters) {
    fl.y -= fl.speedY;
    if (fl.y < -60) {
      fl.y = height + 60;
      fl.x = random(width);
    }
    push();
    fill(fl.color);
    noStroke();
    textSize(fl.size);
    textStyle("bold");
    text(fl.char, fl.x, fl.y);
    pop();
  }
  
  push();
  let homeTitleSize = min(width * 0.1, 110);
  textSize(homeTitleSize);
  textStyle("bold");
  
  fill(220, 230, 245); text("A", width/2 - (homeTitleSize * 1.3), height * 0.25 + 5);
  fill(255, 110, 110); text("A", width/2 - (homeTitleSize * 1.3), height * 0.25);
  
  fill(220, 230, 245); text("B", width/2, height * 0.25 + 5);
  fill(255, 215, 80); text("B", width/2, height * 0.25);
  
  fill(220, 230, 245); text("C", width/2 + (homeTitleSize * 1.3), height * 0.25 + 5);
  fill(90, 190, 240); text("C", width/2 + (homeTitleSize * 1.3), height * 0.25);
  pop();

  fill(90, 105, 120);
  textSize(22);
  textStyle("bold");
  text("English ABC Adventure", width / 2, height * 0.38);
  
  let unlockedCount = getUnlockedCount();
  let isAnyUnlocked = unlockedCount > 0;
  
  push();
  translate(width / 2, height * 0.58);
  
  if (isAnyUnlocked) {
    let glowSize = map(unlockedCount, 0, 26, 120, 240);
    let pulse = sin(frameCount * 0.05) * 10;
    noStroke();
    fill(255, 235, 130, 40 + pulse);
    ellipse(0, -30, glowSize + 30);
  }
  
  if (isAnyUnlocked) {
    fill(255, 240, 150); stroke(245, 180, 40);
  } else {
    fill(235, 238, 242); stroke(170, 180, 190);
  }
  strokeWeight(5);
  ellipse(0, -30, 110, 110);
  
  rectMode(CENTER);
  fill(180, 185, 195); stroke(130, 135, 145); strokeWeight(3);
  rect(0, 30, 42, 14, 4);
  rect(0, 43, 28, 10, 3);
  pop();
  
  fill(100, 115, 130);
  textSize(16);
  textStyle("normal");
  text("精通進度：已點亮 " + unlockedCount + " 個關卡小燈泡", width / 2, height * 0.72);
  
  rectMode(CENTER);
  fill(220, 225, 232);
  noStroke();
  rect(width / 2, height * 0.76, 300, 14, 7);
  if (unlockedCount > 0) {
    rectMode(CORNER);
    fill(75, 200, 115);
    let progressWidth = map(unlockedCount, 0, 26, 0, 300);
    rect(width / 2 - 150, (height * 0.76) - 7, progressWidth, 14, 7);
  }
  
  push();
  rectMode(CENTER);
  fill(255, 95, 100);
  noStroke();
  rect(width / 2, height * 0.86, 220, 54, 27);
  
  fill(255);
  textSize(22);
  textStyle("bold");
  text("START  🚀", width / 2, height * 0.86);
  pop();
}

function drawMenu() {
  let isAllClear = checkAllUnlocked();

  if (isAllClear) {
    background(20, 25, 40);
    fill(255, 255, 255, 150);
    for(let i=0; i<30; i++) {
      let sx = noise(i * 10) * width;
      let sy = noise(i * 20) * (height - 200);
      ellipse(sx, sy, random(2, 4));
    }
    if (random(1) < 0.06) {
      fireworks.push(new Firework(random(width), height, random(width), random(100, 300)));
    }
    for (let i = fireworks.length - 1; i >= 0; i--) {
      fireworks[i].update(); fireworks[i].show();
      if (fireworks[i].done()) fireworks.splice(i, 1);
    }
  } else {
    background(248, 246, 240);
  }
  
  fill(isAllClear ? 255 : 60);
  noStroke(); textAlign(CENTER, CENTER);
  if (isAllClear) {
    textSize(28); textStyle("bold"); text("🎉 AMAZING! YOU DID IT! 🎆", width / 2, 50);
  } else {
    textSize(26); textStyle("bold"); text("✏️ 冒險地圖：字母小燈泡 💡", width / 2, 45);
    textSize(14); textStyle("normal"); fill(120);
    text("⌨️ 請敲擊外接鍵盤 [ A - Z ] 或直接點選地圖上的小燈泡進入挑戰關卡！", width / 2, 80);
  }
  
  push();
  rectMode(CENTER);
  fill(255); stroke(210); strokeWeight(1.5);
  rect(100, 50, 130, 40, 10);
  fill(70); noStroke(); textSize(14); textStyle("bold");
  text("🏠 回主畫面", 100, 50);
  pop();
  
  for (let i = 0; i < levelPositions.length; i++) {
    let pos = levelPositions[i];
    drawCrayonBulb(pos.x, pos.y, pos.letter, unlockedLevels[pos.letter]);
  }

  if (isAllClear) {
    rectMode(CENTER); fill(255, 70, 70); noStroke(); rect(width - 100, 50, 120, 40, 10);
    fill(255); textSize(14); textStyle("bold"); text("重玩 🔄", width - 100, 50);
  }
}

function drawCrayonBulb(x, y, letter, isUnlocked) {
  push(); translate(x, y);
  let bSize = min(width * 0.042, 42); 
  if (isUnlocked) fill(255, 230, 100); 
  else noFill();            
  stroke(isUnlocked ? [235, 160, 0] : [130, 130, 130]); 
  strokeWeight(3);
  ellipse(0, -5, bSize, bSize); 
  rectMode(CENTER); 
  fill(isUnlocked ? 240 : 140); stroke(100); strokeWeight(1.5);
  rect(0, bSize/2, 18, 8, 2); 
  fill(isUnlocked ? [200, 80, 0] : [110]); noStroke(); 
  textSize(bSize * 0.48); textStyle("bold");
  text(letter, 0, -5);
  pop();
}

function drawGameScreen() {
  rectMode(CORNER); noStroke();
  
  fill(30, 35, 45); rect(0, 80, width / 2, height - 80); 
  fill(255); rect(width / 2, 80, width / 2, height - 80); 
  
  stroke(210, 225, 240); strokeWeight(2);
  let lineYStart = height * 0.42; 
  
  for(let i = 0; i < 2; i++) {
    let y = lineYStart + (i * 180);
    line(width / 2 + 30, y, width - 30, y); 
    stroke(240, 180, 180, 130); strokeWeight(1.5);
    push(); drawingContext.setLineDash([6, 6]);
    line(width / 2 + 30, y - 60, width - 30, y - 60);  
    line(width / 2 + 30, y - 120, width - 30, y - 120); 
    pop(); stroke(210, 225, 240); strokeWeight(2);
  }

  if (!isLevelCompleted) {
    push(); fill(255, 255, 255, 8); noStroke(); 
    textSize(min(width * 0.28, height * 0.5)); textStyle("bold");
    text(currentLetter, width / 4, height / 2 + 40); pop();
  }

  push();
  noStroke(); textStyle("bold"); 
  
  if (isPencilChecked && !isWritingCorrect) {
    let elapsedFrames = frameCount - errorFlashFrameStart;
    if (elapsedFrames < 80 && Math.floor(elapsedFrames / 20) % 2 === 0) {
      stroke(235, 75, 75, 220); strokeWeight(5);
    } else {
      stroke(235, 75, 75, 60); strokeWeight(3);
    }
  } else {
    fill(225, 228, 232); 
  }
  
  textAlign(LEFT, BASELINE); 

  let firstRedDashY = lineYStart - 60;
  let mainLetterSize = min(width * 0.12, 130);
  
  if (!isLevelCompleted) {
    textSize(mainLetterSize); text(currentLetter, width / 2 + (width * 0.05), firstRedDashY);
    textSize(mainLetterSize * 0.76); text(currentLetter.toLowerCase(), width / 2 + (width * 0.05) + (mainLetterSize * 1.2), firstRedDashY);
  } else {
    let secondRedDashY = (lineYStart + 180) - 60; 
    let data = wordData[currentLetter];
    let chars = data.word.toLowerCase().split("");
    let tSize = chars.length > 4 ? width * 0.07 : width * 0.085;
    let stepX = chars.length > 4 ? width * 0.075 : width * 0.1; 
    let startX = width / 2 + (width * 0.05); 
    
    textSize(tSize); 
    for (let i = 0; i < chars.length; i++) {
      text(chars[i], startX + (i * stepX), secondRedDashY);
    }
  }
  pop();

  if (mouseIsPressed) {
    if (mouseX < width - 150 || mouseY > 230) {
      if (mouseX > 0 && mouseX < width / 2 && mouseY > 80 && mouseY < height) {
        if (!isLevelCompleted) {
          if (currentTool === "PEN") {
            scribbleLayer.stroke(255, 215, 0, 220); 
            for (let i = 0; i < 5; i++) {
              let offsetX = random(-2, 2); let offsetY = random(-2, 2);
              scribbleLayer.strokeWeight(random(1.5, 3.5));
              scribbleLayer.line(pmouseX + offsetX, pmouseY + offsetY, mouseX + offsetX, mouseY + offsetY);
            }
          } else if (currentTool === "ERASER") {
            scribbleLayer.push(); scribbleLayer.drawingContext.globalCompositeOperation = 'destination-out';
            scribbleLayer.stroke(255); scribbleLayer.strokeWeight(40);
            scribbleLayer.line(pmouseX, pmouseY, mouseX, mouseY); scribbleLayer.pop();
          }
        }
      }
      
      if (mouseX > width / 2 && mouseX < width && mouseY > 80 && mouseY < height) {
        if (currentTool === "PEN") {
          pencilLayer.stroke(50, 60, 70, 240); pencilLayer.strokeWeight(5); 
          pencilLayer.line(pmouseX, pmouseY, mouseX, mouseY);
          
          if (isLevelCompleted && targetPoints.length > 0) {
            let hitTarget = false;
            for (let p of targetPoints) {
              if (!p.covered) {
                let d = dist(mouseX, mouseY, p.x, p.y);
                if (d < 22) { p.covered = true; userCoveredPoints++; hitTarget = true; }
              } else { if (dist(mouseX, mouseY, p.x, p.y) < 22) hitTarget = true; }
            }
            let secondRedDashY = (lineYStart + 180) - 60;
            if (!hitTarget && mouseY > (secondRedDashY - 100) && mouseY < (secondRedDashY + 40)) outOfBoundsCount++;
          }
        } else if (currentTool === "ERASER") {
          pencilLayer.push(); pencilLayer.drawingContext.globalCompositeOperation = 'destination-out';
          pencilLayer.stroke(255); pencilLayer.strokeWeight(40);
          pencilLayer.line(pmouseX, pmouseY, mouseX, mouseY); pencilLayer.pop();
          
          if (isLevelCompleted) {
            userCoveredPoints = 0; outOfBoundsCount = 0;
            for (let p of targetPoints) p.covered = false;
          }
        }
      }
    }
  }

  image(scribbleLayer, 0, 0);
  image(pencilLayer, 0, 0);

  if (isLevelCompleted) {
    if (objectAlpha < 255) objectAlpha += 8;
    let targetX = width / 4;
    objectX = lerp(objectX, targetX, 0.1); 
    
    push(); rectMode(CENTER); fill(255, 255, 255, objectAlpha * 0.92); noStroke();
    let cardW = min(width * 0.33, 340);
    let cardH = min(height * 0.55, 380);
    rect(objectX, height / 2 + 20, cardW, cardH, 20);
    
    translate(objectX, height / 2 - 40);
    let currentData = wordData[currentLetter];
    if (currentData && currentData.draw) currentData.draw(objectAlpha);
    
    noStroke(); fill(40, 45, 55, objectAlpha); textSize(36); textStyle(BOLD);
    text(currentData.word, 0, cardH * 0.28);
    fill(235, 75, 75, objectAlpha); textSize(26); 
    text(currentData.ch, 0, cardH * 0.4);
    fill(120, 130, 140, objectAlpha); textSize(16); textStyle(NORMAL);
    text(currentData.spell, 0, cardH * 0.5);
    pop();
  }
  
  if (isPencilChecked && praiseTimer > 0) {
    praiseTimer--;
    push(); noStroke(); textAlign(CENTER, CENTER);
    if (isWritingCorrect) {
      fill(40, 180, 100, map(praiseTimer, 0, 30, 0, 255)); textSize(38); textStyle("bold");
      text(praiseText, width * 0.75, height / 2);
    } else {
      fill(235, 75, 75, map(praiseTimer, 0, 30, 0, 255)); textSize(30); textStyle("bold");
      text(praiseText, width * 0.75, height / 2 - 20);
      textSize(15); textStyle("normal"); fill(100, map(praiseTimer, 0, 30, 0, 255));
      text("💡 提示：請順著字母灰色軌跡填滿，不要塗鴉喔！", width * 0.75, height / 2 + 25);
    }
    pop();
  }

  push();
  rectMode(CENTER);
  if (currentTool === "PEN") {
    fill(90, 160, 235); stroke(50, 110, 180); strokeWeight(3);
  } else {
    fill(255); stroke(220); strokeWeight(1.5);
  }
  rect(width - 80, 125, 130, 44, 12);
  fill(currentTool === "PEN" ? 255 : 60); noStroke(); textSize(15); textStyle("bold");
  text("✏️ 畫筆模式", width - 80, 125);
  
  if (currentTool === "ERASER") {
    fill(240, 110, 110); stroke(180, 60, 60); strokeWeight(3);
  } else {
    fill(255); stroke(220); strokeWeight(1.5);
  }
  rect(width - 80, 180, 130, 44, 12);
  fill(currentTool === "ERASER" ? 255 : 60); noStroke(); textSize(15); textStyle("bold");
  text("🧽 橡皮擦", width - 80, 180);
  pop();

  push(); noStroke(); fill(242, 240, 234); rect(0, 0, width, 80);
  fill(70); textAlign(LEFT, CENTER); textSize(18); textStyle("bold"); text("🎨 Level " + currentLetter, 40, 40);
  
  textAlign(CENTER, CENTER);
  if (!isLevelCompleted) {
    fill(210, 80, 80); textSize(14);
    text("左區摸黑塗鴉 ｜ 右區用 Pencil 練習 💡 寫完請按實體鍵盤 [ " + currentLetter + " ] 鍵喚醒！", width / 2, 40);
  } else {
    if (unlockedLevels[currentLetter]) {
      fill(40, 150, 85); textSize(14); text("🎉 太棒了！關卡挑戰成功！", width / 2, 40);
    } else {
      fill(225, 140, 20); textSize(14); text("👉 請拿 Apple Pencil 精準描寫右側的完整單字軌跡", width / 2, 40);
    }
  }
  
  rectMode(CENTER); fill(255); stroke(200); strokeWeight(2); 
  rect(width - 100, 40, 140, 44, 12); 
  fill(50); noStroke(); textSize(15); textStyle("bold"); text("返回地圖 🗺️", width - 100, 40);

  if (isLevelCompleted) {
    fill(255, 235, 50); stroke(220, 180, 0); strokeWeight(2);
    rect(width - 260, 40, 140, 44, 12);
    fill(50); noStroke(); textSize(15); textStyle("bold"); text("檢查寫字 🔍", width - 260, 40);
  }
  pop();
}

function mousePressed() {
  if (currentScreen === "LOGIN") return;

  if (currentScreen === "HOME") {
    if (mouseX > width / 2 - 110 && mouseX < width / 2 + 110 &&
        mouseY > height * 0.86 - 27 && mouseY < height * 0.86 + 27) {
      currentScreen = "MENU";
    }
    return;
  }

  if (currentScreen === "MENU") {
    if (mouseX > 35 && mouseX < 165 && mouseY > 30 && mouseY < 70) {
      currentScreen = "HOME"; return;
    }
    if (checkAllUnlocked() && mouseX > width - 160 && mouseX < width - 40 && mouseY > 30 && mouseY < 70) {
      for (let i = 0; i < letters.length; i++) unlockedLevels[letters[i]] = false;
      fireworks = []; return;
    }
    for (let pos of levelPositions) {
      if (dist(mouseX, mouseY, pos.x, pos.y) < 25) {
        initLevel(pos.letter); return;
      }
    }
  }
  
  if (currentScreen !== "MENU" && currentScreen !== "LOGIN" && currentScreen !== "HOME") {
    if (mouseX > width - 170 && mouseX < width - 30 && mouseY > 18 && mouseY < 62) {
      currentScreen = "MENU"; return;
    }
    if (isLevelCompleted && mouseX > width - 330 && mouseX < width - 190 && mouseY > 18 && mouseY < 62) {
      isPencilChecked = true; praiseTimer = 180; 
      let totalTarget = targetPoints.length;
      let coverPercent = totalTarget > 0 ? (userCoveredPoints / totalTarget) : 0;
      if (coverPercent >= 0.62 && outOfBoundsCount < totalTarget * 0.8) {
        isWritingCorrect = true; unlockedLevels[currentLetter] = true; 
        praiseText = "答對了！🎉 GOOD JOB!"; playCorrectSound(); 
      } else {
        isWritingCorrect = false; praiseText = "❌ 軌跡有些偏移，擦掉再試一次！";
        errorFlashFrameStart = frameCount; playErrorSound();
      }
      return;
    }
    if (mouseX > width - 145 && mouseX < width - 15 && mouseY > 103 && mouseY < 147) { currentTool = "PEN"; return; }
    if (mouseX > width - 145 && mouseX < width - 15 && mouseY > 158 && mouseY < 202) { currentTool = "ERASER"; return; }
  }
}

function touchStarted() {
  if (currentScreen === "LOGIN") {
    if (mouseX > width / 2 - 100 && mouseX < width / 2 + 100) {
      if ((mouseY > height / 2 - 60 && mouseY < height / 2 - 28) || (mouseY > height / 2 && mouseY < height / 2 + 32)) {
        return true; 
      }
    }
    if (mouseX > width / 2 - 60 && mouseX < width / 2 + 60 && mouseY > height / 2 + 60 && mouseY < height / 2 + 100) {
      handleLogin(); return true; 
    }
  }
  
  let clickButton = false;
  if (currentScreen === "HOME") {
    if (mouseX > width / 2 - 110 && mouseX < width / 2 + 110 && mouseY > height * 0.86 - 27 && mouseY < height * 0.86 + 27) clickButton = true;
  } else if (currentScreen === "MENU") {
    if (mouseX > 35 && mouseX < 165 && mouseY > 30 && mouseY < 70) clickButton = true;
    if (mouseX > width - 160 && mouseX < width - 40 && mouseY > 30 && mouseY < 70) clickButton = true;
    for (let pos of levelPositions) {
      if (dist(mouseX, mouseY, pos.x, pos.y) < 25) clickButton = true;
    }
  } else {
    if (mouseX > width - 170 && mouseX < width - 30 && mouseY > 18 && mouseY < 62) clickButton = true;
    if (isLevelCompleted && mouseX > width - 330 && mouseX < width - 190 && mouseY > 18 && mouseY < 62) clickButton = true;
    if (mouseX > width - 145 && mouseX < width - 15 && mouseY > 103 && mouseY < 147) clickButton = true;
    if (mouseX > width - 145 && mouseX < width - 15 && mouseY > 158 && mouseY < 202) clickButton = true;
  }
  
  if (clickButton) { mousePressed(); return true; }
  return false;
}

function touchMoved() { return false; }

function keyPressed() {
  let keyUpper = key.toUpperCase(); 
  if (KEY_MAP[keyUpper]) keyUpper = KEY_MAP[keyUpper]; 
  if (currentScreen === "MENU" && letters.includes(keyUpper)) initLevel(keyUpper);
  if (currentScreen === "GAME_" + currentLetter && keyUpper === currentLetter && !isLevelCompleted) {
    isLevelCompleted = true; generateTemplatePoints(); speakWord(currentLetter); 
  }
  if (keyCode === ESCAPE) currentScreen = "MENU";
}

function playCorrectSound() {
  let ctx = new (window.AudioContext || window.webkitAudioContext)();
  let osc1 = ctx.createOscillator(); let gain1 = ctx.createGain();
  osc1.type = 'sine'; osc1.frequency.setValueAtTime(523.25, ctx.currentTime); gain1.gain.setValueAtTime(0.3, ctx.currentTime);
  gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15); osc1.connect(gain1); gain1.connect(ctx.destination); osc1.start(); osc1.stop(ctx.currentTime + 0.15);
  let osc2 = ctx.createOscillator(); let gain2 = ctx.createGain();
  osc2.type = 'sine'; osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.08);
  gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3); osc2.connect(gain2); gain2.connect(ctx.destination); osc2.start(ctx.currentTime + 0.08); osc2.stop(ctx.currentTime + 0.3);
}

function playErrorSound() {
  let ctx = new (window.AudioContext || window.webkitAudioContext)();
  let osc = ctx.createOscillator(); let gain = ctx.createGain();
  osc.type = 'sawtooth'; osc.frequency.setValueAtTime(180, ctx.currentTime); gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.25); osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.25);
}

function speakWord(letter) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel(); let data = wordData[letter];
    let utteranceEng = new SpeechSynthesisUtterance(data.word + ". " + data.spell.replace(/-/g, "") + ".");
    utteranceEng.lang = 'en-US'; utteranceEng.pitch = 1.35; utteranceEng.rate = 0.8;
    let utteranceCh = new SpeechSynthesisUtterance(data.ch); utteranceCh.lang = 'zh-TW'; utteranceCh.pitch = 1.2; utteranceCh.rate = 0.9;
    window.speechSynthesis.speak(utteranceEng); window.speechSynthesis.speak(utteranceCh);
  }
}

class Firework {
  constructor(x, y, targetX, targetY) {
    this.x = x; this.y = y; this.targetY = targetY; this.exploded = false; this.particles = []; this.speed = random(6, 10);
    this.col = color(random(150, 255), random(150, 255), random(150, 255));
  }
  update() {
    if (!this.exploded) { this.y -= this.speed; if (this.y <= this.targetY) { this.exploded = true; this.explode(); } } 
    else { for (let i = this.particles.length - 1; i >= 0; i--) { this.particles[i].update(); if (this.particles[i].alpha <= 0) this.particles.splice(i, 1); } }
  }
  explode() { let count = random(30, 50); for (let i = 0; i < count; i++) { let angle = random(TWO_PI); let speed = random(1, 5); this.particles.push(new Particle(this.x, this.y, angle, speed, this.col)); } }
  show() { if (!this.exploded) { stroke(this.col); strokeWeight(random(3, 5)); line(this.x, this.y, this.x, this.y + 10); } else { for (let p of this.particles) p.show(); } }
  done() { return this.exploded && this.particles.length === 0; }
}

class Particle {
  constructor(x, y, angle, speed, col) { this.x = x; this.y = y; this.vx = cos(angle) * speed; this.vy = sin(angle) * speed; this.col = col; this.alpha = 255; this.gravity = 0.08; this.w = random(2, 5); }
  update() { this.x += this.vx; this.y += this.vy; this.vy += this.gravity; this.alpha -= 4; }
  show() { push(); noStroke(); fill(red(this.col), green(this.col), blue(this.col), this.alpha); ellipse(this.x, this.y, this.w); pop(); }
}

function drawAnt(a) { fill(80, a); noStroke(); ellipse(-25, 0, 35, 35); ellipse(0, -5, 30, 30); ellipse(25, -10, 45, 40); stroke(80, a); strokeWeight(3); line(-10, 5, -15, 25); line(5, 5, 10, 25); }
function drawBus(a) { fill(245, 200, 50, a); noStroke(); rect(-80, -35, 160, 75, 8); fill(50, a); ellipse(-40, 40, 26, 26); ellipse(40, 40, 26, 26); fill(200, 230, 255, a); rect(25, -20, 30, 22, 3); rect(-55, -20, 30, 22, 3); rect(-15, -20, 30, 22, 3); }
function drawCat(a) { fill(200, a); noStroke(); ellipse(0, 10, 110, 95); triangle(-40, -45, -15, -10, -45, 10); triangle(40, -45, 15, -10, 45, 10); fill(50, a); ellipse(-18, 0, 10, 10); ellipse(18, 0, 10, 10); fill(240, 130, 130, a); triangle(0, 12, -6, 6, 6, 6); }
function drawDog(a) { fill(160, 110, 70, a); noStroke(); ellipse(0, 0, 110, 110); fill(100, 70, 40, a); ellipse(-50, 0, 35, 70); ellipse(50, 0, 35, 70); fill(0, a); ellipse(-18, -10, 12, 12); ellipse(18, -10, 12, 12); ellipse(0, 12, 22, 14); }
function drawEgg(a) { fill(245, 235, 220, a); stroke(220, 200, 180, a); strokeWeight(2); ellipse(0, 0, 100, 135); }
function drawFox(a) { noStroke(); fill(235, 110, 40, a); triangle(-40, -50, -12, -18, -45, -8); triangle(40, -50, 12, -18, 45, -8); triangle(-50, -8, 50, -8, 0, 40); ellipse(0, -12, 100, 80); fill(0, a); ellipse(-20, -12, 10, 10); ellipse(20, -12, 10, 10); ellipse(0, 38, 14, 14); }
function drawGum(a) { fill(240, 120, 160, a); noStroke(); ellipse(0, 0, 90, 90); quad(-60, -18, -45, 0, -60, 18, -70, 0); quad(60, -18, 45, 0, 60, 18, 70, 0); }
function drawHat(a) { push(); rectMode(CENTER); noStroke(); fill(65, 105, 225, a); rect(0, -15, 100, 70, 10, 10, 0, 0); fill(235, 75, 75, a); rect(0, 12, 102, 14); fill(50, 85, 200, a); ellipse(0, 20, 150, 25); pop(); }
function drawIce(a) { push(); rectMode(CENTER); noStroke(); fill(180, 225, 255, a); rect(0, 0, 100, 100, 20); fill(255, 255, 255, a * 0.4); quad(-35, -35, 12, -35, -8, -8, -35, -8); pop(); }

// 💡 提醒：記得在下方補齊你的其餘繪圖函式，如 drawJam, drawSun, drawBoxObj 等
function drawJam(a) { push(); rectMode(CENTER); noStroke(); fill(210, 45, 80, a); rect(0, 12, 80, 90, 15); fill(180, 185, 190, a); rect(0, -35, 90, 18, 5); fill(245, 240, 220, a); rect(0, 0, 50, 40, 4); pop(); }
function drawKey(a) { fill(200, a); ellipse(-30, 0, 40, 40); fill(243, 247, 250); ellipse(-30, 0, 16, 16); fill(200, a); rect(-10, -6, 60, 12); rect(25, 6, 10, 15); rect(40, 6, 10, 15); }
function drawLog(a) { fill(139, 69, 19, a); ellipse(40, 0, 20, 50); rect(-40, -25, 80, 50); fill(222, 184, 135, a); ellipse(-40, 0, 20, 50); }
function drawMud(a) { fill(101, 67, 33, a); beginShape(); vertex(-50, 20); bezierVertex(-30, -10, 30, -20, 50, 20); endShape(CLOSE); }
function drawNut(a) { fill(210, 105, 30, a); ellipse(0, 0, 60, 80); fill(139, 69, 19, a); arc(0, -10, 62, 60, PI, TWO_PI, CHORD); }
function drawOwl(a) { fill(128, 0, 128, a); ellipse(0, 10, 90, 100); fill(255, a); ellipse(-20, -10, 30, 30); ellipse(20, -10, 30, 30); fill(0, a); ellipse(-20, -10, 10, 10); ellipse(20, -10, 10, 10); fill(255, 165, 0, a); triangle(0, 5, -8, -5, 8, -5); }
function drawPig(a) { fill(255, 192, 203, a); ellipse(0, 0, 110, 90); fill(255, 105, 180, a); ellipse(0, 10, 35, 25); fill(0, a); ellipse(-8, 10, 6, 6); ellipse(8, 10, 6, 6); ellipse(-25, -15, 10, 10); ellipse(25, -15, 10, 10); }
function drawQueen(a) { fill(255, 215, 0, a); triangle(-40, -20, -40, -50, -20, -30); triangle(-20, -30, 0, -60, 20, -30); triangle(20, -30, 40, -50, 40, -20); fill(147, 112, 219, a); rect(-40, -20, 80, 60, 5); }
function drawRed(a) { fill(255, 0, 0, a); rect(-50, -50, 100, 100, 10); }
function drawSun(a) { fill(255, 69, 0, a); ellipse(0, 0, 80, 80); fill(255, 140, 0, a); for(let i=0; i<8; i++) { push(); rotate(QUARTER_PI * i); triangle(-10, -45, 10, -45, 0, -65); pop(); } }
function drawToy(a) { fill(0, 128, 128, a); rect(-35, -35, 70, 70, 5); fill(255, 99, 71, a); ellipse(0, 0, 40, 40); }
function drawUFO(a) { fill(192, a); ellipse(0, 0, 120, 40); fill(0, 191, 255, a*0.5); arc(0, -10, 60, 50, PI, TWO_PI, CHORD); fill(255, 255, 0, a); ellipse(-30, 5, 10, 10); ellipse(0, 5, 10, 10); ellipse(30, 5, 10, 10); }
function drawVan(a) { fill(70, 130, 180, a); rect(-70, -30, 140, 60, 5); fill(243, 247, 250); rect(30, -20, 35, 25); fill(50, a); ellipse(-40, 30, 24, 24); ellipse(40, 30, 24, 24); }
function drawWeb(a) { stroke(120, a); strokeWeight(2); noFill(); for(let i=1; i<=4; i++) ellipse(0, 0, i*30, i*30); for(let i=0; i<8; i++) { push(); rotate(QUARTER_PI * i); line(0, 0, 0, 65); pop(); } }
function drawBoxObj(a) { fill(210, 180, 140, a); rect(-50, -40, 100, 80); line(-50, -40, 0, -10); line(50, -40, 0, -10); line(0, -10, 0, 40); }
function drawYoyo(a) { fill(34, 139, 34, a); ellipse(-10, 0, 25, 70); ellipse(10, 0, 25, 70); fill(255, 215, 0, a); ellipse(0, 0, 15, 50); }
function drawZoo(a) { fill(100, a); rect(-60, -40, 120, 80, 5); stroke(255, a); strokeWeight(3); for(let x = -40; x <= 40; x += 20) line(x, -40, x, 40); }

let currentScreen = "LOGIN"; 
let accountInput, passwordInput, loginButton; 
let loginErrorMessage = ""; 

let currentLetter = "";     
let letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
let levelPositions = [];    

let unlockedLevels = {}; 

let isLevelCompleted = false;
let objectX; 
let objectAlpha = 0; 

let isPencilChecked = false;
let praiseTimer = 0;
let praiseText = ""; 
let isWritingCorrect = false; 

let fireworks = [];
let floatingLetters = [];
let currentTool = "PEN"; 

let scribbleLayer; 
let pencilLayer;   
let templateLayer; 

let targetPoints = []; 
let userCoveredPoints = 0; 
let outOfBoundsCount = 0; 
let errorFlashFrameStart = 0; 

const wordData = {
  'A': { word: "Ant", ch: "螞蟻", spell: "a - n - t", draw: drawAnt },
  'B': { word: "Bus", ch: "公車", spell: "b - u - s", draw: drawBus },
  'C': { word: "Cat", ch: "貓咪", spell: "c - a - t", draw: drawCat },
  'D': { word: "Dog", ch: "狗狗", spell: "d - o - g", draw: drawDog },
  'E': { word: "Egg", ch: "雞蛋", spell: "e - g - g", draw: drawEgg },
  'F': { word: "Fox", ch: "狐狸", spell: "f - o - x", draw: drawFox },
  'G': { word: "Gum", ch: "糖果", spell: "g - u - m", draw: drawGum },
  'H': { word: "Hat", ch: "帽子", spell: "h - a - t", draw: drawHat },
  'I': { word: "Ice", ch: "冰塊", spell: "i - c - e", draw: drawIce }, 
  'J': { word: "Jam", ch: "果醬", spell: "j - a - m", draw: drawJam },
  'K': { word: "Key", ch: "鑰匙", spell: "k - e - y", draw: drawKey },
  'L': { word: "Log", ch: "木頭", spell: "l - o - g", draw: drawLog },
  'M': { word: "Mud", ch: "泥巴", spell: "m - u - d", draw: drawMud },
  'N': { word: "Nut", ch: "堅果", spell: "n - u - t", draw: drawNut },
  'O': { word: "Owl", ch: "貓頭鷹", spell: "o - w - l", draw: drawOwl },
  'P': { word: "Pig", ch: "小豬", spell: "p - i - g", draw: drawPig },
  'Q': { word: "Queen", ch: "女王", spell: "q - u - e - e - n", draw: drawQueen },
  'R': { word: "Red", ch: "紅色", spell: "r - e - d", draw: drawRed },
  'S': { word: "Sun", ch: "太陽", spell: "s - u - n", draw: drawSun }, // ✨ 修正點：stroke 改回 ch
  'T': { word: "Toy", ch: "玩具", spell: "t - o - y", draw: drawToy },
  'U': { word: "UFO", ch: "飛碟", spell: "u - f - o", draw: drawUFO },
  'V': { word: "Van", ch: "貨車", spell: "v - a - n", draw: drawVan },
  'W': { word: "Web", ch: "蜘蛛網", spell: "w - e - b", draw: drawWeb },
  'X': { word: "Box", ch: "盒子", spell: "b - o - x", draw: drawBoxObj },
  'Y': { word: "Yo-yo", ch: "溜溜球", spell: "y - o - y - o", draw: drawYoyo },
  'Z': { word: "Zoo", ch: "動物園", spell: "z - o - o", draw: drawZoo }
};

const KEY_MAP = {
  'Q': 'A', 'W': 'B', 'E': 'C', 'R': 'D', 'T': 'E', 'Y': 'F', 'U': 'G', 'I': 'H', 'O': 'I', 'P': 'J',
  'A': 'K', 'S': 'L', 'D': 'M', 'F': 'N', 'G': 'O', 'H': 'P', 'J': 'Q', 'K': 'R', 'L': 'S',
  'Z': 'T', 'X': 'U', 'C': 'V', 'V': 'W', 'B': 'X', 'N': 'Y', 'M': 'Z'
};

function setup() {
  pixelDensity(1); // ✨ 修正點：強制鎖定像素比，避免 iPad/Retina 高解析度螢幕導致寫字偵測失靈
  
  // 用程式碼直接在網頁上建立一個專屬盒子
  let holder = createElement('div');
  holder.id("game-container");
  holder.style('position', 'relative');
  holder.style('width', '100vw');
  holder.style('height', '100vh');
  holder.style('overflow', 'hidden');
  
  // 建立畫布並移入剛剛變出來的盒子裡
  let cnv = createCanvas(windowWidth, windowHeight);
  cnv.parent("game-container"); 
  cnv.style('position', 'absolute'); // ✨ 修正點：讓畫布絕對定位
  cnv.style('top', '0');
  cnv.style('left', '0');
  cnv.style('z-index', '1');         // ✨ 修正點：將畫布移至底層，防止擋住 HTML 輸入框與按鈕
  
  textAlign(CENTER, CENTER);
  
  createLoginUI();
  recalculateLayout();

  for (let i = 0; i < letters.length; i++) {
    unlockedLevels[letters[i]] = false; 
  }

  // 阻止整個網頁被手指拉動或放大縮小
  document.body.addEventListener('touchmove', function(e) {
    e.preventDefault();
  }, { passive: false });
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  recalculateLayout();
}

// 當螢幕長寬改變時，重新動態計算畫面比例位置
function recalculateLayout() {
  scribbleLayer = createGraphics(width, height);
  pencilLayer = createGraphics(width, height);
  templateLayer = createGraphics(width, height);
  clearCanvasLayers();

  if (accountInput) accountInput.position(width / 2 - 100, height / 2 - 60);
  if (passwordInput) passwordInput.position(width / 2 - 100, height / 2);
  if (loginButton) loginButton.position(width / 2 - 60, height / 2 + 60);

  // 重新生成隨機漂浮背景字母
  floatingLetters = [];
  let tempLetters = ["A", "B", "C"];
  for (let i = 0; i < 15; i++) {
    floatingLetters.push({
      x: random(width),
      y: random(height),
      size: random(width * 0.04, width * 0.07),
      char: random(tempLetters),
      speedY: random(0.5, 1.5),
      color: color(random(100, 230), random(120, 230), random(200, 255), 70)
    });
  }

  // 依據目前平板長寬，動態重新排列 26 關卡的小燈泡（保持完美等距網格）
  levelPositions = [];
  let cols = 7;
  let rows = 4;
  let hSpacing = width / (cols + 1);
  let vSpacing = (height - 140) / (rows + 1);
  
  for (let i = 0; i < 26; i++) {
    let col = i % cols; 
    let gridRow = Math.floor(i / cols); 
    let x = hSpacing * (col + 1); 
    let y = 140 + vSpacing * (gridRow + 1); // 💡 微調 y 軸起始高度，完美避開最上排標題
    levelPositions.push({ x: x, y: y, letter: letters[i] });
  }
}

function createLoginUI() {
  accountInput = createInput('');
  accountInput.parent("game-container");          
  accountInput.style('position', 'absolute');      
  accountInput.size(200, 32);
  accountInput.style('font-size', '16px');
  accountInput.style('border-radius', '8px');
  accountInput.style('border', '1px solid #ccc');
  accountInput.style('padding', '0 8px');
  accountInput.style('z-index', '9999'); // ✨ 修正點：提高層級           
  accountInput.attribute('placeholder', '請輸入數字 123');

  passwordInput = createInput('', 'password');
  passwordInput.parent("game-container");         
  passwordInput.style('position', 'absolute');     
  passwordInput.size(200, 32);
  passwordInput.style('font-size', '16px');
  passwordInput.style('border-radius', '8px');
  passwordInput.style('border', '1px solid #ccc');
  passwordInput.style('padding', '0 8px');
  passwordInput.style('z-index', '9999'); // ✨ 修正點：提高層級          
  passwordInput.attribute('placeholder', '請輸入數字 123');

  loginButton = createButton('登入 🔐');
  loginButton.parent("game-container");            
  loginButton.style('position', 'absolute');        
  loginButton.size(120, 40);
  loginButton.style('font-size', '16px');
  loginButton.style('font-weight', 'bold');
  loginButton.style('background-color', '#4b96eb');
  loginButton.style('color', '#fff');
  loginButton.style('border', 'none');
  loginButton.style('border-radius', '20px');
  loginButton.style('cursor', 'pointer');
  loginButton.style('z-index', '9999'); // ✨ 修正點：補上層級防止點擊穿透到 Canvas             
  
  loginButton.mousePressed(handleLogin); 
}

function handleLogin() {
  let userAcc = accountInput.value();
  let userPass = passwordInput.value();

  if (userAcc === "123" && userPass === "123") {
    loginErrorMessage = "";
    accountInput.hide();
    passwordInput.hide();
    loginButton.hide();
    currentScreen = "MENU"; 
  } else {
    loginErrorMessage = "❌ 帳號或密碼錯誤！請輸入數字 123 登入";
  }
}

function clearCanvasLayers() {
  if(scribbleLayer) scribbleLayer.clear();
  if(pencilLayer) pencilLayer.clear();
  if(templateLayer) templateLayer.clear();
}

function checkAllUnlocked() {
  for (let i = 0; i < letters.length; i++) {
    if (!unlockedLevels[letters[i]]) return false;
  }
  return true;
}

function getUnlockedCount() {
  let count = 0;
  for (let i = 0; i < letters.length; i++) {
    if (unlockedLevels[letters[i]]) count++;
  }
  return count;
}

function initLevel(letChar) {
  currentLetter = letChar;
  currentScreen = "GAME_" + letChar;
  clearCanvasLayers();
  isLevelCompleted = false;
  isPencilChecked = false; 
  isWritingCorrect = false;
  currentTool = "PEN"; 
  praiseTimer = 0;
  praiseText = "";
  objectAlpha = 0;
  objectX = width / 4; 
  
  targetPoints = [];
  userCoveredPoints = 0;
  outOfBoundsCount = 0;
  errorFlashFrameStart = 0; 
}

function generateTemplatePoints() {
  templateLayer.clear();
  templateLayer.textAlign(LEFT, BASELINE); 
  templateLayer.textStyle("bold");
  templateLayer.fill(255, 0, 0); 
  templateLayer.noStroke();
  
  let lineYStart = height * 0.42; 
  let targetRedDashY = (lineYStart + 180) - 60; 
  let data = wordData[currentLetter];
  let chars = data.word.toLowerCase().split("");
  
  let tSize = chars.length > 4 ? width * 0.07 : width * 0.085;
  let stepX = chars.length > 4 ? width * 0.075 : width * 0.1; 
  let startX = width / 2 + (width * 0.05); 
  
  templateLayer.textSize(tSize);
  
  for (let i = 0; i < chars.length; i++) {
    templateLayer.text(chars[i], startX + (i * stepX), targetRedDashY);
  }
  
  targetPoints = [];
  templateLayer.loadPixels();
  
  let scanYStart = max(0, int(targetRedDashY - tSize * 1.2));
  let scanYEnd = min(height, int(targetRedDashY + tSize * 0.4));
  let scanXStart = int(startX - 20); 
  
  for (let y = scanYStart; y < scanYEnd; y += 4) {
    for (let x = scanXStart; x < width - 20; x += 4) {
      let idx = (x + y * templateLayer.width) * 4;
      if (templateLayer.pixels[idx] > 200) { 
        targetPoints.push({ x: x, y: y, covered: false });
      }
    }
  }
}

function draw() {
  document.oncontextmenu = function() { return false; };

  if (currentScreen === "LOGIN") {
    drawLoginScreen();
  } else if (currentScreen === "HOME") {
    drawHomeScreen();
  } else if (currentScreen === "MENU") {
    drawMenu();
  } else {
    drawGameScreen();
  }
}

function drawLoginScreen() {
  background(243, 247, 250); 

  for (let fl of floatingLetters) {
    fl.y -= fl.speedY;
    if (fl.y < -60) {
      fl.y = height + 60;
      fl.x = random(width);
    }
    push();
    fill(fl.color);
    noStroke();
    textSize(fl.size);
    textStyle("bold");
    text(fl.char, fl.x, fl.y);
    pop();
  }

  let accY = accountInput ? accountInput.y : height / 2 - 60;
  let passY = passwordInput ? passwordInput.y : height / 2;

  push();
  textSize(min(width * 0.045, 44));
  textStyle("bold");
  fill(90, 105, 120);
  text("English ABC Adventure", width / 2, accY - 100); 
  
  textSize(16);
  textStyle("normal"); 
  fill(130, 140, 150);
  text("請在下方欄位輸入「123」解鎖字母冒險！", width / 2, accY - 50);
  pop();

  push();
  textSize(16);
  textStyle("bold");
  fill(80, 90, 100);
  textAlign(RIGHT, CENTER);
  text("帳號：", width / 2 - 110, accY + 16); 
  text("密碼：", width / 2 - 110, passY + 16); 
  pop();

  if (loginErrorMessage !== "") {
    push();
    textSize(14);
    textStyle("bold");
    fill(235, 75, 75);
    text(loginErrorMessage, width / 2, passY + 80); 
    pop();
  }
}

function drawHomeScreen() {
  background(243, 247, 250); 
  
  for (let fl of floatingLetters) {
    fl.y -= fl.speedY;
    if (fl.y < -60) {
      fl.y = height + 60;
      fl.x = random(width);
    }
    push();
    fill(fl.color);
    noStroke();
    textSize(fl.size);
    textStyle("bold");
    text(fl.char, fl.x, fl.y);
    pop();
  }
  
  push();
  let homeTitleSize = min(width * 0.1, 110);
  textSize(homeTitleSize);
  textStyle("bold");
  
  fill(220, 230, 245); text("A", width/2 - (homeTitleSize * 1.3), height * 0.25 + 5);
  fill(255, 110, 110); text("A", width/2 - (homeTitleSize * 1.3), height * 0.25);
  
  fill(220, 230, 245); text("B", width/2, height * 0.25 + 5);
  fill(255, 215, 80); text("B", width/2, height * 0.25);
  
  fill(220, 230, 245); text("C", width/2 + (homeTitleSize * 1.3), height * 0.25 + 5);
  fill(90, 190, 240); text("C", width/2 + (homeTitleSize * 1.3), height * 0.25);
  pop();

  fill(90, 105, 120);
  textSize(22);
  textStyle("bold");
  text("English ABC Adventure", width / 2, height * 0.38);
  
  let unlockedCount = getUnlockedCount();
  let isAnyUnlocked = unlockedCount > 0;
  
  push();
  translate(width / 2, height * 0.58);
  
  if (isAnyUnlocked) {
    let glowSize = map(unlockedCount, 0, 26, 120, 240);
    let pulse = sin(frameCount * 0.05) * 10;
    noStroke();
    fill(255, 235, 130, 40 + pulse);
    ellipse(0, -30, glowSize + 30);
  }
  
  if (isAnyUnlocked) {
    fill(255, 240, 150); stroke(245, 180, 40);
  } else {
    fill(235, 238, 242); stroke(170, 180, 190);
  }
  strokeWeight(5);
  ellipse(0, -30, 110, 110);
  
  rectMode(CENTER);
  fill(180, 185, 195); stroke(130, 135, 145); strokeWeight(3);
  rect(0, 30, 42, 14, 4);
  rect(0, 43, 28, 10, 3);
  pop();
  
  fill(100, 115, 130);
  textSize(16);
  textStyle("normal");
  text("精通進度：已點亮 " + unlockedCount + " 個關卡小燈泡", width / 2, height * 0.72);
  
  rectMode(CENTER);
  fill(220, 225, 232);
  noStroke();
  rect(width / 2, height * 0.76, 300, 14, 7);
  if (unlockedCount > 0) {
    rectMode(CORNER);
    fill(75, 200, 115);
    let progressWidth = map(unlockedCount, 0, 26, 0, 300);
    rect(width / 2 - 150, (height * 0.76) - 7, progressWidth, 14, 7);
  }
  
  push();
  rectMode(CENTER);
  fill(255, 95, 100);
  noStroke();
  rect(width / 2, height * 0.86, 220, 54, 27);
  
  fill(255);
  textSize(22);
  textStyle("bold");
  text("START  🚀", width / 2, height * 0.86);
  pop();
}

function drawMenu() {
  let isAllClear = checkAllUnlocked();

  if (isAllClear) {
    background(20, 25, 40);
    fill(255, 255, 255, 150);
    for(let i=0; i<30; i++) {
      let sx = noise(i * 10) * width;
      let sy = noise(i * 20) * (height - 200);
      ellipse(sx, sy, random(2, 4));
    }
    if (random(1) < 0.06) {
      fireworks.push(new Firework(random(width), height, random(width), random(100, 300)));
    }
    for (let i = fireworks.length - 1; i >= 0; i--) {
      fireworks[i].update(); fireworks[i].show();
      if (fireworks[i].done()) fireworks.splice(i, 1);
    }
  } else {
    background(248, 246, 240);
  }
  
  fill(isAllClear ? 255 : 60);
  noStroke(); textAlign(CENTER, CENTER);
  if (isAllClear) {
    textSize(28); textStyle("bold"); text("🎉 AMAZING! YOU DID IT! 🎆", width / 2, 50);
  } else {
    textSize(26); textStyle("bold"); text("✏️ 冒險地圖：字母小燈泡 💡", width / 2, 45);
    textSize(14); textStyle("normal"); fill(120);
    text("⌨️ 請敲擊外接鍵盤 [ A - Z ] 或直接點選地圖上的小燈泡進入挑戰關卡！", width / 2, 80);
  }
  
  push();
  rectMode(CENTER);
  fill(255); stroke(210); strokeWeight(1.5);
  rect(100, 50, 130, 40, 10);
  fill(70); noStroke(); textSize(14); textStyle("bold");
  text("🏠 回主畫面", 100, 50);
  pop();
  
  for (let i = 0; i < levelPositions.length; i++) {
    let pos = levelPositions[i];
    drawCrayonBulb(pos.x, pos.y, pos.letter, unlockedLevels[pos.letter]);
  }

  if (isAllClear) {
    rectMode(CENTER); fill(255, 70, 70); noStroke(); rect(width - 100, 50, 120, 40, 10);
    fill(255); textSize(14); textStyle("bold"); text("重玩 🔄", width - 100, 50);
  }
}

function drawCrayonBulb(x, y, letter, isUnlocked) {
  push(); translate(x, y);
  let bSize = min(width * 0.042, 42); 
  if (isUnlocked) fill(255, 230, 100); 
  else noFill();            
  stroke(isUnlocked ? [235, 160, 0] : [130, 130, 130]); 
  strokeWeight(3);
  ellipse(0, -5, bSize, bSize); 
  rectMode(CENTER); 
  fill(isUnlocked ? 240 : 140); stroke(100); strokeWeight(1.5);
  rect(0, bSize/2, 18, 8, 2); 
  fill(isUnlocked ? [200, 80, 0] : [110]); noStroke(); 
  textSize(bSize * 0.48); textStyle("bold");
  text(letter, 0, -5);
  pop();
}

function drawGameScreen() {
  rectMode(CORNER); noStroke();
  
  fill(30, 35, 45); rect(0, 80, width / 2, height - 80); 
  fill(255); rect(width / 2, 80, width / 2, height - 80); 
  
  stroke(210, 225, 240); strokeWeight(2);
  let lineYStart = height * 0.42; 
  
  for(let i = 0; i < 2; i++) {
    let y = lineYStart + (i * 180);
    line(width / 2 + 30, y, width - 30, y); 
    stroke(240, 180, 180, 130); strokeWeight(1.5);
    push(); drawingContext.setLineDash([6, 6]);
    line(width / 2 + 30, y - 60, width - 30, y - 60);  
    line(width / 2 + 30, y - 120, width - 30, y - 120); 
    pop(); stroke(210, 225, 240); strokeWeight(2);
  }

  if (!isLevelCompleted) {
    push(); fill(255, 255, 255, 8); noStroke(); 
    textSize(min(width * 0.28, height * 0.5)); textStyle("bold");
    text(currentLetter, width / 4, height / 2 + 40); pop();
  }

  push();
  noStroke(); textStyle("bold"); 
  
  if (isPencilChecked && !isWritingCorrect) {
    let elapsedFrames = frameCount - errorFlashFrameStart;
    if (elapsedFrames < 80 && Math.floor(elapsedFrames / 20) % 2 === 0) {
      stroke(235, 75, 75, 220); strokeWeight(5);
    } else {
      stroke(235, 75, 75, 60); strokeWeight(3);
    }
  } else {
    fill(225, 228, 232); 
  }
  
  textAlign(LEFT, BASELINE); 

  let firstRedDashY = lineYStart - 60;
  let mainLetterSize = min(width * 0.12, 130);
  
  if (!isLevelCompleted) {
    textSize(mainLetterSize); text(currentLetter, width / 2 + (width * 0.05), firstRedDashY);
    textSize(mainLetterSize * 0.76); text(currentLetter.toLowerCase(), width / 2 + (width * 0.05) + (mainLetterSize * 1.2), firstRedDashY);
  } else {
    let secondRedDashY = (lineYStart + 180) - 60; 
    let data = wordData[currentLetter];
    let chars = data.word.toLowerCase().split("");
    let tSize = chars.length > 4 ? width * 0.07 : width * 0.085;
    let stepX = chars.length > 4 ? width * 0.075 : width * 0.1; 
    let startX = width / 2 + (width * 0.05); 
    
    textSize(tSize); 
    for (let i = 0; i < chars.length; i++) {
      text(chars[i], startX + (i * stepX), secondRedDashY);
    }
  }
  pop();

  if (mouseIsPressed) {
    if (mouseX < width - 150 || mouseY > 230) {
      if (mouseX > 0 && mouseX < width / 2 && mouseY > 80 && mouseY < height) {
        if (!isLevelCompleted) {
          if (currentTool === "PEN") {
            scribbleLayer.stroke(255, 215, 0, 220); 
            for (let i = 0; i < 5; i++) {
              let offsetX = random(-2, 2); let offsetY = random(-2, 2);
              scribbleLayer.strokeWeight(random(1.5, 3.5));
              scribbleLayer.line(pmouseX + offsetX, pmouseY + offsetY, mouseX + offsetX, mouseY + offsetY);
            }
          } else if (currentTool === "ERASER") {
            scribbleLayer.push(); scribbleLayer.drawingContext.globalCompositeOperation = 'destination-out';
            scribbleLayer.stroke(255); scribbleLayer.strokeWeight(40);
            scribbleLayer.line(pmouseX, pmouseY, mouseX, mouseY); scribbleLayer.pop();
          }
        }
      }
      
      if (mouseX > width / 2 && mouseX < width && mouseY > 80 && mouseY < height) {
        if (currentTool === "PEN") {
          pencilLayer.stroke(50, 60, 70, 240); pencilLayer.strokeWeight(5); 
          pencilLayer.line(pmouseX, pmouseY, mouseX, mouseY);
          
          if (isLevelCompleted && targetPoints.length > 0) {
            let hitTarget = false;
            for (let p of targetPoints) {
              if (!p.covered) {
                let d = dist(mouseX, mouseY, p.x, p.y);
                if (d < 22) { p.covered = true; userCoveredPoints++; hitTarget = true; }
              } else { if (dist(mouseX, mouseY, p.x, p.y) < 22) hitTarget = true; }
            }
            let secondRedDashY = (lineYStart + 180) - 60;
            if (!hitTarget && mouseY > (secondRedDashY - 100) && mouseY < (secondRedDashY + 40)) outOfBoundsCount++;
          }
        } else if (currentTool === "ERASER") {
          pencilLayer.push(); pencilLayer.drawingContext.globalCompositeOperation = 'destination-out';
          pencilLayer.stroke(255); pencilLayer.strokeWeight(40);
          pencilLayer.line(pmouseX, pmouseY, mouseX, mouseY); pencilLayer.pop();
          
          if (isLevelCompleted) {
            userCoveredPoints = 0; outOfBoundsCount = 0;
            for (let p of targetPoints) p.covered = false;
          }
        }
      }
    }
  }

  image(scribbleLayer, 0, 0);
  image(pencilLayer, 0, 0);

  if (isLevelCompleted) {
    if (objectAlpha < 255) objectAlpha += 8;
    let targetX = width / 4;
    objectX = lerp(objectX, targetX, 0.1); 
    
    push(); rectMode(CENTER); fill(255, 255, 255, objectAlpha * 0.92); noStroke();
    let cardW = min(width * 0.33, 340);
    let cardH = min(height * 0.55, 380);
    rect(objectX, height / 2 + 20, cardW, cardH, 20);
    
    translate(objectX, height / 2 - 40);
    let currentData = wordData[currentLetter];
    if (currentData && currentData.draw) currentData.draw(objectAlpha);
    
    noStroke(); fill(40, 45, 55, objectAlpha); textSize(36); textStyle(BOLD);
    text(currentData.word, 0, cardH * 0.28);
    fill(235, 75, 75, objectAlpha); textSize(26); 
    text(currentData.ch, 0, cardH * 0.4);
    fill(120, 130, 140, objectAlpha); textSize(16); textStyle(NORMAL);
    text(currentData.spell, 0, cardH * 0.5);
    pop();
  }
  
  if (isPencilChecked && praiseTimer > 0) {
    praiseTimer--;
    push(); noStroke(); textAlign(CENTER, CENTER);
    if (isWritingCorrect) {
      fill(40, 180, 100, map(praiseTimer, 0, 30, 0, 255)); textSize(38); textStyle("bold");
      text(praiseText, width * 0.75, height / 2);
    } else {
      fill(235, 75, 75, map(praiseTimer, 0, 30, 0, 255)); textSize(30); textStyle("bold");
      text(praiseText, width * 0.75, height / 2 - 20);
      textSize(15); textStyle("normal"); fill(100, map(praiseTimer, 0, 30, 0, 255));
      text("💡 提示：請順著字母灰色軌跡填滿，不要塗鴉喔！", width * 0.75, height / 2 + 25);
    }
    pop();
  }

  push();
  rectMode(CENTER);
  if (currentTool === "PEN") {
    fill(90, 160, 235); stroke(50, 110, 180); strokeWeight(3);
  } else {
    fill(255); stroke(220); strokeWeight(1.5);
  }
  rect(width - 80, 125, 130, 44, 12);
  fill(currentTool === "PEN" ? 255 : 60); noStroke(); textSize(15); textStyle("bold");
  text("✏️ 畫筆模式", width - 80, 125);
  
  if (currentTool === "ERASER") {
    fill(240, 110, 110); stroke(180, 60, 60); strokeWeight(3);
  } else {
    fill(255); stroke(220); strokeWeight(1.5);
  }
  rect(width - 80, 180, 130, 44, 12);
  fill(currentTool === "ERASER" ? 255 : 60); noStroke(); textSize(15); textStyle("bold");
  text("🧽 橡皮擦", width - 80, 180);
  pop();

  push(); noStroke(); fill(242, 240, 234); rect(0, 0, width, 80);
  fill(70); textAlign(LEFT, CENTER); textSize(18); textStyle("bold"); text("🎨 Level " + currentLetter, 40, 40);
  
  textAlign(CENTER, CENTER);
  if (!isLevelCompleted) {
    fill(210, 80, 80); textSize(14);
    text("左區摸黑塗鴉 ｜ 右區用 Pencil 練習 💡 寫完請按實體鍵盤 [ " + currentLetter + " ] 鍵喚醒！", width / 2, 40);
  } else {
    if (unlockedLevels[currentLetter]) {
      fill(40, 150, 85); textSize(14); text("🎉 太棒了！關卡挑戰成功！", width / 2, 40);
    } else {
      fill(225, 140, 20); textSize(14); text("👉 請拿 Apple Pencil 精準描寫右側的完整單字軌跡", width / 2, 40);
    }
  }
  
  rectMode(CENTER); fill(255); stroke(200); strokeWeight(2); 
  rect(width - 100, 40, 140, 44, 12); 
  fill(50); noStroke(); textSize(15); textStyle("bold"); text("返回地圖 🗺️", width - 100, 40);

  if (isLevelCompleted) {
    fill(255, 235, 50); stroke(220, 180, 0); strokeWeight(2);
    rect(width - 260, 40, 140, 44, 12);
    fill(50); noStroke(); textSize(15); textStyle("bold"); text("檢查寫字 🔍", width - 260, 40);
  }
  pop();
}

function mousePressed() {
  if (currentScreen === "LOGIN") return;

  if (currentScreen === "HOME") {
    if (mouseX > width / 2 - 110 && mouseX < width / 2 + 110 &&
        mouseY > height * 0.86 - 27 && mouseY < height * 0.86 + 27) {
      currentScreen = "MENU";
    }
    return;
  }

  if (currentScreen === "MENU") {
    if (mouseX > 35 && mouseX < 165 && mouseY > 30 && mouseY < 70) {
      currentScreen = "HOME"; return;
    }
    if (checkAllUnlocked() && mouseX > width - 160 && mouseX < width - 40 && mouseY > 30 && mouseY < 70) {
      for (let i = 0; i < letters.length; i++) unlockedLevels[letters[i]] = false;
      fireworks = []; return;
    }
    for (let pos of levelPositions) {
      if (dist(mouseX, mouseY, pos.x, pos.y) < 25) {
        initLevel(pos.letter); return;
      }
    }
  }
  
  if (currentScreen !== "MENU" && currentScreen !== "LOGIN" && currentScreen !== "HOME") {
    if (mouseX > width - 170 && mouseX < width - 30 && mouseY > 18 && mouseY < 62) {
      currentScreen = "MENU"; return;
    }
    if (isLevelCompleted && mouseX > width - 330 && mouseX < width - 190 && mouseY > 18 && mouseY < 62) {
      isPencilChecked = true; praiseTimer = 180; 
      let totalTarget = targetPoints.length;
      let coverPercent = totalTarget > 0 ? (userCoveredPoints / totalTarget) : 0;
      if (coverPercent >= 0.62 && outOfBoundsCount < totalTarget * 0.8) {
        isWritingCorrect = true; unlockedLevels[currentLetter] = true; 
        praiseText = "答對了！🎉 GOOD JOB!"; playCorrectSound(); 
      } else {
        isWritingCorrect = false; praiseText = "❌ 軌跡有些偏移，擦掉再試一次！";
        errorFlashFrameStart = frameCount; playErrorSound();
      }
      return;
    }
    if (mouseX > width - 145 && mouseX < width - 15 && mouseY > 103 && mouseY < 147) { currentTool = "PEN"; return; }
    if (mouseX > width - 145 && mouseX < width - 15 && mouseY > 158 && mouseY < 202) { currentTool = "ERASER"; return; }
  }
}

function touchStarted() {
  if (currentScreen === "LOGIN") {
    if (mouseX > width / 2 - 100 && mouseX < width / 2 + 100) {
      if ((mouseY > height / 2 - 60 && mouseY < height / 2 - 28) || (mouseY > height / 2 && mouseY < height / 2 + 32)) {
        return true; 
      }
    }
    if (mouseX > width / 2 - 60 && mouseX < width / 2 + 60 && mouseY > height / 2 + 60 && mouseY < height / 2 + 100) {
      handleLogin(); return true; 
    }
  }
  
  let clickButton = false;
  if (currentScreen === "HOME") {
    if (mouseX > width / 2 - 110 && mouseX < width / 2 + 110 && mouseY > height * 0.86 - 27 && mouseY < height * 0.86 + 27) clickButton = true;
  } else if (currentScreen === "MENU") {
    if (mouseX > 35 && mouseX < 165 && mouseY > 30 && mouseY < 70) clickButton = true;
    if (mouseX > width - 160 && mouseX < width - 40 && mouseY > 30 && mouseY < 70) clickButton = true;
    for (let pos of levelPositions) {
      if (dist(mouseX, mouseY, pos.x, pos.y) < 25) clickButton = true;
    }
  } else {
    if (mouseX > width - 170 && mouseX < width - 30 && mouseY > 18 && mouseY < 62) clickButton = true;
    if (isLevelCompleted && mouseX > width - 330 && mouseX < width - 190 && mouseY > 18 && mouseY < 62) clickButton = true;
    if (mouseX > width - 145 && mouseX < width - 15 && mouseY > 103 && mouseY < 147) clickButton = true;
    if (mouseX > width - 145 && mouseX < width - 15 && mouseY > 158 && mouseY < 202) clickButton = true;
  }
  
  if (clickButton) { mousePressed(); return true; }
  return false;
}

function touchMoved() { return false; }

function keyPressed() {
  let keyUpper = key.toUpperCase(); 
  if (KEY_MAP[keyUpper]) keyUpper = KEY_MAP[keyUpper]; 
  if (currentScreen === "MENU" && letters.includes(keyUpper)) initLevel(keyUpper);
  if (currentScreen === "GAME_" + currentLetter && keyUpper === currentLetter && !isLevelCompleted) {
    isLevelCompleted = true; generateTemplatePoints(); speakWord(currentLetter); 
  }
  if (keyCode === ESCAPE) currentScreen = "MENU";
}

function playCorrectSound() {
  let ctx = new (window.AudioContext || window.webkitAudioContext)();
  let osc1 = ctx.createOscillator(); let gain1 = ctx.createGain();
  osc1.type = 'sine'; osc1.frequency.setValueAtTime(523.25, ctx.currentTime); gain1.gain.setValueAtTime(0.3, ctx.currentTime);
  gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15); osc1.connect(gain1); gain1.connect(ctx.destination); osc1.start(); osc1.stop(ctx.currentTime + 0.15);
  let osc2 = ctx.createOscillator(); let gain2 = ctx.createGain();
  osc2.type = 'sine'; osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.08);
  gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3); osc2.connect(gain2); gain2.connect(ctx.destination); osc2.start(ctx.currentTime + 0.08); osc2.stop(ctx.currentTime + 0.3);
}

function playErrorSound() {
  let ctx = new (window.AudioContext || window.webkitAudioContext)();
  let osc = ctx.createOscillator(); let gain = ctx.createGain();
  osc.type = 'sawtooth'; osc.frequency.setValueAtTime(180, ctx.currentTime); gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.25); osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.25);
}

function speakWord(letter) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel(); let data = wordData[letter];
    let utteranceEng = new SpeechSynthesisUtterance(data.word + ". " + data.spell.replace(/-/g, "") + ".");
    utteranceEng.lang = 'en-US'; utteranceEng.pitch = 1.35; utteranceEng.rate = 0.8;
    let utteranceCh = new SpeechSynthesisUtterance(data.ch); utteranceCh.lang = 'zh-TW'; utteranceCh.pitch = 1.2; utteranceCh.rate = 0.9;
    window.speechSynthesis.speak(utteranceEng); window.speechSynthesis.speak(utteranceCh);
  }
}

class Firework {
  constructor(x, y, targetX, targetY) {
    this.x = x; this.y = y; this.targetY = targetY; this.exploded = false; this.particles = []; this.speed = random(6, 10);
    this.col = color(random(150, 255), random(150, 255), random(150, 255));
  }
  update() {
    if (!this.exploded) { this.y -= this.speed; if (this.y <= this.targetY) { this.exploded = true; this.explode(); } } 
    else { for (let i = this.particles.length - 1; i >= 0; i--) { this.particles[i].update(); if (this.particles[i].alpha <= 0) this.particles.splice(i, 1); } }
  }
  explode() { let count = random(30, 50); for (let i = 0; i < count; i++) { let angle = random(TWO_PI); let speed = random(1, 5); this.particles.push(new Particle(this.x, this.y, angle, speed, this.col)); } }
  show() { if (!this.exploded) { stroke(this.col); strokeWeight(random(3, 5)); line(this.x, this.y, this.x, this.y + 10); } else { for (let p of this.particles) p.show(); } }
  done() { return this.exploded && this.particles.length === 0; }
}

class Particle {
  constructor(x, y, angle, speed, col) { this.x = x; this.y = y; this.vx = cos(angle) * speed; this.vy = sin(angle) * speed; this.col = col; this.alpha = 255; this.gravity = 0.08; this.w = random(2, 5); }
  update() { this.x += this.vx; this.y += this.vy; this.vy += this.gravity; this.alpha -= 4; }
  show() { push(); noStroke(); fill(red(this.col), green(this.col), blue(this.col), this.alpha); ellipse(this.x, this.y, this.w); pop(); }
}

function drawAnt(a) { fill(80, a); noStroke(); ellipse(-25, 0, 35, 35); ellipse(0, -5, 30, 30); ellipse(25, -10, 45, 40); stroke(80, a); strokeWeight(3); line(-10, 5, -15, 25); line(5, 5, 10, 25); }
function drawBus(a) { fill(245, 200, 50, a); noStroke(); rect(-80, -35, 160, 75, 8); fill(50, a); ellipse(-40, 40, 26, 26); ellipse(40, 40, 26, 26); fill(200, 230, 255, a); rect(25, -20, 30, 22, 3); rect(-55, -20, 30, 22, 3); rect(-15, -20, 30, 22, 3); }
function drawCat(a) { fill(200, a); noStroke(); ellipse(0, 10, 110, 95); triangle(-40, -45, -15, -10, -45, 10); triangle(40, -45, 15, -10, 45, 10); fill(50, a); ellipse(-18, 0, 10, 10); ellipse(18, 0, 10, 10); fill(240, 130, 130, a); triangle(0, 12, -6, 6, 6, 6); }
function drawDog(a) { fill(160, 110, 70, a); noStroke(); ellipse(0, 0, 110, 110); fill(100, 70, 40, a); ellipse(-50, 0, 35, 70); ellipse(50, 0, 35, 70); fill(0, a); ellipse(-18, -10, 12, 12); ellipse(18, -10, 12, 12); ellipse(0, 12, 22, 14); }
function drawEgg(a) { fill(245, 235, 220, a); stroke(220, 200, 180, a); strokeWeight(2); ellipse(0, 0, 100, 135); }
function drawFox(a) { noStroke(); fill(235, 110, 40, a); triangle(-40, -50, -12, -18, -45, -8); triangle(40, -50, 12, -18, 45, -8); triangle(-50, -8, 50, -8, 0, 40); ellipse(0, -12, 100, 80); fill(0, a); ellipse(-20, -12, 10, 10); ellipse(20, -12, 10, 10); ellipse(0, 38, 14, 14); }
function drawGum(a) { fill(240, 120, 160, a); noStroke(); ellipse(0, 0, 90, 90); quad(-60, -18, -45, 0, -60, 18, -70, 0); quad(60, -18, 45, 0, 60, 18, 70, 0); }
function drawHat(a) { push(); rectMode(CENTER); noStroke(); fill(65, 105, 225, a); rect(0, -15, 100, 70, 10, 10, 0, 0); fill(235, 75, 75, a); rect(0, 12, 102, 14); fill(50, 85, 200, a); ellipse(0, 20, 150, 25); pop(); }
function drawIce(a) { push(); rectMode(CENTER); noStroke(); fill(180, 225, 255, a); rect(0, 0, 100, 100, 20); fill(255, 255, 255, a * 0.4); quad(-35, -35, 12, -35, -8, -8, -35, -8); pop(); }

// 💡 提醒：記得在下方補齊你的其餘繪圖函式，如 drawJam, drawSun, drawBoxObj 等
function drawJam(a) { push(); rectMode(CENTER); noStroke(); fill(210, 45, 80, a); rect(0, 12, 80, 90, 15); fill(180, 185, 190, a); rect(0, -35, 90, 18, 5); fill(245, 240, 220, a); rect(0, 0, 50, 40, 4); pop(); }
function drawKey(a) { fill(200, a); ellipse(-30, 0, 40, 40); fill(243, 247, 250); ellipse(-30, 0, 16, 16); fill(200, a); rect(-10, -6, 60, 12); rect(25, 6, 10, 15); rect(40, 6, 10, 15); }
function drawLog(a) { fill(139, 69, 19, a); ellipse(40, 0, 20, 50); rect(-40, -25, 80, 50); fill(222, 184, 135, a); ellipse(-40, 0, 20, 50); }
function drawMud(a) { fill(101, 67, 33, a); beginShape(); vertex(-50, 20); bezierVertex(-30, -10, 30, -20, 50, 20); endShape(CLOSE); }
function drawNut(a) { fill(210, 105, 30, a); ellipse(0, 0, 60, 80); fill(139, 69, 19, a); arc(0, -10, 62, 60, PI, TWO_PI, CHORD); }
function drawOwl(a) { fill(128, 0, 128, a); ellipse(0, 10, 90, 100); fill(255, a); ellipse(-20, -10, 30, 30); ellipse(20, -10, 30, 30); fill(0, a); ellipse(-20, -10, 10, 10); ellipse(20, -10, 10, 10); fill(255, 165, 0, a); triangle(0, 5, -8, -5, 8, -5); }
function drawPig(a) { fill(255, 192, 203, a); ellipse(0, 0, 110, 90); fill(255, 105, 180, a); ellipse(0, 10, 35, 25); fill(0, a); ellipse(-8, 10, 6, 6); ellipse(8, 10, 6, 6); ellipse(-25, -15, 10, 10); ellipse(25, -15, 10, 10); }
function drawQueen(a) { fill(255, 215, 0, a); triangle(-40, -20, -40, -50, -20, -30); triangle(-20, -30, 0, -60, 20, -30); triangle(20, -30, 40, -50, 40, -20); fill(147, 112, 219, a); rect(-40, -20, 80, 60, 5); }
function drawRed(a) { fill(255, 0, 0, a); rect(-50, -50, 100, 100, 10); }
function drawSun(a) { fill(255, 69, 0, a); ellipse(0, 0, 80, 80); fill(255, 140, 0, a); for(let i=0; i<8; i++) { push(); rotate(QUARTER_PI * i); triangle(-10, -45, 10, -45, 0, -65); pop(); } }
function drawToy(a) { fill(0, 128, 128, a); rect(-35, -35, 70, 70, 5); fill(255, 99, 71, a); ellipse(0, 0, 40, 40); }
function drawUFO(a) { fill(192, a); ellipse(0, 0, 120, 40); fill(0, 191, 255, a*0.5); arc(0, -10, 60, 50, PI, TWO_PI, CHORD); fill(255, 255, 0, a); ellipse(-30, 5, 10, 10); ellipse(0, 5, 10, 10); ellipse(30, 5, 10, 10); }
function drawVan(a) { fill(70, 130, 180, a); rect(-70, -30, 140, 60, 5); fill(243, 247, 250); rect(30, -20, 35, 25); fill(50, a); ellipse(-40, 30, 24, 24); ellipse(40, 30, 24, 24); }
function drawWeb(a) { stroke(120, a); strokeWeight(2); noFill(); for(let i=1; i<=4; i++) ellipse(0, 0, i*30, i*30); for(let i=0; i<8; i++) { push(); rotate(QUARTER_PI * i); line(0, 0, 0, 65); pop(); } }
function drawBoxObj(a) { fill(210, 180, 140, a); rect(-50, -40, 100, 80); line(-50, -40, 0, -10); line(50, -40, 0, -10); line(0, -10, 0, 40); }
function drawYoyo(a) { fill(34, 139, 34, a); ellipse(-10, 0, 25, 70); ellipse(10, 0, 25, 70); fill(255, 215, 0, a); ellipse(0, 0, 15, 50); }
function drawZoo(a) { fill(100, a); rect(-60, -40, 120, 80, 5); stroke(255, a); strokeWeight(3); for(let x = -40; x <= 40; x += 20) line(x, -40, x, 40); }

