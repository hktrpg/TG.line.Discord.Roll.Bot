'use strict';

const net = require('node:net');
const { once } = require('node:events');
// eslint-disable-next-line n/no-extraneous-require -- Exercise the actual transitive consumer without adding a direct dependency.
const { getUri } = require('get-uri');

// Exercise get-uri's actual basic-ftp consumer using temporary loopback servers.
// No application configuration, credentials, or external FTP service is loaded.
async function ftpFixture(useLastModified) {
    const payload = 'loopback proxy configuration\n';
    const commands = [];
    const sockets = new Set();
    const servers = new Set();
    const track = socket => {
        sockets.add(socket);
        socket.on('error', () => {});
        socket.once('close', () => sockets.delete(socket));
        return socket;
    };
    const listen = async server => {
        servers.add(server);
        server.listen(0, '127.0.0.1');
        await once(server, 'listening');
        return server.address().port;
    };
    const control = net.createServer(socket => {
        track(socket).setEncoding('utf8');
        socket.write('220 Loopback test server\r\n');
        let buffer = '';
        let pending = Promise.resolve();
        let dataConnection;
        async function respond(line) {
            const command = line.split(' ')[0].toUpperCase();
            commands.push(command);
            const reply = value => socket.write(value + '\r\n');
            switch (command) {
                case 'USER': reply('331 Password required'); break;
                case 'PASS': reply('230 Logged in'); break;
                case 'FEAT': reply('211-Features\r\n MLST type*;size*;modify*;\r\n211 End'); break;
                case 'MDTM': reply(useLastModified ? '213 20261026000000' : '500 MDTM unsupported'); break;
                case 'EPSV': {
                    let accept;
                    dataConnection = new Promise(resolve => { accept = resolve; });
                    const dataServer = net.createServer(data => {
                        accept(track(data));
                        dataServer.close();
                    });
                    reply(`229 Entering Extended Passive Mode (|||${await listen(dataServer)}|)`);
                    break;
                }
                case 'MLSD':
                case 'LIST':
                case 'RETR': {
                    reply('150 Opening data connection');
                    const data = await dataConnection;
                    data.end(command === 'RETR' ? payload
                        : `type=file;size=${Buffer.byteLength(payload)};modify=20261026000000; proxy.pac\r\n`);
                    reply('226 Transfer complete');
                    break;
                }
                case 'QUIT': socket.end('221 Goodbye\r\n'); break;
                default: reply('200 OK');
            }
        }
        socket.on('data', chunk => {
            buffer += chunk;
            let end;
            while ((end = buffer.indexOf('\r\n')) >= 0) {
                const line = buffer.slice(0, end);
                buffer = buffer.slice(end + 2);
                pending = pending.then(() => respond(line)).catch(() => socket.destroy());
            }
        });
    });
    const port = await listen(control);
    return {
        url: `ftp://127.0.0.1:${port}/proxy.pac`, payload, commands,
        async close() {
            for (const socket of sockets) socket.destroy();
            await Promise.all([...servers].map(server => new Promise(resolve => server.close(resolve))));
        }
    };
}

test.each([true, false])('get-uri downloads and caches FTP content with MDTM=%s', async useLastModified => {
    const fixture = await ftpFixture(useLastModified);
    try {
        const stream = await getUri(fixture.url, { timeout: 1500 });
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        expect(Buffer.concat(chunks).toString()).toBe(fixture.payload);
        expect(stream.lastModified).toEqual(new Date('2026-10-26T00:00:00Z'));
        expect(fixture.commands).toContain('RETR');
        if (!useLastModified) expect(fixture.commands).toContain('MLSD');
        await expect(getUri(fixture.url, { timeout: 1500, cache: stream }))
            .rejects.toMatchObject({ code: 'ENOTMODIFIED' });
        expect(fixture.commands.filter(command => command === 'RETR')).toHaveLength(1);
    } finally {
        await fixture.close();
    }
}, 10_000);
