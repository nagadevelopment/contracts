const NAGACoin = artifacts.require('NAGACoin');

module.exports = callback => {
    const checkNetwork = new Promise((resolve, reject) => {
        NAGACoin.web3.version.getNetwork((err, network) => {
            if (err) {
                reject(err);
                return;
            }

            if (artifacts.options.network_id !== '*' && artifacts.options.network_id !== Number(network)) {
                reject(new Error(`Network ${network} is not supported`));
                return;
            }

            resolve(network);
        });
    });

    checkNetwork
        .then(network => {
            return NAGACoin.new()
                .then(token => {
                    NAGACoin.address = token.address;
                    artifacts.options.artifactor.save(NAGACoin);
                    console.log(`Successfully deployed to the network ${network}, address ${token.address}`)
                });
        })
        .catch(callback);
};