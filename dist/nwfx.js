"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
window.onerror = function myErrorHandler(message, url, line) {
    alert('Error occured on line ' + line + ': ' + message);
    return false;
};
if (!Array.prototype.includes) {
    Array.prototype.includes = function (search) {
        return !!~this.indexOf(search);
    };
}
var defaultTriggers = {
    'INPUT': 'change',
    'TEXTAREA': 'change',
    'SELECT': 'change',
    'FORM': 'submit'
};
var validSwapAreas = [
    'innerHTML',
    'outerHTML',
    'afterbegin',
    'beforebegin',
    'beforeend',
    'afterend',
    'delete',
    'none',
];
var validEvents = [
    'click',
    'load'
];
function hydrateHTMLEvents(element) {
    var e_1, _a;
    var elements = __spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray([], __read(element.querySelectorAll('[nwfx-get]:not([nwfx-hydrated])')), false), __read(element.querySelectorAll('[nwfx-post]:not([nwfx-hydrated])')), false), __read(element.querySelectorAll('[nwfx-put]:not([nwfx-hydrated])')), false), __read(element.querySelectorAll('[nwfx-patch]:not([nwfx-hydrated])')), false), __read(element.querySelectorAll('[nwfx-delete]:not([nwfx-hydrated])')), false);
    try {
        for (var elements_1 = __values(elements), elements_1_1 = elements_1.next(); !elements_1_1.done; elements_1_1 = elements_1.next()) {
            var element_1 = elements_1_1.value;
            var event_1 = 'click';
            if (element_1.hasAttribute('nwfx-trigger')) {
                var triggerSettings = element_1.getAttribute('nwfx-trigger').split(' ');
                if (!validEvents.includes(triggerSettings[0])) {
                    return;
                }
                event_1 = triggerSettings[0];
            }
            else if (defaultTriggers[element_1.nodeName]) {
                event_1 = defaultTriggers[element_1.nodeName];
            }
            element_1.addEventListener(event_1, handleNWFXEvent);
            if (event_1 === 'load') {
                element_1.dispatchEvent(new Event('load'));
            }
            element_1.setAttribute('nwfx-hydrated', 'true');
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (elements_1_1 && !elements_1_1.done && (_a = elements_1.return)) _a.call(elements_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
}
function handleNWFXEvent(event) {
    var triggerTarget = event.target;
    var swapTarget = triggerTarget;
    var swapArea = 'innerHTML';
    var triggerSettings = [];
    var triggerEvent = 'click';
    var verb = '';
    var url = '';
    if (!triggerTarget || !(triggerTarget instanceof HTMLElement)) {
        return;
    }
    if (triggerTarget.hasAttribute('nwfx-triggered') || triggerTarget.classList.contains('nwfx-request')) {
        return;
    }
    if (triggerTarget.hasAttribute('nwfx-get')) {
        verb = 'GET';
        url = triggerTarget.getAttribute('nwfx-get');
    }
    else if (triggerTarget.hasAttribute('nwfx-post')) {
        verb = 'POST';
        url = triggerTarget.getAttribute('nwfx-post');
    }
    else if (triggerTarget.hasAttribute('nwfx-put')) {
        verb = 'PUT';
        url = triggerTarget.getAttribute('nwfx-put');
    }
    else if (triggerTarget.hasAttribute('nwfx-patch')) {
        verb = 'PATCH';
        url = triggerTarget.getAttribute('nwfx-patch');
    }
    else if (triggerTarget.hasAttribute('nwfx-delete')) {
        verb = 'DELETE';
        url = triggerTarget.getAttribute('nwfx-delete');
    }
    else {
        return;
    }
    if (!url) {
        return;
    }
    event.preventDefault();
    if (triggerTarget.hasAttribute('nwfx-target')) {
        swapTarget = document.querySelector(triggerTarget.getAttribute('nwfx-target'));
    }
    if (triggerTarget.hasAttribute('nwfx-swap')) {
        var value = triggerTarget.getAttribute('nwfx-swap');
        if (value && value in validSwapAreas) {
            swapArea = value;
        }
    }
    if (triggerTarget.hasAttribute('nwfx-trigger')) {
        triggerSettings = triggerTarget.getAttribute('nwfx-trigger').split(' ');
        if (!validEvents.includes(triggerSettings[0])) {
            return;
        }
        triggerEvent = triggerSettings[0];
    }
    else if (defaultTriggers[triggerTarget.nodeName]) {
        triggerEvent = defaultTriggers[triggerTarget.nodeName];
    }
    if (event.type !== triggerEvent) {
        return;
    }
    if (triggerSettings.includes('once')) {
        triggerTarget.setAttribute('nwfx-triggered', 'true');
    }
    triggerTarget.classList.add('nwfx-request');
    var xhr = new XMLHttpRequest();
    xhr.open(verb, url, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (swapArea === 'delete') {
                triggerTarget.remove();
                return;
            }
            var status_1 = xhr.status;
            if (status_1 >= 200 && status_1 < 400) {
                if (swapArea !== 'none' && swapTarget && swapTarget instanceof HTMLElement) {
                    // * Used for insertAdjacentElement
                    var html = new DOMParser().parseFromString(xhr.responseText, 'text/html');
                    if (swapArea === 'innerHTML') {
                        swapTarget.innerHTML = xhr.responseText;
                        // * Content is inside the target. Hydrate children
                        hydrateHTMLEvents(swapTarget);
                    }
                    else if (swapArea === 'outerHTML') {
                        swapTarget.outerHTML = xhr.responseText;
                        // * Content replaced the target. Hydrate parent
                        hydrateHTMLEvents(swapTarget.parentElement);
                    }
                    else if (swapArea === 'afterbegin') {
                        swapTarget.insertAdjacentElement('afterbegin', html.documentElement);
                        hydrateHTMLEvents(html);
                    }
                    else if (swapArea === 'beforebegin') {
                        swapTarget.insertAdjacentElement('beforebegin', html.documentElement);
                        hydrateHTMLEvents(html);
                    }
                    else if (swapArea === 'beforeend') {
                        swapTarget.insertAdjacentElement('beforeend', html.documentElement);
                        hydrateHTMLEvents(html);
                    }
                    else if (swapArea === 'afterend') {
                        swapTarget.insertAdjacentElement('afterend', html.documentElement);
                        hydrateHTMLEvents(html);
                    }
                }
            }
            else {
                // TODO - Handle this
            }
            triggerTarget.classList.remove('nwfx-request');
        }
    };
    xhr.send();
}
hydrateHTMLEvents(document);
document.head.insertAdjacentHTML('beforeend', '<style>.nwfx-indicator{opacity:0;transition: opacity 200ms ease-in;}.nwfx-request .nwfx-indicator{opacity:1}.nwfx-request.indicator{opacity:1}</style>');
//# sourceMappingURL=nwfx.js.map