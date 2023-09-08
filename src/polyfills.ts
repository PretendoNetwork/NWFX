// * Polyfills for modern features the WiiU doesn't support
// * but that we make use of multiple times
Array.prototype.includes = function(search): boolean {
	return !!~this.indexOf(search);
};

// * Using --downlevelIteration to polyfill the ES6
// * spread syntax adds a kilobyte to the minified
// * bundle. This is the smallest way to do this.
// * Forgive me
// *
// * callbackfn is set to any just to get TS to compile this
NodeList.prototype.forEach = function(callbackfn: any, thisArg?): void {
	[].forEach.call(this, callbackfn, thisArg);
};

// * Old 3DS browser doesn't support classList
if (Element.prototype.classList === undefined) {
	class ClassList {
		private element: Element;
		private classList: string[];

		constructor(element: Element) {
			this.element = element;
			this.classList = this.element.className.split(' ');
		}

		private updateClassName(): void {
			this.element.className = this.classList.join(' ');
		}

		contains(token: string): boolean {
			return this.classList.includes(token);
		}

		add(...tokens: string[]): void {
			for (const token of tokens) {
				this.classList.push(token);
			}

			this.updateClassName();
		}

		remove(...tokens: string[]): void {
			for (const token of tokens) {
				let i = 0;

				while (i < this.classList.length) {
					if (this.classList[i] === token) {
						this.classList.splice(i, 1);
					} else {
						++i;
					}
				}
			}

			this.updateClassName();
		}
	}

	Object.defineProperty(Element.prototype, 'classList', {
		get: function () {
			return new ClassList(this);
		},
		enumerable: true,
		configurable: true
	});
}