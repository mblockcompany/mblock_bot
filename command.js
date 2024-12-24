import {logger} from "./framework/log.js";
import {sendMessage, sendMessageAllChat} from "./framework/tendermintBot.js";
import * as DB from "./framework/connectionPool.js";
import * as text from "./framework/textConstant.js";
import * as auth from "./framework/auth.js";
import {CountDto} from "./framework/dtos.js";
import * as func from "./func.js";

export function onDelete(username, ip) {
    const message = `${username}에 의해 ${ip}연결을 종료합니다.`;
    logger.info(message);
    sendMessageAllChat(message, auth.getAuthDict());
}

export async function onStart(chatId, username, input) {
    chatId = parseInt(chatId);
    const password = process.env.password;

    if(auth.getAuthDict() == null) {
        sendMessage(chatId, "프로그램이 실행 준비중입니다. 잠시만 기다려주세요");
        return;
    }

    if(auth.getAuthentication()[chatId]) {
        sendMessage(chatId, "이미 인증된 사용자입니다.");
        return;
    }

    auth.setAuthentication(chatId,  input === password);

    if(auth.getAuthentication(chatId)) {
        await DB.insertAuthData(chatId);
        logger.info(`${username} 연결 성공`)
    }
    else {
        logger.warn(`${username} 열결 실패`)
    }

    sendMessage(chatId, text.Authentication(chatId, auth.getAuthentication(chatId)));
}


export async function onSelect(chatId, networkDict, start, end) {
    const results = await DB.selectMissblockData(start, end);

    if(results == null) {
        logger.error("Missblock 조회 실패")
        sendMessage(chatId, "조회에 실패하였습니다.");
        return;
    }

    let output = `*${DB.filterDate(start)}`;
    output += end == null ? "" : ` ~ ${DB.filterDate(end)}`
    output += `*\n`

    output += `-- VI는 조회가 되지않은 Validator 입니다.\n`

    var resultDict = {}
    var validatorIndexDict = {};

    for (const network in networkDict) {
        const ip = networkDict[network];

        validatorIndexDict[network] = await func.getValidatorList(ip);
    }

    results.forEach(row => {
        if(networkDict[row.chain] == null)
            return;

        if(resultDict[row.chain] == null)
            resultDict[row.chain] = [];

        resultDict[row.chain].push(new CountDto(row.chain, row.proposer, validatorIndexDict[row.chain][row.proposer], row.count));
    })

    Object.keys(resultDict).forEach(key => {
        output += `*[${key}]*\n`
        resultDict[key].forEach(dto => {
            const index = dto.index == null ? "--" : dto.index;

            output += `${index} VI : ${dto.count} 개\n`
        })

        output += "\n";
    })

    sendMessage(chatId, output);
}


export async function onSelectVote(chatId, height, network) {
    const results = await DB.selectVote(height, network);

    if(results == null) {
        logger.error("Vote 조회 실패")
        sendMessage(chatId, "조회에 실패하였습니다.");
        return;
    }

    var strVote = ["", ""];

    strVote[0] = "*[PreVote]*\n";
    strVote[1] = "*[PreCommit]*\n";

    results.forEach((row) => {
        const type = row.type === 2 ? "PreCommit" : "PreVote";
        const arrayIndex = row.type - 1;
        strVote[arrayIndex] += `${row.index + 1} - ${type}\n`;
    });

    const message = `*[${height}]*\n` +
        `${strVote[0]}\n${strVote[1]}`;

    sendMessage(chatId, message);
}

export async function onStatus(chatId, ipList) {
    var message = "";

    for (const ip of ipList) {
        const result = await func.getStatus(ip);
        message += result + "\n";
    }

    sendMessage(chatId, "*[Status]*\n" + message)
}

export function onHelp(chatId) {
    var message = text.notAuthHelp;

    if(auth.getAuthentication(chatId))
        message += text.Help

    sendMessage(chatId, message)
}

export function onVersion(chatId) {
    sendMessage(chatId, text.version);
}

export function onShow(chatId, nodeManager) {
    var IPs = "";

    const ipList = nodeManager.getNodeDictKeys();

    ipList.forEach(ip => {
        IPs += text.Show(ip, nodeManager.getNodeByIp(ip).ValidatorInfo.validatorAddr);
    });

    if (IPs === "")
        IPs = "등록된 Node가 없습니다.";

    sendMessage(chatId, `*[Node Info]*\n${IPs}`, {"parse_mode" : "Markdown"});
}
