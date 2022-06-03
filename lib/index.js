"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const object_hash_1 = __importDefault(require("object-hash"));
const events_1 = __importDefault(require("events"));
function dci_map_dir(root, params) {
    var _a, _b;
    const dci_map_events = new events_1.default();
    const options = {
        interval: (_a = params === null || params === void 0 ? void 0 : params.interval) !== null && _a !== void 0 ? _a : 0,
        emptyDir: (_b = params === null || params === void 0 ? void 0 : params.emptyDir) !== null && _b !== void 0 ? _b : true
    };
    const queue = [];
    const map = {};
    const dataResult = {
        data: {},
        file: [],
        dir: []
    };
    function handleDirContent(path, dirContent) {
        const result = {
            file: [],
            dir: [],
            hash: (0, object_hash_1.default)(dirContent)
        };
        dirContent.map(dirItem => {
            let itemPath = `${path}/${dirItem}`;
            if (fs_1.default.lstatSync(itemPath).isDirectory()) {
                result.dir.push(itemPath);
                if (queue.indexOf(itemPath) == -1)
                    queue.push(itemPath);
            }
            else
                result.file.push(itemPath);
        });
        return result;
    }
    function readDir(path) {
        var _a;
        if (fs_1.default.existsSync(path) && fs_1.default.lstatSync(path).isDirectory()) {
            const content = fs_1.default.readdirSync(path);
            const mapContent = handleDirContent(path, content);
            if (!map[path] || ((_a = map[path]) === null || _a === void 0 ? void 0 : _a.hash) !== mapContent.hash) {
                map[path] = {
                    content: content,
                    file: mapContent.file,
                    dir: mapContent.dir,
                    hash: mapContent.hash
                };
                dataResult.data = {
                    [path]: {
                        file: mapContent.file,
                        dir: mapContent.dir
                    }
                };
                dataResult.file = [...dataResult.file, ...mapContent.file];
                dataResult.dir = [...dataResult.dir, ...mapContent.dir];
                if (dataResult.file.length > 0)
                    dci_map_events.emit('file', dataResult.file);
                if (dataResult.dir.length > 0)
                    dci_map_events.emit('dir', dataResult.dir);
                dci_map_events.emit('change', dataResult);
            }
        }
        else if (options.emptyDir) {
            map[path] = {
                content: [],
                file: [],
                dir: [],
                hash: ''
            };
        }
    }
    function done() {
        if (options.interval > 0)
            setTimeout(start, (options.interval * 1000));
    }
    function run() {
        if (queue.length === 0)
            return done();
        const path = queue[0];
        readDir(path);
        queue.shift();
        return run();
    }
    function start() {
        dataResult.data = {};
        dataResult.file = [];
        dataResult.dir = [];
        queue.push(root);
        run();
    }
    return {
        done: (callback) => {
            start();
            if (typeof callback === 'function')
                return callback(dataResult);
            return dataResult;
        },
        change: (callback) => {
            var _a;
            options.interval = (_a = params === null || params === void 0 ? void 0 : params.interval) !== null && _a !== void 0 ? _a : 180;
            start();
            dci_map_events.on('change', (result) => {
                console.log(result);
                if (typeof callback === 'function')
                    return callback(result);
            });
            if (typeof callback === 'function')
                return callback(dataResult);
        },
        file: (callback) => {
            var _a;
            options.interval = (_a = params === null || params === void 0 ? void 0 : params.interval) !== null && _a !== void 0 ? _a : 180;
            start();
            dci_map_events.on('file', (result) => {
                if (typeof callback === 'function')
                    return callback(result.file);
            });
            if (typeof callback === 'function')
                return callback(dataResult.file);
        },
        dir: (callback) => {
            var _a;
            options.interval = (_a = params === null || params === void 0 ? void 0 : params.interval) !== null && _a !== void 0 ? _a : 180;
            start();
            dci_map_events.on('dir', (result) => {
                if (typeof callback === 'function')
                    return callback(result.dir);
            });
            if (typeof callback === 'function')
                return callback(dataResult.file);
        },
    };
}
exports.default = dci_map_dir;
