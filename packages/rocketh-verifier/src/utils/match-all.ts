// taken  from package match-all
export function matchAll(s: string, r: RegExp) {
	return {
		input: s,
		regex: r,

		/**
		 * next
		 * Get the next match in single group match.
		 *
		 * @name next
		 * @function
		 * @return {String|null} The matched snippet.
		 */
		next() {
			let c = this.nextRaw();
			if (c) {
				for (let i = 1; i < c.length; i++) {
					if (c[i]) {
						return c[i];
					}
				}
			}
			return null;
		},

		/**
		 * nextRaw
		 * Get the next match in raw regex output. Usefull to get another group match.
		 *
		 * @name nextRaw
		 * @function
		 * @returns {Array|null} The matched snippet
		 */
		nextRaw() {
			let c = this.regex.exec(this.input);
			return c;
		},

		/**
		 * toArray
		 * Get all the matches.
		 *
		 * @name toArray
		 * @function
		 * @return {Array} The matched snippets.
		 */
		toArray() {
			let res = [],
				c = null;

			while ((c = this.next())) {
				res.push(c);
			}

			return res;
		},

		/**
		 * reset
		 * Reset the index.
		 *
		 * @name reset
		 * @function
		 * @param {Number} i The new index (default: `0`).
		 * @return {Number} The new index.
		 */
		reset(i: number = 0) {
			return (this.regex.lastIndex = i);
		},
	};
}
