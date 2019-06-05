import paper from 'paper'
import Hammer from 'hammerjs'
import debug from 'debug'

import '../styles/style.scss'
import '@fortawesome/fontawesome-free/css/all.css'

const defaultOptions = {
    strokeColor: 'white',
    strokeWidth: 4,
    strokeCap: 'round',
    blendMode: 'normal',
}

const dd = debug('drawing')
const md = debug('menu')

//globalState and basiclly default value
const globalState = {
    backgroudColor: '#000000',
    strokeWidth: 4,
    strokeColor: '#ffffff',
    lastPointsNum: 0, // record the pointsNum,
    menuTimeOutId: undefined
}

let currPath

window.onload = function () {
    debug('window Load!')

    const board = document.getElementById('board')
    // set up paper.js
    paper.setup(board)
    localStorage.getItem('digital-board@drwaing#active') &&
        paper.project.activeLayer.importJSON(localStorage.getItem('digital-board@drwaing#active'))

    //debug mode
    paper.install(window)

    // bind color of input to its father's bgcolor
    const strokeColorInput = document.getElementById('stroke-color')
    const strokeColorInputWrapper = document.getElementById('stroke-color-wrapper')
    strokeColorInput.value = '#ffffff'
    strokeColorInputWrapper.style.background = '#ffffff'
    strokeColorInput.addEventListener('input', function (ev) {
        strokeColorInputWrapper.style.backgroundColor = ev.target.value
        globalState.strokeColor = ev.target.value
    })
    strokeColorInputWrapper.addEventListener('click', function () {
        strokeColorInput.click()
    })

    // sync the stroke size
    const strokeSizeIncBtn = document.getElementById('inc-stroke-size')
    const strokeSizeDecBtn = document.getElementById('dec-stroke-size')
    const realStrokeSize = document.getElementById('real-stroke-size')

    realStrokeSize.innerText = defaultOptions.strokeWidth

    strokeSizeIncBtn.addEventListener('click', function (ev) {
        const size = parseInt(realStrokeSize.innerText)
        globalState.strokeWidth = size + 1
        realStrokeSize.innerText = size + 1
    })

    strokeSizeDecBtn.addEventListener('click', function (ev) {
        const size = parseInt(realStrokeSize.innerText)
        if (size <= 2) {
            return;
        }
        globalState.strokeWidth = size - 1
        realStrokeSize.innerText = size - 1
    })

    // reset to default stroke size
    realStrokeSize.addEventListener('click', function (ev) {
        this.innerText = defaultOptions.strokeWidth
        globalState.strokeWidth = defaultOptions.strokeWidth
    })

    // export and import between localStorage
    const exportBtn = document.getElementById('save-to-localstorage')
    const importBtn = document.getElementById('import-from-localstorage')

    exportBtn.addEventListener('click', function (ev) {
        localStorage.setItem('digital-board@drwaing#active', paper.project.activeLayer.exportJSON())
    })

    importBtn.addEventListener('click', function (ev) {
        const json = localStorage.getItem('digital-board@drwaing#active')
        paper.project.activeLayer.importJSON(json)
    })

    // download to file
    const downloadBtn = document.getElementById('download-file')
    downloadBtn.addEventListener('click', function (ev) {
        const url = board.toDataURL('image/png').replace('image/png', 'image/octet-stream')

        const d = new Date()
        const filename = `export-${d.getFullYear()}-${d.getFullYear()}-${d.getFullYear()}-${d.getMonth() + 1}-${d.getMinutes()}-${d.getSeconds()}.png`
        this.setAttribute('download', filename)
        this.setAttribute('href', url)
    })

    const clearBtn = document.getElementById('clear')
    clearBtn.addEventListener('click', function (ev) {
        ev.preventDefault()
        paper.project.activeLayer.clear()
    })

    // setBackgroudColor(board, globalState.backgroudColor)
    board.style.background = globalState.backgroudColor

    const hm = new Hammer(board, { touchAction: 'none' })
    // handle touch input
    hm.on('hammer.input', function (ev) {
        if (ev.isFirst) {
            dd('first input', ev)
            if (ev.srcEvent.ctrlKey) ev.maxPointers = 2
            globalState.lastPointsNum = ev.maxPointers
            if (ev.maxPointers === 2) {
                //earse
                currPath = startDraw(ev, {
                    segments: [ev.center],
                    strokeColor: globalState.backgroudColor,
                    strokeWidth: globalState.strokeWidth < 12 ? globalState.strokeWidth * 10 : globalState.strokeWidth * 2 + 20,
                    blendMode: 'destination-out'
                })
            } else {
                currPath = startDraw(ev, {
                    segments: [ev.center],
                    strokeColor: globalState.strokeColor,
                    strokeWidth: globalState.strokeWidth,
                })
            }
        } else if (ev.isFinal) {
            endDraw(ev, currPath)
        } else {
            duringDraw(ev, currPath)
        }
        console.log(ev)
    })

    const guestureDector = new Hammer.Manager(document.getElementById('guesture-decetor'))
    const swipe = new Hammer.Swipe({
        event: 'show-menu',
        direction: Hammer.DIRECTION_UP
    })
    guestureDector.add(swipe)


    const hidenMenu = () => {
        document.getElementById('bottom-bar').style.bottom = 0
    }

    guestureDector.on('show-menu', function (ev) {
        md('show-menu')
        const bottomBar = document.getElementById('bottom-bar')
        document.querySelector('.menu').hidden = false
        const h = bottomBar.clientHeight
        bottomBar.style.bottom = h + 'px'
        globalState.menuTimeOutId = setTimeout(hidenMenu, 4000) // hiden after 4s
    })

    // reset timeout everytime menu being click
    document.getElementById('bottom-bar').querySelector('.menu')
        .addEventListener('click', function (ev) {
            md('menu being clicking reset timer', globalState.menuTimeOutId)
            clearTimeout(globalState.menuTimeOutId)
            globalState.menuTimeOutId = setTimeout(hidenMenu, 4000)
            md('new Id', globalState.menuTimeOutId)
        })
}


function startDraw(ev, options = {}) {
    dd('start Draw in x:' + ev.center.x + ', y: ' + ev.center.y)
    options = Object.assign({ ...defaultOptions }, options)
    const path = new paper.Path(options)
    return path
}

function duringDraw(ev, path) {
    if (globalState.lastPointsNum !== ev.maxPointers) {
        endDraw(ev, path)
        currPath = startDraw(ev, {
            segments: [ev.center],
            strokeColor: globalState.strokeColor,
            strokeWidth: globalState.strokeWidth < 12 ? globalState.strokeWidth * 10 : globalState.strokeWidth * 2 + 20,
            blendMode: 'destination-out'
        })
        return
    }
    path.add(ev.center)
}

function endDraw(ev, path) {
    dd('end Draw in x:' + ev.center.x + ', y: ' + ev.center.y)
    globalState.lastPointsNum = ev.maxPointers
    if (globalState.lastPointsNum === 1) {
        path.simplify(3)
    }
}