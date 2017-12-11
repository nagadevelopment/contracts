module.exports = {
    networks: {
        development: {
            host: 'localhost',
            port: 8888,
            network_id: 42
        },
        ropsten: {
            host: 'localhost',
            port: 8545,
            network_id: 3,
            gas: 4000000
        },
        main: {
            host: 'localhost',
            port: 8545,
            network_id: 1,
            gas: 4000000
        }
    }
};
