import {logs} from 'named-logs';

import {ProgressIndicator} from '@rocketh/core/types';

export const logger = logs('rocketh');

const loggerProgressIndicator: ProgressIndicator = {
	start(msg?: string) {
		if (msg) {
			logger.log(msg);
		}
		return this;
	},
	stop() {
		return this;
	},
	succeed(msg?: string) {
		if (msg) {
			logger.log(msg);
		}
		return this;
	},
	fail(msg?: string) {
		if (msg) {
			logger.error(msg);
		}
		return this;
	},
};

let lastSpin = loggerProgressIndicator;
export function spin(message?: string): ProgressIndicator {
	lastSpin = lastSpin.start(message);
	return lastSpin;
}
