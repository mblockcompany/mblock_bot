import {sendMessage, sendMessageAllChat} from "./framework/tendermintBot.js";
import axios from "axios";
import * as text from "./framework/textConstant.js";
import {ValidatorInfo} from "./framework/dtos.js";
import dotenv from 'dotenv';
import * as DB from "./framework/connectionPool.js"
import {logger} from "./framework/log.js";
import * as indexer from "./indexer/indexer.js";
import * as auth from "./framework/auth.js"

dotenv.config();

export async function onVote(voteDtoList) {
    await DB.insertVoteData(voteDtoList);
}


async function getStatus(ip) {
    const response = await axios.get(`http://${ip}:26657/status`);
    const result = response.data.result;

    const id = result.node_info.id;
    const network = result.node_info.network;
    const version = result.node_info.version;
    const moniker = result.node_info.moniker;
    const height = result.sync_info.latest_block_height;
    const valiAddr = result.validator_info.address;
    const votingPwr = result.validator_info.voting_power;

    const validatorDict = await getValidatorList(ip);

    const valiIndex = validatorDict[valiAddr];

    return text.Status(id, network, version, moniker, height, valiAddr, valiIndex, votingPwr);
}


export async function getValiInfo(ip) {
    const response = await axios.get(`http://${ip}:26657/status`);
    const result = response.data.result;

    const id = result.node_info.id;
    const network = result.node_info.network;
    const moniker = result.node_info.moniker;
    const valiAddr = result.validator_info.address;

    return new ValidatorInfo(id, moniker, network, valiAddr);
}

export async function getValidatorList(ip, height = null) {

    let url = `http://${ip}:26657/validators?per_page=200`;

    if(height != null)
        url += `&height=${height}`;

    const response = await axios.get(url);

    const validators = response.data.result.validators;
    var output = {};

    validators.forEach((validator, index) => {
        output[validator.address] = index + 1;
    })


    return output;
}

export async function getBlockData(ip, height) {
    const response = await axios.get(`http://${ip}:26657/block?height=${height}`);

    return {
        proposer : response.data.result.block.header.proposer_address,
        created : response.data.result.block.header.time
    };
}


export function voteEvent(data, network) {
    const Vote = data.value.Vote;
    const voteType = parseInt(Vote.type);

    if(voteType === 32)
        return;

    const height = parseInt(Vote.height);
    const index = parseInt(Vote.validator_index);

    if(indexer.isNull(network)) {
        return;
    }

    try {
        indexer.addVote(network, height, index, voteType);
    }
    catch (e) {
        logger.error(`${network} - ${height} : Vote가 Round보다 먼저 들어옴`);
    }
}

export function newRoundEvent(data, chatId, validatorNode, ip) {
    const network = validatorNode.ValidatorInfo.network;
    const height = data.value.height;
    const round = data.value.round;

    if(indexer.isNull(network) && !validatorNode.observe) {
        indexer.initVoteInfo(network);
        validatorNode.onObserve();
        sendMessage(chatId, `${ip} Miss Block 감지 준비 완료`);
    }

    if(height > indexer.indexerSize && !indexer.isNull(network, height - indexer.indexerSize)) {
        indexer.deleteHeight(network, height - indexer.indexerSize)
    }

    if(round > 0) {
        logger.info(`${network} - ${height} 새로운 라운드 실행`);
    }

    indexer.newRoundVote(network, height);
}

export async function onNewBlock(chatId, ip, chainId, height, myAddress, signatures) {
    let isMiss = false;

    const findoutMyVali = signatures.find(element => {
        if (element.validator_address === myAddress)
            return element;
    });

    if (findoutMyVali == null || (findoutMyVali.block_id_flag !== 2 && findoutMyVali.block_id_flag !== 3)) {
        const block = await getBlockData(ip, height);
        await DB.insertMissblockData(chainId, height, changeTime(block.created), block.proposer);
        const addressList = await getValidatorList(ip, height);

        let message = `*[Miss Block Detected]*\n` + text.MissBlock(chainId, height, myAddress, addressList[myAddress], block.proposer);

        logger.warn(`${chainId} - ${height} Miss Block Detected`);

        sendMessageAllChat(message, auth.getAuthDict())
        isMiss = true;
    }

    return isMiss;
}

function changeTime(utcTime) {
    const date = new Date(utcTime);

    return new Date(date.toLocaleString('en-US', {timeZone: 'Asia/Seoul'}));
}
