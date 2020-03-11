const child_process = require('child_process')
const process = require('process')
const fs = require('fs')
const rimraf = require('rimraf')
const unzipper = require('unzipper')
const express = require('express')
const fileUpload = require('express-fileupload')

const port = 6212

const scriptDir = __dirname + '/script'
const scriptEntryFile = __dirname + '/script/main.py'
const scriptZipFile = __dirname + '/script.zip'

var proc = null
var running = false

process.on('exit', function() {
    stopScript()
})

function stopScript() {
    if (running) {
        proc.kill('SIGINT')
        running = false
    }
}

function runScript() {
    if (fs.existsSync(scriptEntryFile) && !running) {
        proc = child_process.spawn('python3', [scriptEntryFile])
        running = true
        proc.stdout.on('data', (data) => {
            console.log(`${data}`)
        })
        proc.stderr.on('data', (data) => {
            console.log(`${data}`)
        })
        proc.on('close', (retVal) => {
            console.log(`${retVal}`)
        })
    }
}

runScript()

const app = express()

app.use(fileUpload())

app.get('/', (req, res) => {
    res.send('makerplayground')
})

app.post('/upload', (req, res) => {
    if (Object.keys(req.files).length == 0 || !req.files.script) {
        console.log("No file were uploaded")
        return res.status(400).send('No files were uploaded.')
    }

    let extractor = unzipper.Extract({path: __dirname})
    .on('close', () => {
        stopScript()
        runScript()
        console.log(proc.pid)
        res.send('File uploaded!')
        rimraf(scriptZipFile, () => {})
    })
    .on('error', (err) => {
        if (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    })

    req.files.script.mv(scriptZipFile, (err) => {
        if (err) {
             console.log(err)
             return res.status(500).send(err)
        } else {
            rimraf(scriptDir, () => {
                fs.createReadStream(scriptZipFile)
                   .pipe(extractor)
            })
        }
    })
})

app.listen(port, () => console.log(`listening on port ${port}`))

