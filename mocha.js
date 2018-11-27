const {
    setupGlobals,
    waitForMocha,
} = require('./lib');

setupGlobals(true);

const describeFunctions = [];
global.describe = (text, fn) => {
    describeFunctions.push({text,fn});
}

waitForMocha();
