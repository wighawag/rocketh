const {
    setupGlobals,
    setup,
    runMigrations,
    rocketh
} = require('./lib');

// if(global.ethereum) {
//     if(global.run) { //TODO detec mocha

//     } 
// } else {
    setupGlobals();

    rocketh.setup = setup;

    module.exports = rocketh;

// }
