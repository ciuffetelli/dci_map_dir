"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const index_1 = __importDefault(require("./index"));
function fail_404(request, response) {
    response.json({ error: 'Not found' });
}
function Routes() {
    const baseUrl = '/';
    const baseDir = '/pages/';
    const Router = express_1.default.Router();
    (0, index_1.default)(__dirname + baseDir).done((dirContent) => {
        dirContent.file.map(file => {
            const endPoint = file.substring(file.indexOf(baseDir) + baseDir.length + 1).split('.')[0].toLowerCase().replace('index', '');
            const Controller = require(file);
            Router.get(`${baseUrl}${endPoint}`, Controller.default);
        });
    });
    Router.get('*', fail_404);
    return Router;
}
const app = (0, express_1.default)();
app.use(Routes());
app.listen(3333);
console.log('Server: http://localhost:3333');
