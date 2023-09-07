window.onerror = function myErrorHandler(message, url, line): boolean {
	alert('Error occured on line ' + line + ': ' + message);
	return false;
};

const defaultTriggers: {
	[key: string]: string
} = {
	'INPUT': 'change',
	'TEXTAREA': 'change',
	'SELECT': 'change',
	'FORM': 'submit'
};

const validSwapAreas = [
	'innerHTML',
	'outerHTML',
	'afterbegin',
	'beforebegin',
	'beforeend',
	'afterend',
	'delete',
	'none',
] as const;

type SwapArea = typeof validSwapAreas[number];

const validEvents = [
	'click',
	'change',
	'submit',
	'load'
];

function URLEncodeObject(object: {[key: string]: string}): string {
	return Object.keys(object).map(key => key + '=' + object[key]).join('&');
}

function hydrateHTMLEvents(element: HTMLElement | Document): void {
	const elements: Element[] = [];

	element.querySelectorAll('[nwfx-boost="true"]:not([nwfx-hydrated])').forEach(booster => {
		booster.querySelectorAll('a:not([nwfx-hydrated])').forEach((a: Element) => {
			a.setAttribute('nwfx-get', (a as HTMLAnchorElement).href); // * Just to make TypeScript happy
			a.setAttribute('nwfx-target', 'body');
		});

		booster.querySelectorAll('form:not([nwfx-hydrated])').forEach((form: Element) => {
			const verb = (form as HTMLFormElement).method || 'post';
			const url = (form as HTMLFormElement).action || window.location.href; // TODO - Maybe this shouldn't be the default

			form.setAttribute(`nwfx-${verb.toLocaleLowerCase()}`, url);
			form.setAttribute('nwfx-target', 'body');
		});

		booster.setAttribute('nwfx-hydrated', 'true');
	});

	element.querySelectorAll('[nwfx-get]:not([nwfx-hydrated])').forEach(e => elements.push(e));
	element.querySelectorAll('[nwfx-post]:not([nwfx-hydrated])').forEach(e => elements.push(e));
	element.querySelectorAll('[nwfx-put]:not([nwfx-hydrated])').forEach(e => elements.push(e));
	element.querySelectorAll('[nwfx-patch]:not([nwfx-hydrated])').forEach(e => elements.push(e));
	element.querySelectorAll('[nwfx-delete]:not([nwfx-hydrated])').forEach(e => elements.push(e));

	for (const element of elements) {
		let event = 'click';

		if (element.hasAttribute('nwfx-trigger')) {
			const triggerSettings = element.getAttribute('nwfx-trigger')!.split(' ');

			if (!validEvents.includes(triggerSettings[0])) {
				return;
			}

			event = triggerSettings[0];
		} else if (defaultTriggers[element.nodeName]) {
			event = defaultTriggers[element.nodeName];
		}

		element.addEventListener(event, handleNWFXEvent);

		if (event === 'load') {
			element.dispatchEvent(new Event('load'));
		}

		element.setAttribute('nwfx-hydrated', 'true');
	}
}

function handleNWFXEvent(event: Event): void {
	const triggerTarget = event.target;
	let swapTarget = triggerTarget;
	let swapArea: SwapArea = 'innerHTML';
	let triggerSettings: string[] = [];
	let triggerEvent = 'click';
	let verb = '';
	let url: string | null = '';
	let promptInput: string | null = '';

	if (!triggerTarget || !(triggerTarget instanceof HTMLElement)) {
		return;
	}

	if (triggerTarget.hasAttribute('nwfx-triggered') || triggerTarget.classList.contains('nwfx-request')) {
		return;
	}

	if (triggerTarget.hasAttribute('nwfx-get')) {
		verb = 'GET';
		url = triggerTarget.getAttribute('nwfx-get');
	} else if (triggerTarget.hasAttribute('nwfx-post')) {
		verb = 'POST';
		url = triggerTarget.getAttribute('nwfx-post');
	} else if (triggerTarget.hasAttribute('nwfx-put')) {
		verb = 'PUT';
		url = triggerTarget.getAttribute('nwfx-put');
	} else if (triggerTarget.hasAttribute('nwfx-patch')) {
		verb = 'PATCH';
		url = triggerTarget.getAttribute('nwfx-patch');
	} else if (triggerTarget.hasAttribute('nwfx-delete')) {
		verb = 'DELETE';
		url = triggerTarget.getAttribute('nwfx-delete');
	} else {
		return;
	}

	if (!url) {
		return;
	}

	event.preventDefault();

	if (triggerTarget.hasAttribute('nwfx-target')) {
		swapTarget = document.querySelector(triggerTarget.getAttribute('nwfx-target')!);
	}

	if (triggerTarget.hasAttribute('nwfx-swap')) {
		const value = triggerTarget.getAttribute('nwfx-swap');
		if (value && value in validSwapAreas) {
			swapArea = value as SwapArea;
		}
	}

	if (triggerTarget.hasAttribute('nwfx-trigger')) {
		triggerSettings = triggerTarget.getAttribute('nwfx-trigger')!.split(' ');

		if (!validEvents.includes(triggerSettings[0])) {
			return;
		}

		triggerEvent = triggerSettings[0];
	} else if (defaultTriggers[triggerTarget.nodeName]) {
		triggerEvent = defaultTriggers[triggerTarget.nodeName];
	}

	if (event.type !== triggerEvent) {
		return;
	}

	if (triggerTarget.hasAttribute('nwfx-confirm')) {
		if (!confirm(triggerTarget.getAttribute('nwfx-confirm')!)) {
			return;
		}
	}

	if (triggerTarget.hasAttribute('nwfx-prompt')) {
		promptInput = prompt(triggerTarget.getAttribute('nwfx-prompt')!);

		if (promptInput === null) {
			return;
		}
	}

	if (triggerSettings.includes('once')) {
		triggerTarget.setAttribute('nwfx-triggered', 'true');
	}

	triggerTarget.classList.add('nwfx-request');

	const requestData: {
		[key: string]: string
	} = {};

	if (triggerTarget.nodeName !== 'FORM' && triggerTarget.hasAttribute('name') && triggerTarget.hasAttribute('value')) {
		// * Forms in HTMX don't respect their own name/value attributes
		requestData[triggerTarget.getAttribute('name')!] = triggerTarget.getAttribute('value')!;
	}

	if (triggerTarget.nodeName === 'FORM') {
		triggerTarget.querySelectorAll('[name]').forEach(e => {
			if (e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement) {
				requestData[e.name] = e.value;
			} else if (e.hasAttribute('value')) {
				requestData[e.getAttribute('name')!] = e.getAttribute('value')!;
			}
		});
	}

	const requestString = URLEncodeObject(requestData);

	if (verb === 'GET' && requestString.length > 0) {
		url = `${url}?${requestString}`;
	}

	document.dispatchEvent(new CustomEvent('nwfx:beforeRequest'));

	const xhr = new XMLHttpRequest();

	xhr.addEventListener('loadstart', () => document.dispatchEvent(new CustomEvent('nwfx:xhr:loadstart')));
	xhr.addEventListener('loadend', () => document.dispatchEvent(new CustomEvent('nwfx:xhr:loadend')));
	xhr.addEventListener('progress', () => document.dispatchEvent(new CustomEvent('nwfx:xhr:progress')));
	xhr.addEventListener('load', () => document.dispatchEvent(new CustomEvent('nwfx:xhr:load')));
	xhr.addEventListener('abort', () => document.dispatchEvent(new CustomEvent('nwfx:xhr:abort')));

	xhr.open(verb, url, true);
	xhr.onreadystatechange = (): void => {
		if (xhr.readyState === XMLHttpRequest.DONE) {
			if (swapArea === 'delete') {
				triggerTarget.remove();
				document.dispatchEvent(new CustomEvent('nwfx:afterRequest'));
				return;
			}

			const status = xhr.status;

			if (status >= 200 && status < 400) {
				if (swapArea !== 'none' && swapTarget && swapTarget instanceof HTMLElement) {
					// * Used for insertAdjacentElement
					const html = new DOMParser().parseFromString(xhr.responseText, 'text/html');

					if (swapArea === 'innerHTML') {
						swapTarget.innerHTML = xhr.responseText;
						// * Content is inside the target. Hydrate children
						hydrateHTMLEvents(swapTarget);
					} else if (swapArea === 'outerHTML') {
						swapTarget.outerHTML = xhr.responseText;
						// * Content replaced the target. Hydrate parent
						hydrateHTMLEvents(swapTarget.parentElement!);
					} else if (swapArea === 'afterbegin') {
						swapTarget.insertAdjacentElement('afterbegin', html.documentElement);
						hydrateHTMLEvents(html);
					} else if (swapArea === 'beforebegin') {
						swapTarget.insertAdjacentElement('beforebegin', html.documentElement);
						hydrateHTMLEvents(html);
					} else if (swapArea === 'beforeend') {
						swapTarget.insertAdjacentElement('beforeend', html.documentElement);
						hydrateHTMLEvents(html);
					} else if (swapArea === 'afterend') {
						swapTarget.insertAdjacentElement('afterend', html.documentElement);
						hydrateHTMLEvents(html);
					}
				}

				document.dispatchEvent(new CustomEvent('nwfx:afterOnLoad'));
			} else {
				document.dispatchEvent(new CustomEvent('nwfx:responseError', {
					detail: {
						status: status,
						responseText: xhr.responseText
					}
				}));
			}

			triggerTarget.classList.remove('nwfx-request');
			document.dispatchEvent(new CustomEvent('nwfx:afterRequest'));
		}
	};

	xhr.setRequestHeader('NWFX-Request', 'true');
	xhr.setRequestHeader('NWFX-Current-URL', window.location.href);

	let requestHeaders: {
		[key: string]: string
	} = {};

	if (triggerTarget.hasAttribute('nwfx-headers')) {
		try {
			requestHeaders = JSON.parse(triggerTarget.getAttribute('nwfx-headers')!);
		} catch {
			// * Eat the error, we don't care for now
		}
	}

	if (triggerTarget.hasAttribute('id')) {
		requestHeaders['NWFX-Trigger'] = triggerTarget.id;
	}

	if (triggerTarget.hasAttribute('name')) {
		requestHeaders['NWFX-Trigger-Name'] = triggerTarget.getAttribute('name')!;
	}

	if (swapTarget && swapTarget instanceof HTMLElement && swapTarget.hasAttribute('id')) {
		requestHeaders['NWFX-Target'] = swapTarget.id;
	}

	if (triggerTarget.hasAttribute('nwfx-prompt')) {
		requestHeaders['NWFX-Prompt'] = promptInput;
	}

	if (verb !== 'GET') {
		requestHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
	}

	Object.keys(requestHeaders).forEach(key => {
		xhr.setRequestHeader(key, requestHeaders[key]);
	});

	document.dispatchEvent(new CustomEvent('nwfx:beforeSend'));

	xhr.send(requestString);
}

document.addEventListener('DOMContentLoaded', () => {
	document.head.insertAdjacentHTML('beforeend', '<style>.nwfx-indicator{opacity:0;transition: opacity 200ms ease-in;}.nwfx-request .nwfx-indicator{opacity:1}.nwfx-request.indicator{opacity:1}</style>');
	hydrateHTMLEvents(document);
});