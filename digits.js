const canvas = document.querySelector('#canvas');
canvas.width = 28
canvas.height = 28
const ctx = canvas.getContext('2d');

let coords = {
  x: 0,
  y: 0
}

document.addEventListener('mousedown', start);
document.addEventListener('mouseup', stop);

function start(e) {
  reposition(e);
  document.addEventListener('mousemove', draw);
}

function stop() {
  document.removeEventListener('mousemove', draw);
}


function draw(e) {
  ctx.beginPath();
  ctx.lineWidth = 2
  ctx.strokeColor = 'black'
  ctx.moveTo(coords.x, coords.y);
  reposition(e);
  ctx.lineTo(coords.x, coords.y);
  ctx.stroke();
  
}

function reposition(e) {
  const bounding = canvas.getBoundingClientRect();
  const x = Math.floor(((e.clientX - bounding.left) / bounding.width) * canvas.width);
  const y = Math.floor(((e.clientY - bounding.top) / bounding.height) * canvas.height);
  coords.x = x
  coords.y = y
}

document.querySelector('#btn-train').addEventListener('click', trainModel);

document.querySelector('#btn-clear').addEventListener('click', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  document.querySelector('#label-display').textContent = "#"
});

document.querySelector('#btn-guess').addEventListener('click', async () => {
  document.querySelector('#label-display').textContent = "#"
  const greyData = new Array(784).fill(0.0);
  const colorData = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  for (let i = 0; i < colorData.length; i += 4) {
    greyData[i / 4] = colorData[i + 3] / 255.0
  }
  nn.classify(greyData, classifyResult);
})

document.querySelector('#btn-save').addEventListener('click', async (e) => {
  nn.save("model")
})

document.querySelector('#btn-load').addEventListener('click', async (e) => {
  const modelInfo = {
    model: "model/model.json",
    metadata: "model/model_meta.json",
    weights: "model/model.weights.bin"
  }
  nn.load(modelInfo, () => {
    alert("Model Loaded.")
  })
})

document.querySelector('#btn-display').addEventListener('click', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  let index = Math.floor(Math.random() * data.length)
  let selectedData = data[index].image
  document.querySelector('#label-display').textContent = data[index].label
  for (let i = 0; i < selectedData.length; i++){
    imgData.data[i * 4 + 3] = selectedData[i]
  }
  ctx.putImageData(imgData, 0, 0);
})

/*
* Struktur des neuronalen Netzwerks.
*/
const nn = ml5.neuralNetwork({
  inputs: 784,
  outputs: 10,
  layers: [
    {
      type: 'dense',
      units: 128,
      activation: 'relu'
    }, {
      type: 'dense',
      units: 128,
      activation: 'relu'
    }, {
      type: 'dense',
      units: 10,
      activation: 'softmax'
    }
  ],
  task: 'classification',
  debug: true,
});

let data = []


// Daten laden und Netzwerk trainieren
async function trainModel() {
  await loadData()
  nn.train({epochs: 50}, finishedTraining);
}

// Daten laden
async function loadData() {
  data = await fetch('./mnist-medium.json')
    .then((response) => response.json())
  data.forEach((entry) => {
    nn.addData(entry.image.map(x => x / 255.), [`${entry.label}`]);
  })
}

// Bescheid geben wenn das Training abgeschlossen ist.
function finishedTraining() {
  alert("Fertig trainiert! Ziffern können jetzt erkannt werden.");
}


// Resultat vom Netzwerk anfragen
function classifyResult(error, res) {
  if (error) {
    console.log(error)
  }
  let label = 0
  let conf = 0
  res.forEach(entry => {
    if (entry.confidence > conf) {
      label = entry.label
      conf = entry.confidence
    }
  })
  document.querySelector("#prediction-number").textContent = label
  document.querySelector("#prediction-confidence").textContent = conf.toFixed(3)
}