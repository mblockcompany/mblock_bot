import { createRequire } from 'module';
import dotenv from 'dotenv'
const require = createRequire(import.meta.url);

export const { version } = require('../package.json');

dotenv.config()

export function Show(ip, address) {
    return `🖥️${ip} - ${address}\n`;
}

export function Status(id, network, version, moniker, latestBlockHeight, valiAddr, valiIndex, votingPower) {
    return `🪪ID : ${id}\n` +
        `📡network : ${network}\n` +
        `💾version : ${version}\n` +
        `👤moniker : ${moniker}\n` +
        `📈Height : ${latestBlockHeight}\n` +
        `🏠Validator Address : ${valiAddr}\n` +
        `ℹ️Validator index : ${valiIndex}\n` +
        `🎫Voting Power : ${votingPower}\n`;
}

export function MissBlock(chainId, Height, validatorAddr, validatorIndex,  proposer) {
    return  `📡network : ${chainId}\n` +
        `📈Height : ${Height}\n` +
        `🏠Validator Address : ${validatorAddr}\n` +
        `ℹ️Validator Index : ${validatorIndex}\n` +
        `🪪Proposer Address : ${proposer}`;
}

export function Authentication(chatId, isSuccess) {
    const result = isSuccess ? "성공하셨습니다." : "실패하셨습니다.";

    return `인증에 ${result}\n` +
        `chatId : ${chatId}\n`;
}

export const Help =
    "/add (node IP) : 블록 스캔할 websocket IP\n" +
    "/show : 등록된 Node 확인\n" +
    "/status : 등록된 Node 정보 출력\n" +
    "/delete (node IP) : 블록 스캔할 IP 삭제\n" +
    "/miss (조회 시작 날짜) ((Opt)조회 완료 날짜) : Missed Block 개수 조회, 날짜는 8자리 ex)20201225\n" +
    "/vote (block 높이) (chain 이름) : 해당 블록의 PreVote와 PreCommit을 확인\n";

export const notAuthHelp =
    "/help : 도움말\n" +
    "/start (비밀번호) : 사용자 인증\n" +
    "/version : 버전 확인\n"
