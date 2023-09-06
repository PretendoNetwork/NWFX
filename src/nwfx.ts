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
	'load'
];

function hydrateHTMLEvents(element: HTMLElement | Document): void {
	const elements: Element[] = [];

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
	let verb: string = '';
	let url: string | null = '';

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

	if (triggerSettings.includes('once')) {
		triggerTarget.setAttribute('nwfx-triggered', 'true');
	}

	triggerTarget.classList.add('nwfx-request');

	const xhr = new XMLHttpRequest();

	xhr.open(verb, url, true);
	xhr.onreadystatechange = (): void => {
		if (xhr.readyState === XMLHttpRequest.DONE) {
			if (swapArea === 'delete') {
				triggerTarget.remove();
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
			} else {
				// TODO - Handle this
			}

			triggerTarget.classList.remove('nwfx-request');
		}
	};

	xhr.send();
}

document.addEventListener('DOMContentLoaded', () => {
	document.head.insertAdjacentHTML('beforeend', '<style>.nwfx-indicator{opacity:0;transition: opacity 200ms ease-in;}.nwfx-request .nwfx-indicator{opacity:1}.nwfx-request.indicator{opacity:1}</style>');
	hydrateHTMLEvents(document);
});