import express from 'express'
import {Request, Response} from 'express'
import map_dir, { DataResult } from "./index";

function fail_404(request: Request, response: Response){
    response.json({ error: 'Not found' })
}

function Routes() {
    const baseUrl = '/'
    const baseDir = '/pages/'

    const Router = express.Router()

    map_dir(__dirname + baseDir).done( (dirContent: DataResult) => {

        dirContent.file.map( file => {

            const endPoint = file.substring(file.indexOf(baseDir) + baseDir.length + 1).split('.')[0].toLowerCase().replace('index', '')

            const Controller = require(file)

            Router.get(`${baseUrl}${endPoint}`, Controller.default)  
        })
    })

    Router.get('*', fail_404)

    return Router
}

const app = express()

app.use(Routes())

app.listen(3333)

console.log('Server: http://localhost:3333')