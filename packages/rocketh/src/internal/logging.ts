import {logs} from 'named-logs';

import {hookup, logs as Logging} from 'named-logs-console';
import ora from 'ora';
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
	stop(): PartialOra;
	succeed(msg?: string): PartialOra;
	fail(msg?: string): PartialOra;
};
const voidSpinner: PartialOra = {
	stop() {
		return this;
	},
	succeed(msg?: string) {
		return this;
	},
	fail(msg?: string) {
		return this;
	},
};
// export function spin(message: string): PartialOra {
// 	return Logging.level > 0 ? ora(message).start() : voidSpinner;
// }

let lastSpin = ora('rocketh');
export function spin(message: string): PartialOra {
	if (Logging.level > 0) {
		lastSpin = lastSpin.start(message);
		return lastSpin;
	} else {
		return voidSpinner;
	}
}
