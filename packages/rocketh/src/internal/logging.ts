import {logs} from 'named-logs';

import {hookup, logs as Logging} from 'named-logs-console';
// import ora from 'ora-cjs';
hookup();

export function setLogLevel(level: number) {
	Logging.level = level;
	if (Logging.level > 0) {
		Logging.enable();
	} else {
		Logging.disable();
	}
}

export const logger = logs('rocketh');

type PartialOra = {
	start(msg?: string): PartialOra;
	stop(): PartialOra;
	succeed(msg?: string): PartialOra;
	fail(msg?: string): PartialOra;
};
const voidSpinner: PartialOra = {
	start(msg?: string) {
		if (msg) {
			console.log(msg);
		}
		return this;
	},
	stop() {
		return this;
	},
	succeed(msg?: string) {
		console.log(msg);
		return this;
	},
	fail(msg?: string) {
		console.error(msg);
		return this;
	},
};
// export function spin(message: string): PartialOra {
// 	return Logging.level > 0 ? ora(message).start() : voidSpinner;
// }

// let lastSpin = ora('rocketh');
let lastSpin = voidSpinner;
export function spin(message?: string): PartialOra {
	if (Logging.level > 0) {
		lastSpin = lastSpin.start(message);
		return lastSpin;
	} else {
		return voidSpinner;
	}
}
