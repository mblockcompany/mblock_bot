import {bot} from "./tendermintBot.js";
import * as func from "./func.js";
import {ValidatorNode} from "./dtos.js";
import {sendMessage} from "./func.js";
import {logger} from "./log.js";


var validatorNodeDict = {};

bot.onText(/\/add (.+)/, (msg, match) => {
    if(!func.getAuthentication(msg.chat.id)) {
        logger.warn(`비정상 접근 감지 ${msg.from.username}`);
        return;
    }

    const ip = match[1]

    if (ip in validatorNodeDict) {
        bot.sendMessage(msg.chat.id, "이미 존재하는 IP 입니다.");
        return;
    }

    const webSocketURL = `ws://${ip}:26657/websocket`

    try {
        validatorNodeDict[ip] = new ValidatorNode(new WebSocket(webSocketURL));
    } catch (e) {
        func.sendMessage(msg.chat.id, "IP를 다시 확인해 주세요")
        logger.error(e)
        return;
    }

    validatorNodeDict[ip].WebSocket.onopen = async () => {
        func.onOpen(msg.chat.id, ip, validatorNodeDict[ip].WebSocket);

        validatorNodeDict[ip].setValidatorInfo(await func.getValiInfo(ip));
    };

    validatorNodeDict[ip].WebSocket.onmessage = (event) => {
        const messageData = JSON.parse(event.data);

        if (messageData && messageData.result && messageData.result.data) {
            const blockInfo = messageData.result.data.value.block;
            const chainId = blockInfo.header.chain_id;
            const height = blockInfo.last_commit.height;
            const signatures = blockInfo.last_commit.signatures;

            func.onMessage(msg.chat.id, ip, chainId, height, signatures, validatorNodeDict[ip].ValidatorInfo.validatorAddr);
        }
    }

    validatorNodeDict[ip].WebSocket.onerror = (error) => {
        validatorNodeDict[ip].delete();
        delete validatorNodeDict[ip];
        func.onError(error, ip)
    }

    validatorNodeDict[ip].WebSocket.onclose = () => {
        validatorNodeDict[ip].delete();
        delete validatorNodeDict[ip];
        func.onClose(ip)
    }
});

bot.onText(/\/delete (.+)/, (msg, match) => {
    if(!func.getAuthentication(msg.chat.id)) {
        logger.warn(`비정상 접근 감지 ${msg.from.username}`);
        return;
    }

    const ip = match[1];

    func.onDelete(msg.from.username, ip, validatorNodeDict[ip]);
});

bot.onText(/\/start (.+)/, (msg, match) => {
    const password = match[1];

    func.onStart(msg.chat.id, msg.from.username, password);
});


bot.onText("/show", (msg) => {
    if(!func.getAuthentication(msg.chat.id)) {
        logger.warn(`비정상 접근 감지 ${msg.from.username}`);
        return;
    }

    func.onShow(msg.chat.id, validatorNodeDict);
});

bot.onText("/help", (msg) => {

    func.onHelp(msg.chat.id);
});

bot.onText("/status", (msg) => {
    if(!func.getAuthentication(msg.chat.id)) {
        logger.warn(`비정상 접근 감지 ${msg.from.username}`);
        return;
    }

    func.onStatus(msg.chat.id, Object.keys(validatorNodeDict));
});

bot.onText(/\/miss (.+)/, (msg, match) => {
    if(!func.getAuthentication(msg.chat.id)) {
        logger.warn(`비정상 접근 감지 ${msg.from.username}`);
        return;
    }

    if(Object.keys(validatorNodeDict).length === 0) {
        sendMessage(msg.chat.id, "먼저 노드를 연결해주세요.");
        return;
    }

    const split = match[1].split(" ");

    var networkDict = {};

    Object.keys(validatorNodeDict).forEach((ip) => {
        networkDict[validatorNodeDict[ip].ValidatorInfo.network] = ip;
    })

    func.onSelect(msg.chat.id, networkDict, split[0], split[1]);
})

bot.onText("/version", (msg) => {
    func.onVersion(msg.chat.id);
})