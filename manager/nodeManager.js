import {ValidatorNode, VoteDto} from "../framework/dtos.js";
import {logger} from "../framework/log.js";
import {sendMessage, sendMessageAllChat} from "../framework/tendermintBot.js";
import {getAuthDict} from "../framework/auth.js";
import * as indexer from "../indexer/indexer.js"


export class NodeManager {
    constructor() {
        if(NodeManager.instance) {
            return NodeManager.instance;
        }

        this.validatorNodes = {};
        this.nodeEventFunc = {}
        this.eventID = 1;
        NodeManager.instance = this;
    }

    addNodeInfo(ip, chatId, valiInfo) {
        const webSocketURL = `ws://${ip}:26657/websocket`

        try {
            this.validatorNodes[ip] = new ValidatorNode(new WebSocket(webSocketURL));
        } catch (e) {
            sendMessage(chatId, "IP를 다시 확인해 주세요")
            logger.error(e)
            return false;
        }

        this.validatorNodes[ip].setValidatorInfo(valiInfo);
        this.nodeEventFunc[ip] = {};
        logger.info(`${ip} Websocket connected`)

        this.validatorNodes[ip].WebSocket.onopen = () => {
            sendMessage(chatId, `${ip} 연결이 성공적으로 이루어졌습니다.`)
        }

        this.validatorNodes[ip].WebSocket.onmessage = (event) => {
            this.#onMessage(event, ip);
        }

        this.validatorNodes[ip].WebSocket.onerror = (error) => {
            this.closeWebsocket(ip);
            onError(error, ip)
        }

        this.validatorNodes[ip].WebSocket.onclose = () => {
            this.closeWebsocket(ip);
            onClose(ip);
        }

        return true;
    }

    addSubscribe(ip, event, eventFunc) {
        subscribeToEvent(this.validatorNodes[ip].WebSocket, event, this.eventID);
        this.eventID++;
        this.nodeEventFunc[ip][event] = eventFunc;
    }

    isExist(ip) {
        return ip in this.validatorNodes;
    }

    closeWebsocket(ip) {
        if(this.validatorNodes[ip].observe) {
            indexer.deleteNode(this.validatorNodes[ip].ValidatorInfo.network);
        }

        this.validatorNodes[ip].delete();
        delete this.validatorNodes[ip];
    }

    getNodeDictKeys() {
        return Object.keys(this.validatorNodes);
    }

    getIPbyNetwork() {
        const output = {};
        Object.keys(this.validatorNodes).forEach((ip) => {
            output[this.validatorNodes[ip].ValidatorInfo.network] = ip;
        });

        return output;
    }

    getNodeByIp(ip) {
        return this.validatorNodes[ip];
    }

    #onMessage(event, ip) {
        const messageData = JSON.parse(event.data);

        if (messageData && messageData.result && messageData.result.data && messageData.result.data.type) {

            const data = messageData.result.data;
            const event = messageData.result.events["tm.event"][0];

            if(event in this.nodeEventFunc[ip]) {
                this.nodeEventFunc[ip][event](data);
            }
        }
    }
}

function onError(error, ip) {
    const message = `${ip} 연결 에러 발생`;
    logger.error(error);
    sendMessageAllChat(message, getAuthDict());
}

function onClose(ip) {
    const message = `${ip} 연결이 종료되었습니다.`;
    logger.info(message);
    sendMessageAllChat(message, getAuthDict());
}

function subscribeToEvent(ws, eventType, id) {
    const request = {
        "jsonrpc": "2.0",
        "method": "subscribe",
        "params": {
            "query": `tm.event = '${eventType}'`
        },
        "id": id // 랜덤 ID 생성
    };

    sendWhenConnected(ws, JSON.stringify(request));
}

function sendWhenConnected(webSocket, message) {
    return new Promise((resolve, reject) => {
        if (webSocket.readyState === WebSocket.OPEN) {
            webSocket.send(message);
            resolve();
        } else if (webSocket.readyState === WebSocket.CLOSED) {
            reject(new Error('WebSocket is closed.'));
        } else {
            const onOpenHandler = () => {
                webSocket.send(message);
                resolve();
                webSocket.removeEventListener('open', onOpenHandler); // 리스너 제거
            };

            webSocket.addEventListener('open', onOpenHandler);
        }
    });
}
