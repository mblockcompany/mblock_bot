import {VoteDto} from "../framework/dtos.js";
import * as func from "../func.js";
import {logger} from "../framework/log.js";

const voteInfo = {};
export const indexerSize = 10;

export function addVote(network, height, index, voteType) {
    return addVoteWhenCreateArray(network, height, index, voteType);
}

export function isNull(network, height = null) {
    if(height == null) {
        return voteInfo[network] == null;
    }

    return voteInfo[network][height] == null;
}

export function initVoteInfo(network) {
    voteInfo[network] = {};
}

export function newRoundVote(network, height) {
    voteInfo[network][height] = [];
}

export function deleteHeight(network, height) {
    voteInfo[network][height - indexerSize] = null;
}

export function missBlockDetected(network, height) {
    const voteDtoCopy = Object.assign([], voteInfo[network][height]);

    if(voteDtoCopy == null || voteDtoCopy.length === 0) {
        logger.error(`${network} - ${height} vote array is null`);
    }

    func.onVote(voteDtoCopy);
}

export function deleteNode(network) {
    delete voteInfo[network];
}

function addVoteWhenCreateArray(network, height, index, voteType) {
    return new Promise((resolve, reject) => {
        if(voteInfo[network] == null) {
            reject()
        }

        const intervalId = setInterval(() => {
            if (voteInfo[network][height] != null) {
                // 배열이 생성되었으면 데이터 추가
                voteInfo[network][height][index] = voteType;

                clearInterval(intervalId); // 주기적 확인 중단
                resolve();
            }
        }, 100); // 100ms 주기로 확인

        // 안전 장치: 타임아웃 설정
        setTimeout(() => {
            clearInterval(intervalId); // 일정 시간이 지나면 중단
            reject(`${network} - ${height} array 10초 동안 생성 안됨`)
        }, 10000); // 10초 제한
    })
}