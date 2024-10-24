import {bot} from "./tendermintBot.js";
import * as func from "./func.js";
import {ValidatorNode, VoteDto} from "./dtos.js";
import {sendMessage} from "./func.js";
import {logger} from "./log.js";


var voteInfo = {};
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
        func.onOpen(msg.chat.id, ip, validatorNodeDict[ip]);
    };

    validatorNodeDict[ip].WebSocket.onmessage = (event) => {
        const messageData = JSON.parse(event.data);

        if (messageData && messageData.result && messageData.result.data && messageData.result.data.type) {

            const data = messageData.result.data;
            const event = messageData.result.events["tm.event"][0];

            switch(event) {
                case "NewBlock": {
                    const blockInfo = messageData.result.data.value.block;
                    const chainId = blockInfo.header.chain_id;
                    const height = blockInfo.last_commit.height;
                    const signatures = blockInfo.last_commit.signatures;

                    func.onNewBlock(msg.chat.id, ip, chainId, height, signatures, validatorNodeDict[ip].ValidatorInfo.validatorAddr, voteInfo);
                    break;
                }
                case "Vote": {
                    const Vote = data.value.Vote;
                    const voteType = parseInt(Vote.type);

                    if(voteType === 32)
                        break;

                    const network  = validatorNodeDict[ip].ValidatorInfo.network;
                    const height = parseInt(Vote.height);
                    const index = parseInt(Vote.validator_index);

                    if(voteInfo[network] == null || voteInfo[network][height] == null) {
                        break;
                    }

                    voteInfo[network][height].push(new VoteDto(network, height, index, voteType));

                    break;
                }
                case "NewRound" : {
                    const network = validatorNodeDict[ip].ValidatorInfo.network;
                    const newBlockHeight = data.value.height;

                    if(voteInfo[network] == null) {
                        voteInfo[network] = {};
                        sendMessage(msg.chat.id, `${ip} Miss Block 감지 준비 완료`);
                    }

                    if(voteInfo[network][newBlockHeight] == null)
                        voteInfo[network][newBlockHeight] = [];

                    break;
                }
            }


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

    if(validatorNodeDict[ip] == null) {
        sendMessage(msg.chat.id, "등록되지 않은 노드입니다.");
        return;
    }

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


bot.onText(/\/vote (.+)/, (msg, match) => {
    if(!func.getAuthentication(msg.chat.id)) {
        logger.warn(`비정상 접근 감지 ${msg.from.username}`);
        return;
    }

    const split = match[1].split(" ");

    const height = parseInt(split[0]);
    const network = split[1];

    if(height == null || network == null) {
        sendMessage(msg.chat.id, "높이 및 네트워크가 잘못되었습니다.");
        return;
    }

    func.onSelectVote(msg.chat.id, height, network);
})

bot.onText("/version", (msg) => {
    func.onVersion(msg.chat.id);
});

