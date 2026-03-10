const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'srv2122.hstgr.io',
    user: 'u184662983_crm1',
    password: 'Elite@crm111',
    database: 'u184662983_crm1',
    port: 3306
});

connection.connect((err) => {
    if (err) {
        console.error('Connection Error Code:', err.code);
        console.error('Connection Error Message:', err.message);
        process.exit(1);
    }
    console.log('Successfully connected to Hostinger MySQL!');
    connection.end();
});
