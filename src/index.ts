import fs from 'fs'
import hash from 'object-hash'
import EventEmitter from 'events';

type MapDirParams = {
    interval?: number,
    emptyDir?: true | false
}

type HandleDirContent = {
    file: string[],
    dir: string[],
    hash: string
}

type Map = {
    [key: string] : {
        content: string[],
        file: string[],
        dir: string[],
        hash: string
    }
}

type MapDirResult = {
    done: Function,
    change: Function,
    file: Function,
    dir: Function,
}

export type DataResult = {
    data: {
        [key: string] : {
            file: string[],
            dir: string[]
        }
    },
    file: string[],
    dir: string[]
}

function dci_map_dir(root: string, params?: MapDirParams): MapDirResult {

    const dci_map_events = new EventEmitter()

    const options =  {
        interval: params?.interval ?? 0,
        emptyDir: params?.emptyDir ?? true
    }

    const queue: string[] = []

    const map: Map = {}

    const dataResult: DataResult = {
        data: {},
        file: [],
        dir: []
    }  

    function handleDirContent(path: string, dirContent: string[]):HandleDirContent {

        const result: HandleDirContent = {
            file: [],
            dir: [],
            hash: hash(dirContent)
        }

        dirContent.map(dirItem => {

            let itemPath = `${path}/${dirItem}`

            if(fs.lstatSync(itemPath).isDirectory()){
                
                result.dir.push(itemPath)
                if(queue.indexOf(itemPath) == -1) queue.push(itemPath)
                
            } else result.file.push(itemPath)
        })

        return result
    }  

    function readDir(path: string) {

        if(fs.existsSync(path) && fs.lstatSync(path).isDirectory()) {

            const content = fs.readdirSync(path)

            const mapContent = handleDirContent(path, content)

            if(!map[path] || map[path]?.hash !== mapContent.hash){

                map[path] = {
                    content: content,
                    file: mapContent.file,
                    dir: mapContent.dir,
                    hash: mapContent.hash
                }

                dataResult.data = {
                    [path]: {
                        file: mapContent.file,
                        dir: mapContent.dir
                    }
                }
                
                dataResult.file = [...dataResult.file, ...mapContent.file]
                dataResult.dir = [...dataResult.dir, ...mapContent.dir]

                if(dataResult.file.length > 0) dci_map_events.emit('file', dataResult.file)
                if(dataResult.dir.length > 0) dci_map_events.emit('dir', dataResult.dir)
                
                dci_map_events.emit('change', dataResult)
            }

        } else if(options.emptyDir) {
            map[path] = {
                content: [],
                file: [],
                dir: [],
                hash: ''
            }
        }
    }

    function done() {
        if(options.interval > 0) setTimeout(start, (options.interval * 1000))
    }

    function run(): void {
    
        if(queue.length === 0) return done()

        const path = queue[0]
    
        readDir(path)
    
        queue.shift()
    
        return run()
    }
    
    function start() {
        dataResult.data = {}
        dataResult.file = []
        dataResult.dir = []

        queue.push(root)
        run()
    }

    return {
        done: (callback: CallableFunction): DataResult => {

            start()
            if(typeof callback === 'function') return callback(dataResult)
            return dataResult
        },
        change: (callback: CallableFunction): void => {

            options.interval =  params?.interval ?? 180
            start()

            dci_map_events.on('change', (result: DataResult) => {
                console.log(result)
                if(typeof callback === 'function') return callback(result)
            })

            if(typeof callback === 'function') return callback(dataResult)
        },
        file: (callback: CallableFunction): void => {

            options.interval =  params?.interval ?? 180
            start()

            dci_map_events.on('file', (result: DataResult) => {
                if(typeof callback === 'function') return callback(result.file)
            })

            if(typeof callback === 'function') return callback(dataResult.file)
        },
        dir: (callback: CallableFunction): void => {

            options.interval =  params?.interval ?? 180
            start()

            dci_map_events.on('dir', (result: DataResult) => {
                if(typeof callback === 'function') return callback(result.dir)
            })

            if(typeof callback === 'function') return callback(dataResult.file)
        },        
    }
}

export default dci_map_dir