export class ValidatorNode {
    constructor(websocket) {
        this._observe = false;
        this._validatorInfo = null;
        this._webSocket = websocket;
    }

    setValidatorInfo(validatorInfo) {
        this._validatorInfo = validatorInfo;
    }

    get WebSocket() {
        return this._webSocket;
    }

    get ValidatorInfo() {
        return this._validatorInfo
    }

    delete() {
        if(this._webSocket.readyState === WebSocket.OPEN)
            this._webSocket.close()
    }

    onObserve() {
        this._observe = true;
    }

    get observe() {
        return this._observe;
    }
}

export class ValidatorInfo {
    get id() {
        return this._id;
    }

    get moniker() {
        return this._moniker;
    }

    get network() {
        return this._network;
    }

    get validatorAddr() {
        return this._validatorAddr;
    }

    constructor(id, moniker, network, validatorAddr) {
        this._id = id;
        this._moniker = moniker;
        this._network = network;
        this._validatorAddr = validatorAddr;
    }
}

export class CountDto {
    constructor(chain, proposer, index, count) {
        this._chain = chain;
        this._proposer = proposer;
        this._count = count;
        this._index = index;
    }


    get index() {
        return this._index;
    }

    get chain() {
        return this._chain;
    }

    get proposer() {
        return this._proposer;
    }

    get count() {
        return this._count;
    }
}

export class VoteDto {
    constructor(network, height, index, type) {
        this._network = network;
        this._height = height;
        this._index = index;
        this._type = type;
    }

    get network() {
        return this._network;
    }

    get height() {
        return this._height;
    }

    get index() {
        return this._index;
    }

    get type() {
        return this._type;
    }
}