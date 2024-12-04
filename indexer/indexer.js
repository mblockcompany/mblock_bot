import {VoteDto} from "../framework/dtos.js";
import * as func from "../func.js";
import {logger} from "../framework/log.js";

const voteInfo = {};
export const indexerSize = 10;

export function addVote(network, height, index, voteType) {
    voteInfo[network][height].push(new VoteDto(network, height, index, voteType));
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