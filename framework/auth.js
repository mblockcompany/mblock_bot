import * as DB from "./connectionPool.js";
import {logger} from "./log.js";

var authenticationDict = null;

export function getAuthDict() {
    return structuredClone(authenticationDict);
}

export function getAuthentication(chatId) {
    return authenticationDict[chatId];
}

export function setAuthentication(chatId, isAuth) {
    authenticationDict[chatId] = isAuth;
}

export async function initAuth() {
    if(authenticationDict == null) {
        authenticationDict = {};
        const results = await DB.selectAuth();

        if(results == null) {
            logger.error("Auth 조회 실패")
            return;
        }

        results.forEach((row) => {
            authenticationDict[row.id] = true;
        });
    }
}
