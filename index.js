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
        console.log(`Send interrupt signal to process: ${proc.pid}`)
        running = false
    }
}

function runScript() {
    if (fs.existsSync(scriptEntryFile) && !running) {
        proc = child_process.spawn('python3', [scriptEntryFile])
        console.log(`run the script on process: ${proc.pid}`)
        running = true
        proc.stdout.on('data', (data) => {
            console.log(`${data}`)
        })
        proc.stderr.on('data', (data) => {
            console.log(`${data}`)
        })
        proc.on('exit', () => { running = false })
    }
}

runScript()

const app = express()

app.use(fileUpload())

app.get('/', (req, res) => {
    res.send('makerplayground')
})

app.post('/upload', (req, res) => {
    console.log("======== New script is just uploading ==========")
    if (Object.keys(req.files).length == 0 || !req.files.script) {
        console.error("No file were uploaded")
        return res.status(400).send('No files were uploaded.')
    }

    let extractor = unzipper.Extract({path: __dirname})
    .on('close', () => {
        console.log("done extracting zip file")
//        res.send('File uploaded')
        if (proc && running) {
            proc.on('exit', (code) => {
                running = false
                console.log(`process: ${proc.pid} is now exited with status code {code}`)
                runScript()
                res.send('File uploaded')
            })
            stopScript()
        } else {
            runScript()
            res.send('File uploaded')
        }
        console.log("remove zip file")
        rimraf(scriptZipFile, () => { console.log("done removing zip file") })
    })
    .on('error', (err) => {
        if (err) {
            console.error(err)
            return res.status(500).send(err)
        }
    })

    console.log("copy zip file to the running directory")
    req.files.script.mv(scriptZipFile, (err) => {
        if (err) {
             console.error(err)
             return res.status(500).send(err)
        } else {
            console.log("done copy zip file")
            console.log("delete previous script folder")
            rimraf(scriptDir, () => {
                console.log("done delete previous script folder")
                console.log("start extracting zip file")
                fs.createReadStream(scriptZipFile)
                   .pipe(extractor)
            })
        }
    })
})

app.listen(port, () => console.log(`listening MakerPlayground upload on port ${port}`))

