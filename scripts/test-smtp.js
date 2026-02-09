/**
 * Script de test de la connexion SMTP Hostinger
 * Usage: node scripts/test-smtp.js
 */

const net = require('net');
const tls = require('tls');

// Configuration SMTP
// Configuration SMTP (depuis les variables d'environnement ou .env.local)
const config = {
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
};

if (!config.user || !config.pass) {
    console.error('❌ Erreur: Les variables SMTP_USER et SMTP_PASSWORD doivent être définies.');
    console.error('Usage: SMTP_USER=votre_email SMTP_PASSWORD=votre_mot_de_passe node scripts/test-smtp.js');
    process.exit(1);
}

console.log('🧪 Test de connexion SMTP Hostinger...\n');

let responseBuffer = '';

// Fonction pour envoyer une commande
function sendCommand(socket, command, expectedCode, stepName, callback) {
    socket.write(command + '\r\n');

    setTimeout(() => {
        const lines = responseBuffer.split('\r\n');
        const lastLine = lines[lines.length - 2] || '';

        if (lastLine.startsWith(expectedCode.toString())) {
            console.log(`   ✅ ${stepName}: OK`);
            responseBuffer = '';
            callback(null);
        } else if (lastLine.match(/^[4-5]\d\d/)) {
            console.log(`   ❌ ${stepName}: ERREUR - ${lastLine}`);
            socket.end();
            callback(new Error(lastLine));
        } else {
            console.log(`   ⏳ ${stepName}: En attente...`);
            callback(null);
        }
    }, 1000);
}

// Connexion initiale
const socket = net.createConnection({
    host: config.host,
    port: config.port,
});

socket.on('data', (data) => {
    responseBuffer += data.toString();
});

socket.on('connect', () => {
    console.log('1. Connexion...');

    setTimeout(() => {
        console.log('   ✅ Connexion: OK');

        // EHLO
        console.log('2. EHLO...');
        sendCommand(socket, `EHLO ${config.host}`, 250, 'EHLO', (err) => {
            if (err) return;

            // STARTTLS
            console.log('3. STARTTLS...');
            sendCommand(socket, 'STARTTLS', 220, 'STARTTLS', (err) => {
                if (err) return;

                // Upgrade vers TLS
                const tlsSocket = tls.connect({
                    socket: socket,
                    servername: config.host,
                    rejectUnauthorized: false,
                });

                responseBuffer = '';

                tlsSocket.on('data', (data) => {
                    responseBuffer += data.toString();
                });

                tlsSocket.on('secureConnect', () => {
                    // EHLO après TLS
                    console.log('4. EHLO (TLS)...');
                    sendCommand(tlsSocket, `EHLO ${config.host}`, 250, 'EHLO (TLS)', (err) => {
                        if (err) return;

                        // AUTH LOGIN
                        console.log('5. AUTH LOGIN...');
                        sendCommand(tlsSocket, 'AUTH LOGIN', 334, 'AUTH LOGIN', (err) => {
                            if (err) return;

                            // Username
                            console.log('6. Username...');
                            const username = Buffer.from(config.user).toString('base64');
                            sendCommand(tlsSocket, username, 334, 'Username', (err) => {
                                if (err) return;

                                // Password
                                console.log('7. Password...');
                                const password = Buffer.from(config.pass).toString('base64');
                                sendCommand(tlsSocket, password, 235, 'Password', (err) => {
                                    if (err) return;

                                    console.log('\n✅ Tous les tests réussis !');
                                    console.log('🎉 La connexion SMTP fonctionne parfaitement.\n');

                                    tlsSocket.write('QUIT\r\n');
                                    setTimeout(() => {
                                        tlsSocket.end();
                                        process.exit(0);
                                    }, 500);
                                });
                            });
                        });
                    });
                });

                tlsSocket.on('error', (err) => {
                    console.error('❌ Erreur TLS:', err.message);
                    process.exit(1);
                });
            });
        });
    }, 500);
});

socket.on('error', (err) => {
    console.error('❌ Erreur de connexion:', err.message);
    process.exit(1);
});

socket.setTimeout(30000);
socket.on('timeout', () => {
    console.error('❌ Timeout de connexion');
    socket.end();
    process.exit(1);
});
