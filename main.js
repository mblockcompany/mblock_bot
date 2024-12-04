import * as func from "./func.js";
import {bot, sendMessage} from "./framework/tendermintBot.js";
import {getAuthentication, initAuth} from "./framework/auth.js";
import {logger} from "./framework/log.js";
import {NodeManager} from "./manager/nodeManager.js"
import * as command from "./command.js";
import * as indexer from "./indexer/indexer.js";


const nodeManager = new NodeManager();

await initAuth();

bot.onText(/\/add (.+)/, async (msg, match) => {
    if(!getAuthentication(msg.chat.id)) {
        logger.warn(`비정상 접근 감지 ${msg.from.username}`);
        return;
    }

    const ip = match[1]

    if (nodeManager.isExist(ip)) {
        sendMessage(msg.chat.id, "이미 존재하는 IP 입니다.");
        return;
    }

    const valiInfo = await func.getValiInfo(ip);

    const result = nodeManager.addNodeInfo(ip, msg.chat.id, valiInfo);

    if(!result) {
        return;
    }

    nodeManager.addSubscribe(ip, "NewBlock", async (data) => {
        const blockInfo = data.value.block;
        const chainId = blockInfo.header.chain_id;
        const height = blockInfo.last_commit.height;
        const signatures = blockInfo.last_commit.signatures;

        const isMiss = await func.onNewBlock(msg.chat.id, ip, chainId, height, nodeManager.getNodeByIp(ip).ValidatorInfo.validatorAddr, signatures);

        if(isMiss) {
            //indexer.missBlockDetected(chainId, height);
        }
    });

    // nodeManager.addSubscribe(ip, "Vote", (data) => {
    //     const network = nodeManager.getNodeByIp(ip).ValidatorInfo.network;
    //
    //     func.voteEvent(data, network);
    // });
    //
    nodeManager.addSubscribe(ip, "NewRound", (data) => {
        func.newRoundEvent(data, msg.chat.id, nodeManager.getNodeByIp(ip), ip);
    })
});

bot.onText(/\/delete (.+)/, (msg, match) => {
    if(!getAuthentication(msg.chat.id)) {
        logger.warn(`비정상 접근 감지 ${msg.from.username}`);
        return;
    }

    const ip = match[1];

    if(!nodeManager.isExist(ip)) {
        sendMessage(msg.chat.id, "등록되지 않은 노드입니다.");
        return;
    }

    nodeManager.closeWebsocket(ip);
    command.onDelete(msg.from.username, ip);
});

bot.onText(/\/start (.+)/, (msg, match) => {
    const password = match[1];

    command.onStart(msg.chat.id, msg.from.username, password);
});


bot.onText("/show", (msg) => {
    if(!getAuthentication(msg.chat.id)) {
        logger.warn(`비정상 접근 감지 ${msg.from.username}`);
        return;
    }

    command.onShow(msg.chat.id, nodeManager.getNodeDictKeys());
});

bot.onText("/help", (msg) => {
    command.onHelp(msg.chat.id);
});

bot.onText("/status", (msg) => {
    if(!getAuthentication(msg.chat.id)) {
        logger.warn(`비정상 접근 감지 ${msg.from.username}`);
        return;
    }

    command.onStatus(msg.chat.id, nodeManager.getNodeDictKeys());
});

bot.onText(/\/miss (.+)/, (msg, match) => {
    if(!getAuthentication(msg.chat.id)) {
        logger.warn(`비정상 접근 감지 ${msg.from.username}`);
        return;
    }

    if(nodeManager.getNodeDictKeys().length === 0) {
        sendMessage(msg.chat.id, "먼저 노드를 연결해주세요.");
        return;
    }

    const split = match[1].split(" ");

    command.onSelect(msg.chat.id, nodeManager.getIPbyNetwork(), split[0], split[1]);
})


bot.onText(/\/vote (.+)/, (msg, match) => {
    if(!getAuthentication(msg.chat.id)) {
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

    command.onSelectVote(msg.chat.id, height, network);
})

bot.onText("/version", (msg) => {
    command.onVersion(msg.chat.id);
});

