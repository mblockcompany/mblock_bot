import mysql from "mysql";
import dotenv from "dotenv";
import {sendErrorMsg} from "./func.js";
import {logger} from "./log.js";

dotenv.config();

export const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT,
    database: process.env.DB_DATABASE,
    connectionLimit: 30
});

export const insertMissBlockSQL = `insert into missblock_info(chain, height, created, proposer) values (?, ?, ?, ?)`;

export function selectMissBlockSQL(isSetEnd = false) {

    var where = `where Date (created) = ?`;

    if (isSetEnd)
        where = `where DATE (created) between ? and ?`;

    return `SELECT proposer, chain, COUNT(*) AS count FROM missblock.missblock_info ${where} GROUP BY proposer, chain ORDER BY count DESC;`;
}


export function filterDate(date) {
    if (date === null || date.length !== 8)
        return null;

    const year = date.substring(0, 4);
    const month = date.substring(4, 6);
    const day = date.substring(6, 8);

    return `${year}-${month}-${day}`;
}

export function insertMissblockData(chainId, height, date, proposer) {
    pool.getConnection((err, connection) => {
        if (err) {
            logger.error(err);
            return;
        }

        connection.query(insertMissBlockSQL, [chainId, height, date, proposer], (err, results) => {
            connection.release();

            if (err) {
                logger.error(err);
                sendErrorMsg();
            }
        });

    })
}

export async function selectMissblockData(start, end = null) {

    const connection = await getConnection();

    const filterStart = filterDate(start);
    const filterEnd = filterDate(end);

    if (filterStart === null) {
        return null;
    }

    return await new Promise((resolve, reject) => {
        var param = [filterStart];

        if(filterEnd !== null)
            param.push(filterEnd);

        connection.query(selectMissBlockSQL(filterEnd !== null), param, (err, results) => {
            connection.release(); // 연결 해제

            if (err) {
                logger.error(err)
                return reject(err); // 오류 발생 시 reject
            }
            resolve(results); // 결과 반환
        });
    });
}

const getConnection = () => {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            if (err) {
                logger.error(err);
                return reject(err);
            }
            resolve(connection);
        });
    });
};