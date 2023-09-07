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
    'change',
    'submit',
    'load'
];
function URLEncodeObject(object) {
    return Object.keys(object).map(function (key) { return key + '=' + object[key]; }).join('&');
}
function hydrateHTMLEvents(element) {
    var elements = [];
    element.querySelectorAll('[nwfx-boost="true"]:not([nwfx-hydrated])').forEach(function (booster) {
        booster.querySelectorAll('a:not([nwfx-hydrated])').forEach(function (a) {
            a.setAttribute('nwfx-get', a.href);
            a.setAttribute('nwfx-target', 'body');
        });
        booster.querySelectorAll('form:not([nwfx-hydrated])').forEach(function (form) {
            var verb = form.method || 'post';
            var url = form.action || window.location.href;
            form.setAttribute("nwfx-".concat(verb.toLocaleLowerCase()), url);
            form.setAttribute('nwfx-target', 'body');
        });
        booster.setAttribute('nwfx-hydrated', 'true');
    });
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
    var promptInput = '';
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
    if (triggerTarget.hasAttribute('nwfx-confirm')) {
        if (!confirm(triggerTarget.getAttribute('nwfx-confirm'))) {
            return;
        }
    }
    if (triggerTarget.hasAttribute('nwfx-prompt')) {
        promptInput = prompt(triggerTarget.getAttribute('nwfx-prompt'));
        if (promptInput === null) {
            return;
        }
    }
    if (triggerSettings.includes('once')) {
        triggerTarget.setAttribute('nwfx-triggered', 'true');
    }
    triggerTarget.classList.add('nwfx-request');
    var requestData = {};
    if (triggerTarget.nodeName !== 'FORM' && triggerTarget.hasAttribute('name') && triggerTarget.hasAttribute('value')) {
        requestData[triggerTarget.getAttribute('name')] = triggerTarget.getAttribute('value');
    }
    if (triggerTarget.nodeName === 'FORM') {
        triggerTarget.querySelectorAll('[name]').forEach(function (e) {
            if (e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement) {
                requestData[e.name] = e.value;
            }
            else if (e.hasAttribute('value')) {
                requestData[e.getAttribute('name')] = e.getAttribute('value');
            }
        });
    }
    if (triggerTarget.hasAttribute('nwfx-vals')) {
        try {
            var customData_1 = JSON.parse(triggerTarget.getAttribute('nwfx-vals'));
            Object.keys(customData_1).forEach(function (key) {
                requestData[key] = customData_1[key];
            });
        }
        catch (_a) {
        }
    }
    var requestString = URLEncodeObject(requestData);
    if (verb === 'GET' && requestString.length > 0) {
        url = "".concat(url, "?").concat(requestString);
    }
    document.dispatchEvent(new CustomEvent('nwfx:beforeRequest'));
    var xhr = new XMLHttpRequest();
    xhr.addEventListener('loadstart', function () { return document.dispatchEvent(new CustomEvent('nwfx:xhr:loadstart')); });
    xhr.addEventListener('loadend', function () { return document.dispatchEvent(new CustomEvent('nwfx:xhr:loadend')); });
    xhr.addEventListener('progress', function () { return document.dispatchEvent(new CustomEvent('nwfx:xhr:progress')); });
    xhr.addEventListener('load', function () { return document.dispatchEvent(new CustomEvent('nwfx:xhr:load')); });
    xhr.addEventListener('abort', function () { return document.dispatchEvent(new CustomEvent('nwfx:xhr:abort')); });
    xhr.open(verb, url, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (swapArea === 'delete') {
                triggerTarget.remove();
                document.dispatchEvent(new CustomEvent('nwfx:afterRequest'));
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
                document.dispatchEvent(new CustomEvent('nwfx:afterOnLoad'));
            }
            else {
                document.dispatchEvent(new CustomEvent('nwfx:responseError', {
                    detail: {
                        status: status_1,
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
    var requestHeaders = {};
    if (triggerTarget.hasAttribute('nwfx-headers')) {
        try {
            requestHeaders = JSON.parse(triggerTarget.getAttribute('nwfx-headers'));
        }
        catch (_b) {
        }
    }
    if (triggerTarget.hasAttribute('id')) {
        requestHeaders['NWFX-Trigger'] = triggerTarget.id;
    }
    if (triggerTarget.hasAttribute('name')) {
        requestHeaders['NWFX-Trigger-Name'] = triggerTarget.getAttribute('name');
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
    Object.keys(requestHeaders).forEach(function (key) {
        xhr.setRequestHeader(key, requestHeaders[key]);
    });
    document.dispatchEvent(new CustomEvent('nwfx:beforeSend'));
    xhr.send(requestString);
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