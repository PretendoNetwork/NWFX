"use strict";
window.onerror = function myErrorHandler(message, url, line) {
    alert('Error occured on line ' + line + ': ' + message);
    return false;
};
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
    var elements = [];
    element.querySelectorAll('[nwfx-get]:not([nwfx-hydrated])').forEach(function (e) { return elements.push(e); });
    element.querySelectorAll('[nwfx-post]:not([nwfx-hydrated])').forEach(function (e) { return elements.push(e); });
    element.querySelectorAll('[nwfx-put]:not([nwfx-hydrated])').forEach(function (e) { return elements.push(e); });
    element.querySelectorAll('[nwfx-patch]:not([nwfx-hydrated])').forEach(function (e) { return elements.push(e); });
    element.querySelectorAll('[nwfx-delete]:not([nwfx-hydrated])').forEach(function (e) { return elements.push(e); });
    for (var _i = 0, elements_1 = elements; _i < elements_1.length; _i++) {
        var element_1 = elements_1[_i];
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
                    var html = new DOMParser().parseFromString(xhr.responseText, 'text/html');
                    if (swapArea === 'innerHTML') {
                        swapTarget.innerHTML = xhr.responseText;
                        hydrateHTMLEvents(swapTarget);
                    }
                    else if (swapArea === 'outerHTML') {
                        swapTarget.outerHTML = xhr.responseText;
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
            }
            triggerTarget.classList.remove('nwfx-request');
        }
    };
    xhr.setRequestHeader('NWFX-Request', 'true');
    xhr.setRequestHeader('NWFX-Current-URL', window.location.href);
    if (triggerTarget.hasAttribute('id')) {
        xhr.setRequestHeader('NWFX-Trigger', triggerTarget.id);
    }
    if (triggerTarget.hasAttribute('name')) {
        xhr.setRequestHeader('NWFX-Trigger-Name', triggerTarget.getAttribute('name'));
    }
    if (swapTarget && swapTarget instanceof HTMLElement && swapTarget.hasAttribute('id')) {
        xhr.setRequestHeader('NWFX-Target', swapTarget.id);
    }
    xhr.send();
}
document.addEventListener('DOMContentLoaded', function () {
    document.head.insertAdjacentHTML('beforeend', '<style>.nwfx-indicator{opacity:0;transition: opacity 200ms ease-in;}.nwfx-request .nwfx-indicator{opacity:1}.nwfx-request.indicator{opacity:1}</style>');
    hydrateHTMLEvents(document);
});
Array.prototype.includes = function (search) {
    return !!~this.indexOf(search);
};
NodeList.prototype.forEach = function (callbackfn, thisArg) {
    [].forEach.call(this, callbackfn, thisArg);
};
//# sourceMappingURL=nwfx.js.map