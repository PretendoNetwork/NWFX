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