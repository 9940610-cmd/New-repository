let currentScreen = "LOGIN"; // 初始狀態為登入畫面
let accountInput, passwordInput, loginButton; 
let loginErrorMessage = ""; 

let currentLetter = "";     // 
當前正在挑戰的字母 (A-Z)
let letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
let levelPositions = [];    // 儲存 26 個關卡燈泡的位置

// 紀錄哪些關卡已經被點亮
let unlockedLevels = {}; 

// 關卡挑戰控制變數let isLevelCompleted = false;
let objectX; // 動畫 X 座標
let objectAlpha = 0; 

// 右側 Apple Pencil 單字檢查與慶祝動畫變數
let isPencilChecked = false;
let praiseTimer = 0;
let praiseText = ""; // 動態提示詞
let isWritingCorrect = false; // 是否通過寫字判定

// 煙火特效陣列
let fireworks = [];

// 主畫面背景漂浮字母變數
let floatingLetters = [];

// 當前畫筆工具狀態模式 ("PEN" 或 "ERASER")
let currentTool = "PEN"; 

// 離屏畫布
let scribbleLayer; // 左邊摸黑塗鴉層
let pencilLayer;   // 右邊 Apple Pencil 寫字層
let templateLayer; // 隱藏的字形核心範本層

// 寫字檢查核心變數
let targetPoints = []; // 儲存當前字母需要被描寫的目標座標點
let userCoveredPoints = 0; // 用戶描到了幾個目標點
let outOfBoundsCount = 0; // 用戶亂畫（出界）的扣分計數

// 控制閃爍次數的專用變數
let errorFlashFrameStart = 0; // 記錄開始閃爍時的 frameCount

// 適合幼兒的單字 + 中文翻譯資料庫
const wordData = {
  'A': { word: "Ant", ch: "螞蟻", spell: "a - n - t", draw: drawAnt },
  'B': { word: "Bus", ch: "公車", spell: "b - u - s", draw: drawBus },
  'C': { word: "Cat", ch: "貓咪", spell: "c - a - t", draw: drawCat },
  'D': { word: "Dog", ch: "狗狗", spell: "d - o - g", draw: drawDog },
  'E': { word: "Egg", ch: "雞蛋", spell: "e - g - g", draw: drawEgg },
  'F': { word: "Fox", ch: "狐狸", spell: "f - o - x", draw: drawFox },
  'G': { word: "Gum", ch: "糖果", spell: "g - u - m", draw: drawGum },
  'H': { word: "Hat", ch: "帽子", spell: "h - a - t", draw: drawHat },
  'I': { stroke: true, word: "Ice", ch: "冰塊", spell: "i - c - e", draw: drawIce }, 
  'J': { word: "Jam", ch: "果醬", spell: "j - a - m", draw: drawJam },
  'K': { word: "Key", ch: "鑰匙", spell: "k - e - y", draw: drawKey },
  'L': { word: "Log", ch: "木頭", spell: "l - o - g", draw: drawLog },
  'M': { word: "Mud", ch: "泥巴", spell: "m - u - d", draw: drawMud },
  'N': { word: "Nut", ch: "堅客", spell: "n - u - t", draw: drawNut },
  'O': { word: "Owl", ch: "貓頭鷹", spell: "o - w - l", draw: drawOwl },
  'P': { word: "Pig", ch: "小豬", spell: "p - i - g", draw: drawPig },
  'Q': { word: "Queen", ch: "女王", spell: "q - u - e - e - n", draw: drawQueen },
  'R': { word: "Red", ch: "紅色", spell: "r - e - d", draw: drawRed },
  'S': { word: "Sun", ch: "太陽", spell: "s - u - n", draw: drawSun },
  'T': { word: "Toy", ch: "玩具", spell: "t - o - y", draw: drawToy },
  'U': { word: "UFO", ch: "飛碟", spell: "u - f - o", draw: drawUFO },
  'V': { word: "Van", ch: "貨車", spell: "v - a - n", draw: drawVan },
  'W': { word: "Web", ch: "蜘蛛網", spell: "w - e - b", draw: drawWeb },
  'X': { word: "Box", ch: "盒子", spell: "b - o - x", draw: drawBoxObj },
  'Y': { word: "Yo-yo", ch: "溜溜球", spell: "y - o - y - o", draw: drawYoyo },
  'Z': { word: "Zoo", ch: "動物園", spell: "z - o - o", draw: drawZoo }
};

//按鍵映射表： "實際按下的鍵" : "真正觸發的字母"
const KEY_MAP = {
  'Q': 'A', 'W': 'B', 'E': 'C', 'R': 'D', 'T': 'E', 'Y': 'F', 'U': 'G', 'I': 'H', 'O': 'I', 'P': 'J',
  'A': 'K', 'S': 'L', 'D': 'M', 'F': 'N', 'G': 'O', 'H': 'P', 'J': 'Q', 'K': 'R', 'L': 'S',
  'Z': 'T', 'X': 'U', 'C': 'V', 'V': 'W', 'B': 'X', 'N': 'Y', 'M': 'Z'
};

function setup() {
  createCanvas(1024, 768);
  textAlign(CENTER, CENTER);
  
  createLoginUI();

  scribbleLayer = createGraphics(1024, 768);
  pencilLayer = createGraphics(1024, 768);
  templateLayer = createGraphics(1024, 768);
  clearCanvasLayers();

  let tempLetters = ["A", "B", "C"];
  for (let i = 0; i < 15; i++) {
    floatingLetters.push({
      x: random(width),
      y: random(height),
      size: random(40, 90),
      char: random(tempLetters),
      speedY: random(0.5, 1.5),
      color: color(random(100, 230), random(120, 230), random(200, 255), 70)
    });
  }

  let cols = 7;
  let rows = 4;
  let hSpacing = width / (cols + 1);
  let vSpacing = (height - 140) / (rows + 1);
  
  for (let i = 0; i < 26; i++) {
 let col = i % cols; 
 let gridRow = Math.floor(i / cols); 
 let x = hSpacing * (col + 1); 
 let y = 130 + vSpacing * (gridRow + 1); 
    levelPositions.push({ x: x, y: y, letter: letters[i] });
    unlockedLevels[letters[i]] = false; 
  }
}

function createLoginUI() {
  accountInput = createInput('');
  accountInput.position(width / 2 - 100, height / 2 - 60);
  accountInput.size(200, 32);
  accountInput.style('font-size', '16px');
  accountInput.style('border-radius', '8px');
  accountInput.style('border', '1px solid #ccc');
  accountInput.style('padding', '0 8px');
  accountInput.attribute('placeholder', '請輸入數字 123');

  passwordInput = createInput('', 'password');
  passwordInput.position(width / 2 - 100, height / 2);
  passwordInput.size(200, 32);
  passwordInput.style('font-size', '16px');
  passwordInput.style('border-radius', '8px');
  passwordInput.style('border', '1px solid #ccc');
  passwordInput.style('padding', '0 8px');
  passwordInput.attribute('placeholder', '請輸入數字 123');

  loginButton = createButton('登入 🔐');
  loginButton.position(width / 2 - 60, height / 2 + 60);
  loginButton.size(120, 40);
  loginButton.style('font-size', '16px');
  loginButton.style('font-weight', 'bold');
  loginButton.style('background-color', '#4b96eb');
  loginButton.style('color', '#fff');
  loginButton.style('border', 'none');
  loginButton.style('border-radius', '20px');
  loginButton.style('cursor', 'pointer');
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
  scribbleLayer.clear();
  pencilLayer.clear();
  templateLayer.clear();
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
  objectX = width / 2; 
  
  targetPoints = [];
  userCoveredPoints = 0;
  outOfBoundsCount = 0;
  errorFlashFrameStart = 0; 
}

// 🛠️ 【修復核心一】生成判定範本點：採用完全同步的固定字距步長，防重疊、防歪掉
function generateTemplatePoints() {
  templateLayer.clear();
  templateLayer.textAlign(LEFT, BASELINE); 
  templateLayer.textStyle(BOLD);
  templateLayer.fill(255, 0, 0); // 判定使用純紅底色
  templateLayer.noStroke();
  
  let lineYStart = 320; 
  let targetRedDashY = (lineYStart + 180) - 60; 
  let data = wordData[currentLetter];
  let chars = data.word.toLowerCase().split("");
  
  // 與渲染層尺寸與間距完全一致
  let tSize = chars.length > 4 ? 75 : 90;
  let stepX = chars.length > 4 ? 80 : 110; 
  let startX = width / 2 + 60; // 統一邊距起點
  
  templateLayer.textSize(tSize);
  
  // 在隱藏畫布中逐字印出紅色範本
  for (let i = 0; i < chars.length; i++) {
    templateLayer.text(chars[i], startX + (i * stepX), targetRedDashY);
  }
  
  targetPoints = [];
  templateLayer.loadPixels();
  
  let scanYStart = targetRedDashY - 120;
  let scanYEnd = targetRedDashY + 60;
  let scanXStart = startX - 20; // 從第一個字左側 20 像素開始掃描，確保抓滿所有筆畫
  
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
    textStyle(BOLD);
    text(fl.char, fl.x, fl.y);
    pop();
  }

  push();
  textSize(44);
  textStyle(BOLD);
  fill(90, 105, 120);
  text("English ABC Adventure", width / 2, height / 2 - 160);
  textSize(20);
  textStyle(NORMAL);
  fill(130, 140, 150);
  text("請在下方欄位輸入「123」解鎖字母冒險！", width / 2, height / 2 - 120);
  pop();

  push();
  textSize(16);
  textStyle(BOLD);
  fill(80, 90, 100);
  textAlign(RIGHT, CENTER);
  text("帳號：", width / 2 - 110, height / 2 - 44);
  text("密碼：", width / 2 - 110, height / 2 + 16);
  pop();

  if (loginErrorMessage !== "") {
    push();
    textSize(14);
    textStyle(BOLD);
    fill(235, 75, 75);
    text(loginErrorMessage, width / 2, height / 2 + 130);
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
    textStyle(BOLD);
    text(fl.char, fl.x, fl.y);
    pop();
  }
  
  push();
  textSize(110);
  textStyle(BOLD);
  
  fill(220, 230, 245); text("A", width/2 - 145, 185);
  fill(255, 110, 110); text("A", width/2 - 150, 180);
  
  fill(220, 230, 245); text("B", width/2, 185);
  fill(255, 215, 80); text("B", width/2, 180);
  
  fill(220, 230, 245); text("C", width/2 + 145, 185);
  fill(90, 190, 240); text("C", width/2 + 150, 180);
  pop();

  fill(90, 105, 120);
  textSize(24);
  textStyle(BOLD);
  text("English ABC Adventure", width / 2, 275);
  
  let unlockedCount = getUnlockedCount();
  let isAnyUnlocked = unlockedCount > 0;
  
  push();
  translate(width / 2, height / 2 + 10);
  
  if (isAnyUnlocked) {
    let glowSize = map(unlockedCount, 0, 26, 120, 260);
    let pulse = sin(frameCount * 0.05) * 10;
    noStroke();
    fill(255, 235, 130, 40 + pulse);
    ellipse(0, -30, glowSize + 30);
    fill(255, 235, 130, 25);
    ellipse(0, -30, glowSize + 80);
  }
  
  if (isAnyUnlocked) {
    fill(255, 240, 150);
    stroke(245, 180, 40);
  } else {
    fill(235, 238, 242);
    stroke(170, 180, 190);
  }
  strokeWeight(5);
  ellipse(0, -30, 120, 120);
  
  rectMode(CENTER);
  fill(180, 185, 195);
  stroke(130, 135, 145);
  strokeWeight(3);
  rect(0, 35, 46, 16, 4);
  rect(0, 49, 32, 12, 3);
  fill(100);
  noStroke();
  ellipse(0, 57, 16, 6);
  
  fill(isAnyUnlocked ? color(180, 90, 0) : color(110, 120, 130));
  textSize(28);
  textStyle(BOLD);
  text(unlockedCount + " / 26", 0, -30);
  pop();
  
  fill(100, 115, 130);
  textSize(16);
  textStyle(NORMAL);
  text("精通進度：已點亮 " + unlockedCount + " 個關卡小燈泡", width / 2, height / 2 + 120);
  
  rectMode(CENTER);
  fill(220, 225, 232);
  noStroke();
  rect(width / 2, height / 2 + 145, 300, 14, 7);
  if (unlockedCount > 0) {
    rectMode(CORNER);
    fill(75, 200, 115);
    let progressWidth = map(unlockedCount, 0, 26, 0, 300);
    rect(width / 2 - 150, height / 2 + 138, progressWidth, 14, 7);
  }
  
  push();
  rectMode(CENTER);
  fill(0, 0, 0, 15);
  rect(width / 2, height / 2 + 234, 220, 54, 27);
  
  fill(255, 95, 100);
  noStroke();
  rect(width / 2, height / 2 + 230, 220, 54, 27);
  
  fill(255);
  textSize(22);
  textStyle(BOLD);
  text("START   🚀", width / 2, height / 2 + 230);
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
  noStroke(); textSize(34); textStyle(BOLD);
  if (isAllClear) {
    text("🎉 AMAZING! YOU DID IT! 🎆", width / 2, 60);
    textSize(18); textStyle(NORMAL); fill(255, 215, 0);
    text("🌟 恭喜點亮整片星空！你完成了所有字母挑戰 🌟", width / 2, 105);
  } else {
    text("✏️ 冒險地圖：字母小燈泡 💡", width / 2, 60);
    textSize(17); textStyle(NORMAL); fill(120);
    text("⌨️ 請敲擊外接鍵盤 [ A - Z ] 進入關卡，點亮屬於你的英文星空！", width / 2, 105);
  }
  
  push();
  rectMode(CENTER);
  fill(255);
  stroke(210);
  strokeWeight(1.5);
  rect(100, 60, 130, 40, 10);
  fill(70);
  noStroke();
  textSize(14);
  textStyle(BOLD);
  text("🏠 回主畫面", 100, 60);
  pop();
  
  for (let i = 0; i < levelPositions.length; i++) {
    let pos = levelPositions[i];
    drawCrayonBulb(pos.x, pos.y, pos.letter, unlockedLevels[pos.letter]);
  }

  if (isAllClear) {
    rectMode(CENTER); fill(255, 70, 70); noStroke(); rect(width - 100, 60, 120, 40, 10);
    fill(255); textSize(14); textStyle(BOLD); text("重玩 🔄", width - 100, 60);
  }
}

function drawCrayonBulb(x, y, letter, isUnlocked) {
  push(); translate(x, y);
  if (isUnlocked) {
    fill(255, 230, 100); 
  } else {
    noFill();            
  }
  stroke(isUnlocked ? [235, 160, 0] : [130, 130, 130]); 
  strokeWeight(3);
  ellipse(0, -5, 48, 48); 
  rectMode(CENTER); 
  fill(isUnlocked ? 240 : 140); 
  stroke(100); 
  strokeWeight(1.5);
  rect(0, 21, 18, 8, 2); 
  rect(0, 27, 12, 5, 1);
  fill(isUnlocked ? [200, 80, 0] : [110]); 
  noStroke(); 
  textSize(22); 
  textStyle(BOLD);
  text(letter, 0, -5);
  pop();
}

// 🛠️ 【修復核心二】渲染畫面：與判定層完美對齊，字母固定前進，絕不重疊
function drawGameScreen() {
  rectMode(CORNER); noStroke();
  
  fill(30, 35, 45); rect(0, 80, width / 2, height - 80); 
  fill(255); rect(width / 2, 80, width / 2, height - 80); 
  
  stroke(210, 225, 240); strokeWeight(2);
  let lineYStart = 320; 
  
  // 繪製兩組英文四線格
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
    push(); fill(255, 255, 255, 8); noStroke(); textSize(360); textStyle(BOLD);
    text(currentLetter, width / 4, height / 2 + 40); pop();
  }

  push();
  noStroke(); 
  textStyle(BOLD); 
  
  if (isPencilChecked && !isWritingCorrect) {
    let elapsedFrames = frameCount - errorFlashFrameStart;
    let flashPeriod = 20; 
    
    if (elapsedFrames < flashPeriod * 4) {
      let currentCycle = Math.floor(elapsedFrames / flashPeriod);
      if (currentCycle % 2 === 0) {
        stroke(235, 75, 75, 220); 
        strokeWeight(5);
      } else {
        noStroke();
      }
    } else {
      stroke(235, 75, 75, 60);
      strokeWeight(3);
    }
  } else {
    fill(225, 228, 232); 
  }
  
  // 使用 BASELINE 基準對齊
  textAlign(LEFT, BASELINE); 

  if (!isLevelCompleted) {
    let firstRedDashY = lineYStart - 60;
    textSize(130); text(currentLetter, width / 2 + 60, firstRedDashY);
    textSize(100); text(currentLetter.toLowerCase(), width / 2 + 220, firstRedDashY);
  } else {
    // 點亮後的單字灰色範本：排版數據與 generateTemplatePoints 完美一致
    let secondRedDashY = (lineYStart + 180) - 60; 
    let data = wordData[currentLetter];
    let chars = data.word.toLowerCase().split("");
    
    let tSize = chars.length > 4 ? 75 : 90;
    let stepX = chars.length > 4 ? 80 : 110; 
    let startX = width / 2 + 60; 
    
    textSize(tSize); 
    for (let i = 0; i < chars.length; i++) {
      text(chars[i], startX + (i * stepX), secondRedDashY);
    }
  }
  pop();

  if (mouseIsPressed) {
    if (mouseX < 850 || mouseY > 220) {
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
            scribbleLayer.push();
            scribbleLayer.drawingContext.globalCompositeOperation = 'destination-out';
            scribbleLayer.stroke(255); scribbleLayer.strokeWeight(40);
            scribbleLayer.line(pmouseX, pmouseY, mouseX, mouseY);
            scribbleLayer.pop();
          }
        }
      }
      
      if (mouseX > width / 2 && mouseX < width && mouseY > 80 && mouseY < height) {
        if (currentTool === "PEN") {
          pencilLayer.stroke(50, 60, 70, 240); pencilLayer.strokeWeight(5); 
          pencilLayer.line(pmouseX + random(-0.5,0.5), pmouseY + random(-0.5,0.5), mouseX, mouseY);
          
          if (isLevelCompleted && targetPoints.length > 0) {
            let hitTarget = false;
            for (let p of targetPoints) {
              if (!p.covered) {
                let d = dist(mouseX, mouseY, p.x, p.y);
                if (d < 18) { 
                  p.covered = true;
                  userCoveredPoints++;
                  hitTarget = true;
                }
              } else {
                if (dist(mouseX, mouseY, p.x, p.y) < 18) hitTarget = true;
              }
            }
            let secondRedDashY = (lineYStart + 180) - 60;
            if (!hitTarget && mouseY > (secondRedDashY - 100) && mouseY < (secondRedDashY + 40)) {
              outOfBoundsCount++;
            }
          }
        } else if (currentTool === "ERASER") {
          pencilLayer.push();
          pencilLayer.drawingContext.globalCompositeOperation = 'destination-out';
          pencilLayer.stroke(255); pencilLayer.strokeWeight(40);
          pencilLayer.line(pmouseX, pmouseY, mouseX, mouseY);
          pencilLayer.pop();
          
          if (isLevelCompleted) {
            userCoveredPoints = 0;
            outOfBoundsCount = 0;
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
    rect(objectX, height / 2 + 20, 360, 390, 20);
    
    translate(objectX, height / 2 - 40);
    let currentData = wordData[currentLetter];
    if (currentData && currentData.draw) currentData.draw(objectAlpha);
    
    noStroke(); 
    fill(40, 45, 55, objectAlpha); textSize(44); textStyle(BOLD);
    text(currentData.word, 0, 125);
    fill(235, 75, 75, objectAlpha); textSize(32); 
    text(currentData.ch, 0, 175);
    fill(120, 130, 140, objectAlpha); textSize(18); textStyle(NORMAL);
    text(currentData.spell, 0, 215);
    pop();
  }
  
  if (isPencilChecked && praiseTimer > 0) {
    praiseTimer--;
    push();
    noStroke(); 
    if (isWritingCorrect) {
      fill(40, 180, 100, map(praiseTimer, 0, 30, 0, 255)); 
      textSize(42); textStyle(BOLD);
      text(praiseText, width * 0.75, height / 2);
    } else {
      fill(235, 75, 75, map(praiseTimer, 0, 30, 0, 255)); 
      textSize(32); textStyle(BOLD);
      text(praiseText, width * 0.75, height / 2 - 20);
      textSize(16); textStyle(NORMAL); fill(100, map(praiseTimer, 0, 30, 0, 255));
      text("💡 提示：要把灰色單字都描滿，且不能亂塗鴉唷！", width * 0.75, height / 2 + 25);
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
  fill(currentTool === "PEN" ? 255 : 60); noStroke(); textSize(15); textStyle(BOLD);
  text("✏️ 畫筆模式", width - 80, 125);
  
  if (currentTool === "ERASER") {
    fill(240, 110, 110); stroke(180, 60, 60); strokeWeight(3);
  } else {
    fill(255); stroke(220); strokeWeight(1.5);
  }
  rect(width - 80, 180, 130, 44, 12);
  fill(currentTool === "ERASER" ? 255 : 60); noStroke(); textSize(15); textStyle(BOLD);
  text("🧽 橡皮擦", width - 80, 180);
  pop();

  push(); noStroke(); fill(242, 240, 234); rect(0, 0, width, 80);
  fill(70); textSize(18); textStyle(BOLD); text("🎨 Level " + currentLetter + ": 互動練習", 120, 40);
  
  if (!isLevelCompleted) {
    fill(210, 80, 80); textSize(14);
    text("左區摸黑塗鴉 ｜ 右區用 Pencil 練習 💡 寫完請按實體鍵盤 [ " + currentLetter + " ] 鍵喚醒！", width / 2 - 40, 40);
  } else {
    if (unlockedLevels[currentLetter]) {
      fill(40, 150, 85); textSize(14);
      text("🎉 太棒了！本關卡挑戰成功，解鎖主選單小燈泡！", width / 2 - 40, 40);
    } else {
      fill(225, 140, 20); textSize(14);
      text("請拿Apple Pencil描寫右側完整單字」", width / 2 - 40, 40);
    }
  }
  
  rectMode(CENTER); fill(255); stroke(200); strokeWeight(2); 
  rect(920, 40, 150, 44, 12); 
  fill(50); noStroke(); textSize(15); textStyle(BOLD); text("返回地圖 🗺️", 920, 40);

  if (isLevelCompleted) {
    fill(255, 235, 50); stroke(220, 180, 0); strokeWeight(2);
    rect(730, 40, 140, 44, 12);
    fill(50); noStroke(); textSize(15); textStyle(BOLD); text("檢查寫字 🔍", 730, 40);
  }
  pop();
}

function mousePressed() {
  if (currentScreen === "LOGIN") return;

  if (currentScreen === "HOME") {
    if (mouseX > width / 2 - 110 && mouseX < width / 2 + 110 &&
        mouseY > height / 2 + 203 && mouseY < height / 2 + 257) {
      currentScreen = "MENU";
    }
    return;
  }

  if (currentScreen === "MENU") {
    if (mouseX > 35 && mouseX < 165 && mouseY > 40 && mouseY < 80) {
      currentScreen = "HOME";
      return;
    }

    if (checkAllUnlocked() && mouseX > width - 160 && mouseX < width - 40 && mouseY > 40 && mouseY < 80) {
      for (let i = 0; i < letters.length; i++) unlockedLevels[letters[i]] = false;
      fireworks = [];
      return;
    }
  }
  
  if (currentScreen !== "MENU" && currentScreen !== "HOME") {
    if (mouseX > 845 && mouseX < 995 && mouseY > 18 && mouseY < 62) {
      currentScreen = "MENU";
      return;
    }
    
    if (isLevelCompleted && mouseX > 660 && mouseX < 800 && mouseY > 18 && mouseY < 62) {
      isPencilChecked = true;
      praiseTimer = 180; 
      
      let totalTarget = targetPoints.length;
      let coverPercent = totalTarget > 0 ? (userCoveredPoints / totalTarget) : 0;
      
      if (coverPercent >= 0.65 && outOfBoundsCount < totalTarget * 0.8) {
        isWritingCorrect = true;
        unlockedLevels[currentLetter] = true; 
        praiseText = "答對了！🎉 GOOD JOB!";
        playCorrectSound(); 
      } else {
        isWritingCorrect = false;
        praiseText = "❌ 哎呀，再寫得精準一點點！";
        errorFlashFrameStart = frameCount; 
        playErrorSound();
      }
      return;
    }
    
    if (mouseX > width - 145 && mouseX < width - 15 && mouseY > 103 && mouseY < 147) {
      currentTool = "PEN";
      return;
    }
    if (mouseX > width - 145 && mouseX < width - 15 && mouseY > 158 && mouseY < 202) {
      currentTool = "ERASER";
      return;
    }
  }
}

function playCorrectSound() {
  let ctx = new (window.AudioContext || window.webkitAudioContext)();
  let osc1 = ctx.createOscillator(); let gain1 = ctx.createGain();
  osc1.type = 'sine'; osc1.frequency.setValueAtTime(523.25, ctx.currentTime); 
  gain1.gain.setValueAtTime(0.3, ctx.currentTime);
  gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
  osc1.connect(gain1); gain1.connect(ctx.destination);
  osc1.start(); osc1.stop(ctx.currentTime + 0.15);
  
  let osc2 = ctx.createOscillator(); let gain2 = ctx.createGain();
  osc2.type = 'sine'; osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); 
  gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.08);
  gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
  osc2.connect(gain2); gain2.connect(ctx.destination);
  osc2.start(ctx.currentTime + 0.08); osc2.stop(ctx.currentTime + 0.3);
}

function playErrorSound() {
  let ctx = new (window.AudioContext || window.webkitAudioContext)();
  let osc = ctx.createOscillator(); let gain = ctx.createGain();
  osc.type = 'sawtooth'; osc.frequency.setValueAtTime(180, ctx.currentTime);
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.25);
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(); osc.stop(ctx.currentTime + 0.25);
}

function speakWord(letter) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    let data = wordData[letter];
    let utteranceEng = new SpeechSynthesisUtterance(data.word + ". " + data.spell.replace(/-/g, "") + ".");
    utteranceEng.lang = 'en-US'; utteranceEng.pitch = 1.35; utteranceEng.rate = 0.8;
    
    let utteranceCh = new SpeechSynthesisUtterance(data.ch);
    utteranceCh.lang = 'zh-TW'; utteranceCh.pitch = 1.2; utteranceCh.rate = 0.9;
    
    window.speechSynthesis.speak(utteranceEng);
    window.speechSynthesis.speak(utteranceCh);
  }
}

function keyPressed() {
  let keyUpper = key.toUpperCase(); 
  
  // 【新增這段】：檢查對照表，如果玩家按了 Q，就把 keyUpper 變成 A
  if (KEY_MAP[keyUpper]) {
    keyUpper = KEY_MAP[keyUpper]; 
  }
    
  // 1. 主選單階段
  if (currentScreen === "MENU") {
    if (letters.includes(keyUpper)) {
      initLevel(keyUpper); // 按下 Q，這裡收到的會是 'A'，順利進入 A 關卡！
    }
  } 
  
  // 2. 練習進行中
  if (currentScreen === "GAME_" + currentLetter && keyUpper === currentLetter && !isLevelCompleted) {
    isLevelCompleted = true;
    generateTemplatePoints(); 
    speakWord(currentLetter); 
  }
  
  // 3. 退出
  if (keyCode === ESCAPE) {
    currentScreen = "MENU";
  }
}

class Firework {
  constructor(x, y, targetX, targetY) {
    this.x = x; this.y = y; this.targetY = targetY; this.exploded = false; this.particles = []; this.speed = random(6, 10);
    this.col = color(random(150, 255), random(150, 255), random(150, 255));
  }
  update() {
    if (!this.exploded) {
      this.y -= this.speed;
      if (this.y <= this.targetY) { this.exploded = true; this.explode(); }
    } else {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        this.particles[i].update(); if (this.particles[i].alpha <= 0) this.particles.splice(i, 1);
      }
    }
  }
  explode() {
    let count = random(30, 50);
    for (let i = 0; i < count; i++) {
      let angle = random(TWO_PI); let speed = random(1, 5); this.particles.push(new Particle(this.x, this.y, angle, speed, this.col));
    }
  }
  show() {
    if (!this.exploded) {
      stroke(this.col); strokeWeight(random(3, 5)); line(this.x, this.y, this.x, this.y + 10);
    } else {
      for (let p of this.particles) p.show();
    }
  }
  done() { return this.exploded && this.particles.length === 0; }
}

class Particle {
  constructor(x, y, angle, speed, col) {
    this.x = x; this.y = y; this.vx = cos(angle) * speed; this.vy = sin(angle) * speed; this.col = col; this.alpha = 255; this.gravity = 0.08; this.w = random(2, 5);
  }
  update() { this.x += this.vx; this.y += this.vy; this.vy += this.gravity; this.alpha -= 4; }
  show() { push(); noStroke(); fill(red(this.col), green(this.col), blue(this.col), this.alpha); ellipse(this.x, this.y, this.w); pop(); }
}

function drawAnt(a) { fill(80, a); noStroke(); ellipse(-25, 0, 35, 35); ellipse(0, -5, 30, 30); ellipse(25, -10, 45, 40); stroke(80, a); strokeWeight(3); line(-10, 5, -15, 25); line(5, 5, 10, 25); }
function drawBus(a) { fill(245, 200, 50, a); noStroke(); rect(-10, -10, 200, 90, 8); fill(50, a); ellipse(-40, 35, 28, 28); ellipse(40, 35, 28, 28); fill(200, 230, 255, a); rect(40, -30, 35, 25, 3);rect(-55, -30, 35, 25, 3); rect(-10, -30, 35, 25, 3); }
function drawCat(a) { fill(200, a); noStroke(); ellipse(0, 10, 130, 110); triangle(-50, -60, -20, -10, -55, 10); triangle(50, -60, 20, -10, 55, 10); fill(50, a); ellipse(-20, 0, 12, 12); ellipse(20, 0, 12, 12); fill(240, 130, 130, a); triangle(0, 15, -8, 8, 8, 8); }
function drawDog(a) { fill(160, 110, 70, a); noStroke(); ellipse(0, 0, 120, 120); fill(100, 70, 40, a); ellipse(-55, 0, 40, 80); ellipse(55, 0, 40, 80); fill(0, a); ellipse(-20, -10, 14, 14); ellipse(20, -10, 14, 14); ellipse(0, 15, 25, 15); }
function drawEgg(a) { fill(245, 235, 220, a); stroke(220, 200, 180, a); strokeWeight(2); ellipse(0, 0, 110, 150); }
function drawFox(a) { noStroke(); fill(235, 110, 40, a); triangle(-45, -55, -15, -20, -50, -10);triangle(45, -55, 15, -20, 50, -10);triangle(-55, -10, 55, -10, 0, 45);ellipse(0, -15, 110, 90); fill(0, a); ellipse(-22, -15, 11, 11);ellipse(22, -15, 11, 11); ellipse(0, 42, 16, 16); }
function drawGum(a) { fill(240, 120, 160, a); noStroke(); ellipse(0, 0, 100, 100); quad(-70, -20, -50, 0, -70, 20, -80, 0); quad(70, -20, 50, 0, 70, 20, 80, 0); }
function drawHat(a) { push(); rectMode(CENTER); noStroke(); fill(65, 105, 225, a); rect(0, -20, 110, 80, 10, 10, 0, 0); fill(235, 75, 75, a); rect(0, 12, 112, 15); fill(50, 85, 200, a); ellipse(0, 20, 170, 30); pop(); }
function drawIce(a) { push(); rectMode(CENTER); noStroke(); fill(180, 225, 255, a); rect(0, 0, 110, 110, 20); fill(255, 255, 255, a * 0.4); quad(-40, -40, 15, -40, -10, -10, -40, -10); pop(); }
function drawJam(a) { push(); rectMode(CENTER); noStroke(); fill(210, 45, 80, a); rect(0, 15, 90, 100, 15); fill(180, 185, 190, a); rect(0, -40, 100, 20, 5); fill(245, 240, 220, a); rect(0, 15, 65, 45, 4); fill(210, 45, 80, a); ellipse(0, 15, 15, 18); pop(); }
function drawKey(a) { push(); noFill(); stroke(220, 180, 40, a); strokeWeight(8); strokeJoin(ROUND); ellipse(-35, 0, 50, 50); line(-10, 0, 65, 0); line(40, 0, 40, 22); line(55, 0, 55, 22); pop(); }
function drawLog(a) { push(); rectMode(CENTER); noStroke(); fill(125, 80, 45, a); rect(0, 0, 150, 60, 4); fill(95, 60, 35, a); rect(0, 20, 150, 15, 0, 0, 4, 4); fill(155, 115, 75, a); ellipse(-75, 0, 25, 60); fill(200, 160, 115, a); ellipse(75, 0, 25, 60); noFill(); stroke(145, 105, 70, a); strokeWeight(2); ellipse(75, 0, 14, 38); pop(); }
function drawMud(a) { fill(95, 65, 40, a); noStroke(); ellipse(-30, 20, 90, 50); ellipse(30, 15, 100, 60); }
function drawNut(a) { fill(180, 130, 80, a); noStroke(); ellipse(0, 10, 100, 100); fill(130, 90, 50, a); arc(0, -10, 106, 60, PI, TWO_PI); }
function drawOwl(a) { fill(130, 90, 60, a); noStroke(); ellipse(0, 10, 110, 120); fill(255, a); ellipse(-22, -15, 40, 40); ellipse(22, -15, 40, 40); fill(0, a); ellipse(-22, -15, 12, 12); ellipse(22, -15, 12, 12); fill(240, 150, 40, a); triangle(0, 0, -8, -10, 8, -10); }
function drawPig(a) { push(); noStroke(); fill(255, 192, 203, a); ellipse(0, 0, 130, 120); fill(50, a); ellipse(-25, -15, 12, 12); ellipse(25, -15, 12, 12); fill(255, 150, 170, a); ellipse(0, 15, 50, 35); fill(50, a); ellipse(-10, 15, 6, 8); ellipse(10, 15, 6, 8); pop(); }
function drawQueen(a) { push(); rectMode(CENTER); noStroke(); fill(45, 45, 50, a); ellipse(0, -15, 125, 125); ellipse(-55, 25, 35, 35); ellipse(55, 25, 35, 35); fill(250, 210, 175, a); ellipse(0, 20, 100, 95); fill(240, 130, 130, a * 0.7); ellipse(-25, 25, 16, 10); ellipse(25, 25, 16, 10); fill(60, a); ellipse(-20, 15, 8, 8); ellipse(20, 15, 8, 8); stroke(225, 90, 90, a); strokeWeight(3); noFill(); arc(0, 32, 16, 10, 0, PI); noStroke(); fill(255, 215, 0, a); beginShape(); vertex(-45, -25); vertex(-55, -60); vertex(-20, -42); vertex(0, -75); vertex(20, -42); vertex(55, -60); vertex(45, -25); endShape(CLOSE); fill(235, 50, 50, a); ellipse(0, -75, 10, 10); ellipse(-55, -60, 8, 8); ellipse(55, -60, 8, 8); pop(); }
function drawRed(a) { push();rectMode(CENTER); noStroke(); fill(240, 40, 40, a); rect(0, 0, 120, 120, 15); pop(); }
function drawSun(a) { fill(255, 80, 80, a); noStroke(); ellipse(0, 0, 110, 110); }
function drawToy(a) { push(); rectMode(CENTER); noStroke(); fill(120, 130, 140, a); rect(0, -55, 6, 20);  fill(255, 90, 95, a); ellipse(0, -68, 16, 16);  fill(100, 110, 120, a); rect(-55, 0, 15, 30, 3);  rect(55, 0, 15, 30, 3);   fill(100, 160, 240, a);  rect(0, 0, 100, 90, 15);  fill(255, a); ellipse(-22, -10, 26, 26); ellipse(22, -10, 26, 26);  fill(30, 60, 120, a);ellipse(-22, -10, 12, 12); ellipse(22, -10, 12, 12);  fill(255, 220, 100, a); rect(0, 24, 50, 14, 4); stroke(180, 140, 30, a); strokeWeight(2); line(-13, 24, 13, 24); line(-5, 18, -5, 30) ; line(5, 18, 5, 30); pop(); }
function drawUFO(a) { fill(160, 170, 180, a); noStroke(); ellipse(0, 10, 140, 45); fill(130, 220, 255, a * 0.7); ellipse(0, -10, 70, 40); }
function drawVan(a) { push(); rectMode(CENTER); noStroke();fill(50, 50, 55, a);  ellipse(-40, 30, 28, 28);  ellipse(40, 30, 28, 28);  fill(220, a); ellipse(-40, 30, 12, 12);  ellipse(40, 30, 12, 12); fill(100, 180, 160, a);  rect(0, -5, 130, 60, 8);  rect(45, 5, 40, 40, 0, 8, 4, 0); fill(210, 235, 255, a);  rect(40, -12, 25, 18, 0, 6, 0, 0); rect(0, -12, 35, 18, 2);       fill(255, 230, 100, a); rect(62, 12, 6, 10, 2);fill(160, 165, 170, a);rect(62, 22, 8, 5, 2);pop(); }
function drawWeb(a) { push(); stroke(110, 125, 140, a); strokeWeight(2.5); noFill(); let r = 65; for (let i = 0; i < 8; i++) { let angle = TWO_PI / 8 * i; let x = cos(angle) * r; let y = sin(angle) * r; line(0, 0, x, y); } for (let level = 1; level <= 3; level++) { let currentR = r * (level / 3); beginShape(); for (let i = 0; i <= 8; i++) { let angle = TWO_PI / 8 * i; let x = cos(angle) * currentR; let y = sin(angle) * currentR; vertex(x, y); } endShape(); } pop(); }
function drawBoxObj(a) {  push(); rectMode(CENTER); noStroke(); fill(175, 115, 70, a); rect(0, 5, 110, 80, 4); fill(210, 150, 100, a); rect(0, 0, 110, 80, 4); fill(235, 190, 120, a);rect(0, 0, 25, 80);stroke(160, 110, 70, a); strokeWeight(2);line(-55, -10, 55, -10); pop(); }
function drawYoyo(a) { fill(150, 90, 220, a); noStroke(); ellipse(-15, 0, 50, 120); ellipse(15, 0, 50, 120); stroke(255, a); strokeWeight(4); line(0, -60, 0, 0); }
function drawZoo(a) { push(); rectMode(CENTER); noStroke(); fill(140, 145, 150, a); rect(0, 35, 160, 20, 4); fill(110, 115, 120, a); rect(-65, 0, 30, 70, 4); rect(65, 0, 30, 70, 4); fill(255, 215, 0, a); ellipse(-65, -40, 14, 14); ellipse(65, -40, 14, 14); stroke(200, 205, 210, a); strokeWeight(4); for (let x = -40; x <= 40; x += 20) { line(x, -35, x, 35); } pop(); }


