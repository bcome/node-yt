module.exports = function() {
    return {
        port: 9999,
        secure: {
            key: fs.readFileSync('client.pem'),
            cert: fs.readFileSync('client.crt')
        },
        selfSigned: true,
        autoRejoin: false,
        floodProtection: true,
        floodProtectionDelay: 1000,

        server: 'irc.example.com',
        nick: 'node-yt',
        userName: 'node-yt',
        realName: 'URL Information Bot',

        myChannels: [],
        debug: true,
        showErrors: true,

        debugChan: '#node-yt',
        admins: ['Lamer'],
        // Use either this or certFP as shown above
        // nsPass: '',

        prefix: '!',

        join_info: {},
        registered: false
    };
};