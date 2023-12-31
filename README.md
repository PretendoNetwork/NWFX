# NWFX

## What is this?
NWFX is an HTMX-like library for use with NWF (Nintendo Web Framework) titles. The NWF is a development environment used by developers to make WiiU and 3DS titles using web applets, utilizing html, css, and JavaScript. Several games and system titles on the WiiU and 3DS are web applets, which this library targets

## Installation
This software is still heavily in development. The only way to use it is to copy the prebuilt JavaScript from the `dist` folder. Eventually I would like to get this put on a package CDN of some kind, such as [unpkg](https://unpkg.com), and remove the `dist` folder from this repo as it's a build artifact of the `src` TypeScript

## Limitations
This library will likely never be 1:1 compatible with the original HTMX api it is based on, though it tries to be as accurate as possible. This is due to several reasons, most notably:

- WiiU and 3DS browsers lack nearly every modern feature we make use of. They are WebKit based, and have support for features around the release of Chrome 4. This is not a hard rule, however, and they still lacks some features beyond Chrome 1
- Both consoles have abysmal rendering speeds and slow download times. Because of this, the library should remain as simple and small as possible to ensure the fastest download and execution times
- Since this targets specific platforms, not all trigger events will be supported as there's no real way to trigger them, or they simply do not exist on these platforms

While the feature set may not be ever 1:1, the goal is the as accurately implement the functionality which is supported to provide an API which works how you'd expect it to work with HTMX

## Hydration
Due to the above mentioned limitations, a basic form of element hydration is implemented when loading a page and new content from AJAX. Once a page loads, or new content is requested and inserted into the DOM, NWFX will query all un-hydrated elements in the modified area to add their trigger event listeners. Because of this, the `load` event is triggered during the hydration step, *not* the insertion step. Once an element has it's events attached it is given the `nwfx-hydrated` attribute, excluding it from future queries

## API
A subset of the HTMX api is implemented and can be used simply by replacing attributes `hx` with `nwfx` in most simple usages. The current list of supported features is as follows

### Events
A subset of the HTMX events are fired during the execution on the trigger handlers. These events likely do not appear at the exact same times as they would in HTMX, as the libraries are designed very differently, but they should be close enough. Any non-standard HTMX events are marked as such

- `nwfx:xhr:loadstart` - Dispatched on the XHR `loadstart` event. See MDN for details
- `nwfx:xhr:loadend` - Dispatched on the XHR `loadend` event. See MDN for details
- `nwfx:xhr:progress` - Dispatched on the XHR `progress` event. See MDN for details
- `nwfx:xhr:load` - Dispatched on the XHR `load` event. See MDN for details. Non-standard HTMX event
- `nwfx:xhr:abort` - Dispatched on the XHR `abort` event. See MDN for details
- `nwfx:beforeRequest` - Dispatched right before `XMLHttpRequest` is created and setup
- `nwfx:beforeSend` - Dispatched right before `xhr.send` is called
- `nwfx:afterOnLoad` - Dispatched at the end of of handling a successful response
- `nwfx:afterRequest` - Dispatched at the end of of the XHR request regardless of status
- `nwfx:responseError` - Dispatched when XHR gets a non 200-300 response. Contains non-standard event data `event.detail.status` and `event.detail.responseText`

```javascript
document.addEventListener('nwfx:beforeSend', function() {
	// Request is about to be sent
	wiiuBrowser.showLoadingIcon(true);
});
document.addEventListener('nwfx:afterRequest', function() {
	// Request finished, regardless of status
	wiiuBrowser.showLoadingIcon(false);
});
document.addEventListener('nwfx:responseError', function(e) {
	// Request was not 200-300
	wiiuErrorViewer.openByCodeAndMessage(5984000, 'Error: Unable to handle request');
	console.debug(e.detail.status);
	console.debug(e.detail.responseText);
	wiiuBrowser.showLoadingIcon(false);
});
document.addEventListener('nwfx:afterOnLoad', function() {
	// Request was a success
	wiiuBrowser.showLoadingIcon(false);
});
```

### Requests
All elements MUST have one of the following attributes to be hydrated by NWFX. When a request is being made, the element which triggered the request is given the `nwfx-request` class, and any additional triggers are rejected. Only one request per element may be in flight at a time

- `nwfx-get` Issues a GET request
- `nwfx-post` Issues a POST request (Does not currently send data)
- `nwfx-put` Issues a PUT request (Does not currently send data)
- `nwfx-patch` Issues a PATCH request (Does not currently send data)
- `nwfx-delete` Issues a DELETE request

```html
<div nwfx-get="/get-other-content">
	Click me!
</div>
```

### Headers
The following default headers are sent during requests. NWFX does not currently respect response headers

- `NWFX-Request` Always set to "true"
- `NWFX-Current-URL` The current `window.location.href`
- `NWFX-Trigger` The `id` attribute of the element triggering the request. Not sent if element has no `id` set
- `NWFX-Trigger-Name` The `name` attribute of the element triggering the request. Not sent if element has no `name` set
- `NWFX-Target` The `id` attribute of the element targeted for swapping. Not sent if element has no `id` set
- `NWFX-Prompt` Set when prompting is being used

Custom request headers can be set on the triggering element using the `nwfx-headers` attribute, setting a JSON object of headers. Invalid JSON is ignored and no error is given

```html
<button nwfx-headers='{"x-token": "some token"}' nwfx-get="/get">
	Click me
</button>

<button nwfx-headers='invalid' nwfx-get="/get">
	Click me
</button>
```

### Query strings and bodies
Both query strings and request bodies are built using elements `name` and `value` attributes. On `GET` requests these are converted into the requests query string. On all other requests this is sent as a request body with the `Content-Type` header set to `application/x-www-form-urlencoded`

By default, only the triggering element is checked. With `<form>` elements, the `<form>` element is not checked, and instead all it's children and inputs are used

Custom data may also be provided through the `nwfx-vals` attribute. Values passed into `nwfx-vals` are set AFTER the elements attributes and form fields, overwriting any same keys if they exist. Unlike HTMX this must ALWAYS be valid JSON, no values are ever computed for simplicity and security. The `hx-vars` attribute is not implemented and never will be, for the same simplicity and security reasons as well as it being deprecated by HTMX anyway

```html
<button name="button" value="some value" nwfx-get="/get">
	Query string is "button=some%20value"
</button>

<form name="form" name="myform" value="this is ignored" nwfx-post="/post">
	<input type="text" name="username">
	<!-- POST body is username=YOUR_INPUT -->
	<button type="submit">Submit</button>
</form>

<button nwfx-post="/post" nwfx-vals='{"hello": "world", "nwfx": "rocks"}'>
	POST body is hello=world&nwfx=rocks
</button>
```

### Triggers
A basic `nwfx-trigger` implementation is supported. Only the following events are supported

- `click`
- `change`
- `submit`
- `load` (triggered during hydration)

If no trigger is set, the same defaults found in HTMX are used

- `change` for `<input>`, `<textarea>`, and `<select>` elements
- `submit` for `<form>` elements
- `click` for everything else

```html
<div nwfx-get="/get-other-content" nwfx-trigger="load">
	I run and get replaced when loaded
</div>
```

### Trigger Modifiers
The following trigger modifiers are supported

- `once` Only allow an element to trigger it's event once. If using this modifer, once the event has been triggered, the element is given the `nwfx-triggered` attribute and any future events are rejected

```html
<div nwfx-get="/get-other-content" nwfx-trigger="click once">
	I only run once
</div>
```

### Targets
By default the target element is the element dispatching the event. Targeting a different element is supported through the `nwfx-target` attribute. This attribute takes in a query selector

```html
<div nwfx-get="/get-other-content" nwfx-target="#replace-me">
	I replace someone else
</div>

<div id="replace-me">
	My content gets replaced
</div>
```

### Swapping
NWFX supports all the basic swapping methods provided by HTMX

- `innerHTML` Default. Replaces the targets `innerHTML` with the new content
- `outerHTML` Replaces the target with the new content
- `afterbegin` Prepends the content before the first child inside the target
- `beforebegin` Prepends the content before the target in the targets parent element
- `beforeend` Appends the content after the last child inside the target
- `afterend` Appends the content after the target in the targets parent element
- `delete` Ignores response and deletes the target
- `none` Do nothing and do not delete target (Out of band swaps and response headers are *NOT* yet implemented)

```html
<div nwfx-get="/get-other-content" nwfx-swap="outerHTML">
	My content does not get replaced, my whole self does!
</div>
```

### Indicators
Indicators are implemented in the same way as HTMX. Every element with the `nwfx-indicator` class is hidden by default, and is shown again if the parent element has the `nwfx-request` class. By default the following css is used

```css
.nwfx-indicator {
	opacity: 0;
	transition: opacity 200ms ease-in;
}

.nwfx-request .nwfx-indicator {
	opacity: 1;
}

.nwfx-request.indicator {
	opacity: 1;
}
```

When an element is firing an AJAX request the `nwfx-request` class is added to the element, showing all `nwfx-indicator` elements. It is removed after the AJAX request finishes, hiding them again

```html
<div nwfx-get="/get-other-content">
	Click me!
	<img class="nwfx-indicator" src="spinner.gif">
</div>
```

### Boosting
Elements with `nwfx-boost` set to `"true"` will have all of their children `a` tags converted into AJAX requests targeting the `body` element. Forms use their `method` and `action` attributes to determine the HTTP verb and URL. The URL bar does not update

```html
<div nwfx-boost="true">
	<a href="/html">Boosted</a>
	<!--
		This gets converted into
		<a href="/html" nwfx-get="/html" nwfx-target="body" nwfx-hydrated="true">Boosted</a>
	-->
</div>

<div nwfx-boost="true">
	<form action="/get">
		<input type="text" name="test">
		<button type="submit">Submit</button>
	</form>
	<!--
		This gets converted into
		<form action="/get" nwfx-get="/get" nwfx-target="body" nwfx-hydrated="true">
			<input type="text" name="test">
			<button type="submit">Submit</button>
		</form>
	-->
</div>
```

### Confirmation
Elements with the `nwfx-confirm` attribute will ask the user to confirm the action before issuing the AJAX request. Unlike the original HTMX library, if the `once` trigger modifier is used then the element is NOT marked as triggered even if confirmation is declined. I felt this was better user experience

```html
<div nwfx-delete="/account" nwfx-confirm="Are you sure you want to delete your account?">
	Delete account
</div>
```

### Prompting
Elements with the `nwfx-prompt` set will ask the user to enter input before issuing the AJAX request. The input is sent in the `NWFX-Prompt` header. Unlike the original HTMX library, if the `once` trigger modifier is used then the element is NOT marked as triggered even if the prompt is declined. I felt this was better user experience

```html
<div nwfx-post="/search" nwfx-prompt="Enter query">
	Search
</div>
```