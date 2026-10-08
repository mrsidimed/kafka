// const mysql = require('mysql');
// envVars = require('./environmentVariables.json');
// const fs = require('fs');



// var dbParams;


// if (envVars['production']) {
//     dbParams = require('./params_project_mysql/dbParametersProd.json');
// } else {
//     dbParams = require('./params_project_mysql/dbParameters.json');
// }


// connection = null;
// class singletonConnection {

//     constructor() {


//     }

//     getConnection(callback) {


//         if (connection && connection.state !== 'disconnected') {

//             return callback(null, connection);

//         } else {

//             var mycon = mysql.createConnection({
//                 host: dbParams['host'],
// 		        port: dbParams['port'],
//                 user: dbParams['user'],
//                 password: dbParams['password'],
//                 database: dbParams['database']

//             });

//             mycon.connect(function (err) {

//                 if (err) {
                  
//                     console.log("error while connectig to the DB");
// 		            console.log("err = "+err);

//                     logException(err);

//                     return callback(err, null);

//                 } else {

//                     console.log("connected to db");

//                     connection = mycon;
//                     return callback(null, connection);

//                 }

//             });



//             mycon.on('error', function (err) {
//                 logException(err);
//                 return callback(err, null);

//             });


//         }


//     }

// }



// function logException(error) {


//     if (!fs.existsSync('./logs')) {
//         fs.mkdirSync('./logs');
//     }
//     fs.appendFileSync('./logs/' + new Date().toISOString().split('T')[0], new Date().toISOString() + ' mySingletonConnection.js: ' + error + '\n\n');

// }


// const mySingletonConnection = new singletonConnection();


// module.exports = mySingletonConnection;













const mysql = require('mysql');
const fs = require('fs');
const envVars = require('./environmentVariables.json');

const dbParams = envVars['production']
    ? require('./params_project_mysql/dbParametersProd.json')
    : require('./params_project_mysql/dbParameters.json');

const RETRY_DELAY_MS = 5000;   // delay between connection attempts
const WAIT_TICK_MS = 1000;     // how often onWait (e.g. Kafka heartbeat) is called while waiting

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));


class SingletonConnection {

    constructor() {
        this.connection = null;
        this.connecting = null; // shared promise while a reconnect loop is running
    }

    isAlive() {
        const state = this.connection?.state;
        return state === 'connected' || state === 'authenticated';
    }

    // One connection attempt
    tryConnect() {
        return new Promise((resolve, reject) => {
            const mycon = mysql.createConnection({
                host: dbParams['host'],
                port: dbParams['port'],
                user: dbParams['user'],
                password: dbParams['password'],
                database: dbParams['database']
            });

            // Runtime errors (connection lost, etc.): drop the connection so the next caller reconnects
            mycon.on('error', err => {
                logException('connection error: ' + err);
                if (this.connection === mycon) {
                    this.connection = null;
                }
            });

            mycon.connect(err => {
                if (err) {
                    mycon.destroy();
                    return reject(err);
                }
                resolve(mycon);
            });
        });
    }

    // Retry every RETRY_DELAY_MS until the DB answers. Never rejects.
    async connectLoop() {
        let attempt = 0;

        while (true) {
            attempt++;
            try {
                const con = await this.tryConnect();
                this.connection = con;
                console.log(`connected to db (attempt ${attempt})`);
                logException(`connected to db (attempt ${attempt})`);
                return con;
            } catch (err) {
                const retryMessage = `DB connection attempt ${attempt} failed: ${err.message} - retrying in ${RETRY_DELAY_MS / 1000}s`;
                console.log(retryMessage);
                logException(retryMessage);
                await sleep(RETRY_DELAY_MS);
            }
        }
    }

    // Resolves only once a live connection exists.
    // onWait (optional, async) is called about every second while waiting, e.g. Kafka's heartbeat().
    async waitForConnection(onWait) {
        if (this.isAlive()) {
            return this.connection;
        }

        // All callers share the same reconnect loop
        if (!this.connecting) {
            this.connecting = this.connectLoop().finally(() => { this.connecting = null; });
        }

        const pending = this.connecting;
        let connected = false;
        pending.then(() => { connected = true; });

        while (!connected) {
            if (onWait) {
                await onWait();
            }
            await Promise.race([pending, sleep(WAIT_TICK_MS)]);
        }

        return pending;
    }

    // Callback API kept for existing code: blocks until connected, never returns an error
    getConnection(callback) {
        this.waitForConnection()
            .then(con => process.nextTick(callback, null, con));
    }
}


function logException(error) {
    if (!fs.existsSync('./logs')) {
        fs.mkdirSync('./logs');
    }
    fs.appendFileSync('./logs/' + new Date().toISOString().split('T')[0], new Date().toISOString() + ' mySingletonConnection.js: ' + error + '\n\n');
}


const mySingletonConnection = new SingletonConnection();

module.exports = mySingletonConnection;