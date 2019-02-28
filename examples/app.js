
let chunkCollection = new texturestore.ChunkCollection({
  maxSizeMegaByte: 500
})
console.log(chunkCollection)


let queueSetting = {
  priorityLevels: 4,
  concurentDownloads: 4
}

let barDivs = []
let labelDivs = []
for(let i=0; i<queueSetting.priorityLevels; i++){
  barDivs.push(document.getElementById(`bar-${i}`))
  labelDivs.push(document.getElementById(`label-${i}`))
}

console.log(barDivs)

let printer = document.getElementById('printer')
let bq = new bufferqueue.BufferQueue(queueSetting)

console.log(bq)

bq.on('added', function(url, priority){
  print(`File ${url} was just added to queue with priority ${priority}`)
  updateChart()
})

bq.on('removed', function(url){
  print(`File ${url} has been removed from queue`, 'warning')
  updateChart()
})

bq.on('reseted', function(){
  print(`The queue has been reseted`, 'warning')
  updateChart()
})

bq.on('downloading', function(url){
  print(`Starting download for file ile ${url}`)
  updateChart()
})

bq.on('failed', function(url, error){
  print(`File ${url} failed to download (status: ${error.status})`, 'error')
  updateChart()
})

bq.on('aborted', function(url){
  print(`Downloading of ${url} was aborted`, 'warning')
  updateChart()
})

bq.on('success', function(url, buf){
  print(`File ${url} is properly downloaded (size: ${buf.byteLength} bytes)`, 'success')
  let texture3D = new THREE.DataTexture3D( new Uint8Array(buf), 64, 64, 64 )
  chunkCollection.createChunk(url, texture3D)
  updateChart()
})

let serverPath = 'http://127.0.0.1:8080/allen_10um_8bit/10um/'
let wholeFileList = path10um.map(f => `${serverPath}${f}`)


let nbFilesQueried = 0
let maxNumberOfFiles = 4000

let interv = setInterval(function (){
  let nbFiles = ~~(Math.random() * 10) + 1
  let priority = ~~(Math.random() * queueSetting.priorityLevels)

  for(let i=0; i<nbFiles; i++){
    bq.add(wholeFileList[nbFilesQueried], priority)
    nbFilesQueried ++

    if(nbFilesQueried > maxNumberOfFiles) {
      clearInterval(interv)
    }
  }

}, 1)

// bq.add('http://127.0.0.1:8081/allen_10um_8bit//10um/320-384_384-448_704-768', 0)
// bq.add('http://127.0.0.1:8081/allen_10um_8bit//10um/896-960_384-448_768-832', 1)
// bq.add('http://127.0.0.1:8081/allen_10um_8bit//10um/576-640_576-640_256-320', 0)


function updateChart() {
  let sizes = bq.sizePerPriority()
  for(let i=0; i<sizes.length; i++){
    barDivs[i].style.width=`${sizes[i]}px`;
    labelDivs[i].innerHTML = sizes[i]
  }
}

function print(str, type = 'info') {
  //let d = new Date()
  //printer.innerHTML += `<span class="message ${type}">[${d.toISOString()}] ${str} <span><br>`
}
