var game,
    x = 0,
    y = 0,
    dragSrcEl = null;

window.onload = function () {
  var puzzle = document.getElementById('game-field'),
      example = document.getElementById('main-img');
  game = new GameLevel();
  game.newLvl();
  document.getElementById('check-btn').onclick = function() {
    findDiff(example, puzzle);
  }
}

function GameLevel(level) {
  this.level = level || 1;
  this.active = true;
  this.img = document.getElementById('main-img');
  this.field = document.getElementById('game-field');
  this.parts = this.level + 1;
  this.allParts = Math.pow(this.parts, 2)*2;
  this.imgList = [];
  window.x = window.y = this.field.offsetHeight / this.parts / 2;
}
GameLevel.prototype.clearPuzzles = function() {
  document.getElementById("game-parts").innerHTML = "";
  document.getElementById("game-field").innerHTML = "";
}
GameLevel.prototype.changeImg = function() {
  this.img.src = this.img.src.replace(/img-\d/, "img-" + this.level);
}
GameLevel.prototype.changeText = function() {
  document.getElementById('lvl').innerHTML = this.level;
  document.getElementById('counter').innerHTML = this.allParts;
  document.getElementById('percent').innerHTML = "0%";
}
GameLevel.prototype.cropImg = function() {
  var imgId = 0,
      x = 0,
      y = 0,
      w;
  if (this.level == 2) {
    for (var i = 0; i < 4; i++) {
      y = 100 * i;
      for (var j = 0; j < 5; j++) {
        x = 160 * j,
        w = 160,
        h = 100;
        this.imgList[imgId] = new Img(x, y, w, h, this.img.src);
        this.imgList[imgId].dom.setAttribute('id', imgId);
        imgId++;
      }
    }
    this.allParts = 20;
  } else {
    for (var i = 0; i < this.parts; i++) {
      y = this.field.offsetHeight / this.parts * i;
      for (var j = 0; j < this.parts*2; j++) {
        x = this.field.offsetWidth / this.parts / 2 * j,
        w = this.field.offsetHeight / this.parts;
        this.imgList[imgId] = new Img(x, y, w, w, this.img.src);
        this.imgList[imgId].dom.setAttribute('id', imgId);
        imgId++;
      }
    }
  }
  // this.imgList.shuffle();
  for (i = 0; i < this.imgList.length; i++) {
    document.getElementById('game-parts').appendChild(this.imgList[i].dom);
  }
}
GameLevel.prototype.newLvl = function() {
  var gl = this;
  this.changeImg();
  this.img.onload = function() {
    gl.clearPuzzles();
    gl.cropImg();
    gl.changeText();
  }
}

function Img(x, y, width, height, img) {
  var fieldPart = document.createElement('div');
  fieldPart.style.width = width + "px";
  fieldPart.style.height = height + "px";
  document.getElementById('game-field').appendChild(fieldPart);

  this.dom = document.createElement('div');
  this.dom.style.width = width + "px";
  this.dom.style.height = height + "px";
  this.dom.style.backgroundImage = "url(" + img + ")";
  this.dom.style.backgroundPosition = -x + "px " + -y + "px";

  this.dom.setAttribute('draggable', 'true');
  this.dom.setAttribute('ondragstart', 'return dragStart(event)');
  fieldPart.setAttribute('ondragenter', 'return dragEnter(event)');
  fieldPart.setAttribute('ondrop', 'return dragDrop(event)');
  fieldPart.setAttribute('ondragover', 'return dragOver(event)');
}

function dragStart(ev) {
   window.dragSrcEl = ev.target;
   ev.dataTransfer.effectAllowed = 'move';
   ev.dataTransfer.setData("Text", ev.target.getAttribute('id'));
   ev.dataTransfer.setDragImage(ev.target, x, y);
   return true;
}
function dragEnter(ev) {
   ev.preventDefault();
   return true;
}
function dragOver(ev) {
   ev.preventDefault();
}
function dragDrop(ev) {
   var data = ev.dataTransfer.getData("Text"),
       dragParent = window.dragSrcEl.parentNode,
       evParent = ev.target.parentNode;
   if (window.dragSrcEl.getAttribute('ondragstart') == ev.target.getAttribute('ondragstart')) {
     dragParent.appendChild(ev.target);
     evParent.appendChild(window.dragSrcEl);
  } else {
    ev.target.appendChild(window.dragSrcEl);
  }
   ev.stopPropagation();
   return false;
}

function findDiff(example, puzzle) {
  var file1,
      file2,
      img = new Image(),
      resultImg = new Image(),
      contentType = 'image/png';
  // обрабатываем картинку-пример
  img.src = example.src;
  file1 = toCanvas(img);
  file1 = canvasToB64(file1);
  file1 = b64toBlob(file1, contentType);
  // фоткаем и обрабатываем пазл
  html2canvas(puzzle, {
  onrendered: function(canvas) {
    file2 = canvasToB64(canvas);
    file2 = b64toBlob(file2, contentType);
    // сравниваем и п
    compareAndResult(file1, file2);
    }
  });

}

function compareAndResult(file1, file2) {
  var percentField = document.getElementById("percent"),
      percent,
      color = "#000",
      resultImg = new Image();
      diff = resemble(file1).compareTo(file2).ignoreColors().onComplete(function(data) {
    // .ignoreAntialiasing()
  	resultImg.src = data.getImageDataUrl();

      // тестовая фигня
    // testImgInsert(resultImg);

    percent = 100 - Math.ceil(data.misMatchPercentage);
    if (game.level > 3 && document.getElementById('game-parts').innerHTML == "") {
      percent += 5;
      if (percent > 100) {
        percent = 100;
      }
    }
    changePercent(percentField, percent);
    return data;
  });
  return diff;
}

function testImgInsert(resultImg) {
  // тестовая фигня
  document.querySelector(".modal-test").innerHTML = "<p>Тестовое окно (смотреть на несовпадения картинок). </p><p>P.S. Перемешивание пазлов пока отключил.</p><p>P.P.S. Включил переход на следующий уровень при >0% (временно)</p><button class='modal-close'></button>";
  document.querySelector(".modal-test").appendChild(resultImg);
  closeButOpen(".modal-test");
  document.querySelector('#modal').classList.add('active');
  openModal();
}

function readyToNextLvl() {
  var nextLvlBtn = document.getElementById("next-lvl-btn");
  nextLvlBtn.classList.add("lvl-active");
  nextLvlBtn.removeAttribute("disabled");
  nextLvlBtn.onclick = function() { goToNextLvl(this) };
  // if (game.level == 3) {
  //   closeButOpen('.modal-f');
  //   document.querySelector('#modal').classList.add('active');
  // }
}

function disableReadyBtn() {
  var nextLvlBtn = document.getElementById("next-lvl-btn");
  nextLvlBtn.classList.remove("lvl-active");
  nextLvlBtn.setAttribute("disabled", "disabled");
  nextLvlBtn.onclick = "";
}
function goToNextLvl() {
  disableReadyBtn();
  game = new GameLevel(game.level + 1);
  game.newLvl();
  document.querySelector('#modal').classList.remove('active');
}

function startAgain() {
  disableReadyBtn();
  game = new GameLevel(1);
  game.newLvl();
  document.querySelector('#modal').classList.remove('active');
}

function changePercent(percentField, percent) {
  percentField.innerHTML = percent + "%";

  if (percent >= 0) {
    color = "#ff0000";
  }
  if (percent >= 30) {
    color = "#ffff00";
  }
  if (percent >= 60) {
    color = "#1E90FF";
  }
  if (percent >= 90) {
    color = "#00bb00";
    readyToNextLvl();
  }
  percentField.style.color = color;
}

function toCanvas(img) {
  var canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  canvas.getContext('2d').drawImage(img, 0,0);
  return canvas;
}

function canvasToB64(canvas) {
  var dataURL = canvas.toDataURL("image/jpg", 1);

  dataURL = dataURL.replace(/^data:image\/(png|jpg);base64,/, "");

  return dataURL;
}

function b64toBlob(b64Data, contentType, sliceSize) {
  contentType = contentType || '';
  sliceSize = sliceSize || 512;

  var byteCharacters = atob(b64Data);
  var byteArrays = [];

  for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    var slice = byteCharacters.slice(offset, offset + sliceSize);

    var byteNumbers = new Array(slice.length);
    for (var i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    var byteArray = new Uint8Array(byteNumbers);

    byteArrays.push(byteArray);
  }

  var blob = new Blob(byteArrays, {type: contentType});
  return blob;
}

function blobToDataURL(blob) {
  var reader = new FileReader();

  reader.onload = function() {
    reader.readAsDataURL(blob);
  }

  return blob;
}

Array.prototype.shuffle = function( b )
{
 var i = this.length, j, t;
 while( i )
 {
  j = Math.floor( ( i-- ) * Math.random() );
  t = b && typeof this[i].shuffle!=='undefined' ? this[i].shuffle() : this[i];
  this[i] = this[j];
  this[j] = t;
 }
 return this;
};

document.addEventListener('DOMContentLoaded', openModal, false);

document.addEventListener('DOMContentLoaded', function() {

  closeButOpen('.modal-1');
  document.querySelector('#modal').classList.add('active');

  [].forEach.call(document.querySelectorAll('.btn-next'), function(item) {
    item.addEventListener('click', function(event) {
      event.preventDefault();
      if (!event.target.hasAttribute("data-modal-number")) {
        document.querySelector("#modal").classList.remove("active");
      } else {
        var nextModal = ".modal-" + (parseInt(event.target.getAttribute("data-modal-number")) + 1);
        closeButOpen(nextModal);
      }
    });
  });

  [].forEach.call(document.querySelectorAll('.text-allotted'), function(item) {
    item.addEventListener('mouseover', function(event) {
      var target = event.target.getAttribute("data-target");
      document.querySelector(target).classList.add("allotted-element");
    });
    item.addEventListener('mouseout', function(event) {
      var target = event.target.getAttribute("data-target");
      document.querySelector(target).classList.remove("allotted-element");
    });
  });

}, false);

function closeButOpen(modal) {
  [].forEach.call(document.querySelectorAll('.modal-content'), function(item) {
    item.style.display = "none";
  });
  document.querySelector(modal).style.display = "";
}

function openModal() {
  [].forEach.call(document.querySelectorAll('.open, .modal-close'), function(item) {
    item.addEventListener('click', function(event) {
        event.preventDefault();
        document.querySelector('#modal').classList.toggle('active');
    });
  });
}
