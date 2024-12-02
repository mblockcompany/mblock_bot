import {Worker} from 'worker_threads';

let worker = null;

function createWorker() {
    if(worker == null) {
        worker = new Worker("./indexer/indexer.js");
    }
}
export function sendToChild(message) {
    createWorker();
    worker.postMessage(message);
}

export function childData(method, jsonData) {
    return {
        method: method,
        data: jsonData
    };
}