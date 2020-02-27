/**
 * DataFormsJS Home Page
 *
 * The home page uses <template> rather than Handlebars or other rendering
 * engines so that example code is display rather than rendered.
 *
 * This script also includes animation code for the Computer SVG Image. Elements
 * are grouped into scenes and a simple animation loop is used. The process of
 * creating and updating the animated scenes is manual and time consuming.
 * The images are first drawn in Sketch App and then exported to SVG and
 * additional attribures are copied for each element to this file.
 * Additional details are in comments later in this file.
 *
 * IMPORTANT - When adding additional languages for the computer animation
 * search this file for "app.plugins.i18n.currentLocale" and see related comments.
 */

/*

Steps used to create (or re-create the computer)

1) In Sketch App unique elements from multiple computer items are combined to one page
2) The Elements on the Artboard are copied as SVG then pasted into the file [public/html/home-page.htm]
3) Add [id="home-page-computer"] to the root <svg> element
4) Add [data-i18n] attributes for the text instead of having text content
    data-i18n="filter"
    data-i18n="user_name"
    data-i18n="password"
    data-i18n="login"
5) [Row-2] to [Row-7] add [fill-opacity="0"]
6) For [Text-Filter] and [Oval-1] to [Oval-3] add [opacity="0"]
7) Replace the generated [id="Rectangle-1"] <path> with the following
    <rect id="Rectangle-1" fill="#D0011B" x="193" y="88" width="335" height="50" rx="5"></rect>
    * This element was orginally exported by Sketch as a <rect> but after updates (not sure if 
        either the drawing or recent version of Sketch) it ended up being a <path>
8) Depending on the version of Sketch used these instructions may vary,
    so if making updates keep the old version commented for quick compare
    until all updates are confirmed.
9) On the root <svg> element change:
        height="481px" viewBox="0 0 700 481"
    To:
        height="490px" viewBox="0 0 700 490"
    * This is due to the [drop-shadow] set from CSS so that it
        shows correctly on the mobile device images.
10) To make changes to the individual scene export each computer image from
    Sketch then copy the exported attributes for the element to update to
    the correct scene/element in JavaScript.
*) Important - To easily switch between Desktop and Mobile use of an SVG
    <rect> element rather than the <g><path> is needed so if Sketch exports
    a <path> for the Frame or Screen then it must be corrected.

*/

/* Validates with both [jshint] and [eslint] */
/* global app */
/* jshint strict: true */
/* eslint-env browser */
/* eslint quotes: ["error", "single", { "avoidEscape": true }] */
/* eslint strict: ["error", "function"] */
/* eslint spaced-comment: ["error", "always"] */
/* eslint no-console: ["error", { allow: ["log", "warn", "error"] }] */

(function () {
    'use strict';

    var animation = null;
    var pendingElements = null;

    // Animation Loop
    function loop() {
        var scene = animation.scenes[animation.currentScreen];
        scene.animateEndCount = 0;
        scene.elementCount = 0;
        var elements = scene.elements;

        // Handle [transitionend] events for each element
        // Once all called on all elements the loop function
        // gets called again.
        /* jshint validthis: true */
        function transitionEnd() {
            if (animation.consoleOutput) {
                console.log('----------------------------');
                console.log('transitionEnd: ' + this.id);
                pendingElements.splice(pendingElements.indexOf(this.id), 1);
            }
            this.removeEventListener('transitionend', transitionEnd);

            scene.animateEndCount++;
            if (animation.consoleOutput) {
                console.log('scene.animateEndCount: ' + scene.animateEndCount);
                console.log('scene.elementCount: ' + scene.elementCount);
                console.log('Pending: ' + pendingElements.join(', '));
                console.log('----------------------------');
            }

            if (scene.animateEndCount === scene.elementCount) {
                if (animation.currentScreen === (animation.scenes.length - 1)) {
                    animation.currentScreen = 0;
                } else {
                    animation.currentScreen++;
                }

                if (animation.stopScreen !== (animation.currentScreen + 1)) {
                    window.setTimeout(loop, (scene.sceneDelay ? scene.sceneDelay : animation.delay));
                }
            }
        }

        // Start the transition by setting element attributes and event listener
        function transitionStart(domEl) {
            var transition = (animEl.transition === undefined ? null : animEl.transition);
            if (transition === null) {
                transition = (scene.transition === undefined ? animation.transition : scene.transition);
            }

            domEl.style.transition = transition;
            attributes.forEach(function(attr) {
                domEl.setAttribute(attr.name, attr.value);
            });

            if (animation.consoleOutput) {
                pendingElements.push(domEl.id);
            }

            scene.elementCount++;
            domEl.addEventListener('transitionend', transitionEnd);
        }

        function setAttributes(el, attributes) {
            attributes.forEach(function(attr) {
                el.setAttribute(attr.name, attr.value);
            });
        }

        if (animation.consoleOutput) {
            console.log('===========================');
            console.log('animation.currentScreen:' + animation.currentScreen);
            pendingElements = [];
        }

        // Setup Animation for each element
        for (var n = 0, m = elements.length; n < m; n++) {
            var animEl = elements[n];
            var attributes = animEl.attributes.match(/([^=]+)="[^"]*"/g);

            if (animation.consoleOutput) {
                console.log('----------------------------');
                console.log(animEl.selector);
            }
            for (var x = 0, y = attributes.length; x < y; x++) {
                var attr = attributes[x].trim();
                var pos = attr.indexOf('=');
                var name = attr.substr(0, pos);
                var value = attr.substr(pos+2, attr.length-name.length-3);
                if (animation.consoleOutput) {
                    console.log(name + ' = ' + value);
                }
                attributes[x] = {
                    name: name,
                    value: value
                };
            }

            var domEls = document.querySelectorAll(animEl.selector);
            if (animEl.noAnimate) {
                // Nested <tspan> elements cannot be annimated
                for (var j = 0, k = domEls.length; j < k; j++) {
                    setAttributes(domEls[j], attributes);
                }
            } else {
                Array.prototype.forEach.call(domEls, transitionStart);
            }
        }

        if (animation.consoleOutput) {
            console.log('--------------------------');
            console.log('scene.elementCount: ' + scene.elementCount);
        }
    }

    /**
     * Create Page Object
     */
    var homePage = {
        /**
         * Define the Model
         */
        model: {
            // Keep track of selected examples between page changes
            activeExamples: {
                helloWorld: 'hello-world-hbs',
                jsonData: 'json-data-hbs',
            },

            // Click event for [.example-page] elements
            changeTemplate: function(e) {
                // Get elements and attributes
                var model = this;
                var selectedExample = e.target;
                var page = selectedExample.getAttribute('data-page');
                var className = selectedExample.getAttribute('data-class');
                var link = selectedExample.getAttribute('data-link');
                var parent = selectedExample.parentNode.parentNode.parentNode;

                // Update links
                var links = parent.querySelectorAll('a');
                Array.prototype.forEach.call(links, function(el) {
                    el.style.display = 'none';
                });
                document.getElementById(link).style.display = '';

                // Update HTML Control - <code data-template-url="url">
                var code = parent.querySelector('code');
                code.setAttribute('data-template-url', page);
                code.setAttribute('class', className);

                // Refresh the control, this will dynamically download templates
                // as they are viewed and then cache them in memory so they are
                // downloaded only once.
                app.refreshHtmlControl(code, function() {
                    // Re-highlight Code
                    app.plugins.i18n.onRendered(parent);
                    app.plugins.prism.onRendered(parent);

                    // Update description and set width based on code
                    var description = parent.querySelector('.description');
                    description.textContent = selectedExample.getAttribute('data-description');
                    description.style.maxWidth = code.offsetWidth + 'px';

                    // Set "active" button
                    var allPages = parent.querySelectorAll('.example-page');
                    Array.prototype.forEach.call(allPages, function(page) {
                        page.classList.remove('active');
                    });
                    selectedExample.classList.add('active');

                    // Save template language so it appears when page is loaded
                    model.activeExamples[parent.getAttribute('data-example')] = selectedExample.getAttribute('data-link');
                });
            },

            // Called once every time the page is loaded
            setupExamples: function() {
                // Reference the current model and get examples
                var model = this;
                var examples = document.querySelectorAll('.example-code');
                Array.prototype.forEach.call(examples, function(example) {
                    // Get elements under each example
                    var selected = example.querySelector('.example-page.active');
                    var allPages = example.querySelectorAll('.example-page');
                    var active = model.activeExamples[example.getAttribute('data-example')];

                    // Change template if needed
                    if (!(selected && selected.getAttribute('data-link') === active)) {
                        selected = document.querySelector('.example-page[data-link="' + active + '"]');
                        model.changeTemplate({ target:selected });
                    } else {
                        // Set description width based on code
                        example.querySelector('.description').style.maxWidth = example.querySelector('code').offsetWidth + 'px';
                    }

                    // Setup click events
                    Array.prototype.forEach.call(allPages, function(page) {
                        page.onclick = model.changeTemplate.bind(model);
                    });
                });
            },

            setupAnimation: function() {
                animation = {
                    transition: 'all 1s ease',
                    delay: 1000,
                    currentScreen: 1, // Start animating to the 2nd screen
                    stopScreen: null, // Use for debugging (null or a number)
                    consoleOutput: false, // Use for debugging

                    // Define Scene's, Attributes are generated by creating multiple
                    // versions of the SVG for the different elements and manually
                    // copying the attributes from the SVG/XML.
                    scenes: [
                        // Starting Scene [Computer-Screen-1]
                        {
                            elements: [
                                {
                                    selector: '#Frame',
                                    attributes: 'x="10.5" y="10.5" width="699" height="399"',
                                },
                                {
                                    selector: '#Screen',
                                    attributes: 'x="25.5" y="25.5" width="669" height="369"',
                                },
                                {
                                    selector: '#Oval-1, #Oval-2, #Oval-3',
                                    attributes: 'opacity="0"',
                                    transition: 'all 0.1s ease',
                                },
                                {
                                    selector: '#Stand, #Base',
                                    attributes: 'opacity="1"',
                                    transition: 'opacity 0.1s ease',
                                },
                                {
                                      selector: '#Login-Bg',
                                      attributes: 'opacity="1"',
                                },
                                {
                                      selector: '#Text-User-Name, #Text-Password, #Text-Login',
                                      attributes: 'opacity="1"',
                                },
                                {
                                    selector: '#Text-DataFormsJS tspan',
                                    attributes: 'x="236" y="126"',
                                    noAnimate: true,
                                },
                                {
                                    selector: '#Rectangle-1',
                                    attributes: 'x="193" y="88" width="335" height="50"',
                                },
                                {
                                    selector: '#Rectangle-2',
                                    attributes: 'stroke="none" fill="#0000CC" x="245" y="283" width="230" height="50"',
                                },
                                {
                                    selector: '#Input-1',
                                    attributes: 'fill="#FFFFFF" x="245" y="166" width="230" height="32" stroke="#979797" rx="5"',
                                },
                                {
                                    selector: '#Input-2',
                                    attributes: 'fill="#FFFFFF" x="245" y="223" width="230" height="32" stroke="#979797" rx="5"',
                                },
                            ],
                        },
                        // [Computer-Screen-2]
                        {
                            elements: [
                                {
                                    selector: '#Login-Bg',
                                    attributes: 'opacity="0"',
                                    transition: 'all 0.5s ease',
                                },
                                {
                                    selector: '#Text-User-Name, #Text-Password, #Text-Login',
                                    attributes: 'opacity="0"',
                                    transition: 'opacity 0.1s ease',
                                },
                                {
                                    selector: '#Text-DataFormsJS tspan',
                                    attributes: 'x="244" y="82"',
                                    noAnimate: true,
                                },
                                {
                                    selector: '#Rectangle-1',
                                    attributes: 'x="55" y="44" width="610" height="50"',
                                },
                                {
                                    selector: '#Rectangle-2',
                                    attributes: 'fill="#FF7F00" x="55" y="119" width="180" height="251"',
                                },
                                {
                                    selector: '#Input-1',
                                    attributes: 'fill="#7F00FF" x="485" y="119" width="180" height="251" stroke="none"',
                                },
                                {
                                    selector: '#Input-2',
                                    attributes: 'fill="#00FF7F" x="270" y="119" width="180" height="251" stroke="none"',
                                },
                            ],
                        },
                        // [Computer-Screen-3]
                        {
                            sceneDelay: 200,
                            elements: [
                                {
                                    selector: '#Frame',
                                    attributes: 'x="167.5" y="12.5" width="384.992187" height="478.675781"',
                                },
                                {
                                    selector: '#Screen',
                                    attributes: 'x="177.5" y="22.5" width="364.992187" height="458.675781"',
                                },
                                {
                                    selector: '#Stand, #Base',
                                    attributes: 'opacity="0"',
                                    transition: 'opacity 0.1s ease',
                                },
                                {
                                    selector: '#Rectangle-1',
                                    attributes: 'fill="#C92135" x="210" y="45" width="300" height="50"',
                                },
                                {
                                    selector: '#Rectangle-2',
                                    attributes: 'stroke="#979797" fill="#FFFFFF" x="210" y="123" width="300" height="35"',
                                },
                                {
                                    selector: '#Input-1',
                                    attributes: 'fill="#9012FE" x="210" y="187" width="300" height="25" rx="0"',
                                },
                                {
                                    selector: '#Input-2',
                                    attributes: 'fill="#E5C7FF" x="210" y="222" width="300" height="25" rx="0"',
                                },
                                {
                                    selector: '#Text-DataFormsJS tspan',
                                    attributes: 'x="234" y="83"',
                                    noAnimate: true,
                                },
                                {
                                    selector: '#Text-Filter',
                                    attributes: 'opacity="1"',
                                },
                                {
                                    selector: '#Row-2, #Row-3, #Row-4, #Row-5, #Row-6, #Row-7',
                                    attributes: 'fill-opacity="1"',
                                },
                                // Set hidden small circles from drawing [Computer-Screen-4a]
                                {
                                    selector: '#Oval-1',
                                    attributes: 'opacity="0" stroke="#7F8000" stroke-width="0.5" fill="#FFFF00" cx="302.5" cy="209.5" r="2.5"',
                                },
                                {
                                    selector: '#Oval-2',
                                    attributes: 'opacity="0" stroke="#004080" stroke-width="0.5" fill="#007FFF" cx="420.5" cy="284.5" r="2.5"',
                                },
                                {
                                    selector: '#Oval-3',
                                    attributes: 'opacity="0" stroke="#800040" stroke-width="0.5" fill="#FF007F" cx="302.5" cy="359.5" r="2.5"',
                                },
                            ],
                        },
                        // [Computer-Screen-3]
                        // Filter Rows every 1/10th of a second
                        {
                            sceneDelay: 100,
                            elements: [
                                {
                                    selector: '#Row-7',
                                    attributes: 'fill-opacity="0"',
                                    transition: 'fill-opacity 0.1s ease',
                                },
                            ],
                        },
                        {
                            sceneDelay: 100,
                            elements: [
                                {
                                    selector: '#Row-6',
                                    attributes: 'fill-opacity="0"',
                                    transition: 'fill-opacity 0.1s ease',
                                },
                            ],
                        },
                        {
                            sceneDelay: 100,
                            elements: [
                                {
                                    selector: '#Row-5',
                                    attributes: 'fill-opacity="0"',
                                    transition: 'fill-opacity 0.1s ease',
                                },
                            ],
                        },
                        {
                            sceneDelay: 100,
                            elements: [
                                {
                                    selector: '#Row-4',
                                    attributes: 'fill-opacity="0"',
                                    transition: 'fill-opacity 0.1s ease',
                                },
                            ],
                        },
                        {
                            sceneDelay: 100,
                            elements: [
                                {
                                    selector: '#Row-3',
                                    attributes: 'fill-opacity="0"',
                                    transition: 'fill-opacity 0.1s ease',
                                },
                            ],
                        },
                        {
                            sceneDelay: 100,
                            elements: [
                                {
                                    selector: '#Row-2',
                                    attributes: 'fill-opacity="0"',
                                    transition: 'fill-opacity 0.1s ease',
                                },
                            ],
                        },
                        {
                            sceneDelay: 100,
                            elements: [
                                {
                                    selector: '#Input-2',
                                    attributes: 'fill-opacity="0"',
                                    transition: 'fill-opacity 0.1s ease',
                                },
                            ],
                        },
                        // [Computer-Screen-4a] and [Computer-Screen-4b] combined
                        {
                            elements: [
                                {
                                    selector: '#Rectangle-2',
                                    attributes: 'stroke="#9012FE" fill="#DCB4FF" x="210" y="123" width="300" height="322"',
                                },
                                {
                                    selector: '#Input-1',
                                    attributes: 'fill="#6B9F2E" x="223" y="140" width="89" height="25"',
                                },
                                {
                                    selector: '#Input-2',
                                    attributes: 'fill-opacity="1" fill="#D7E9C1" x="326" y="140" width="166" height="25"',
                                },
                                {
                                    selector: '#Text-Filter',
                                    attributes: 'opacity="0"',
                                    transition: 'opacity 0.1s ease',
                                },
                                {
                                    selector: '#Oval-1',
                                    attributes: 'opacity="1" stroke="#7F8000" fill="#FFFF00" cx="302" cy="209" r="50"',
                                },
                                {
                                    selector: '#Oval-2',
                                    attributes: 'opacity="1" stroke="#004080" fill="#007FFF" cx="420" cy="284" r="50"',
                                    transition: 'all 1.2s ease',
                                },
                                {
                                    selector: '#Oval-3',
                                    attributes: 'opacity="1" stroke="#800040" fill="#FF007F" cx="302" cy="359" r="50"',
                                    transition: 'all 1.4s ease',
                                },
                            ],
                        },
                    ],
                };

                window.setTimeout(loop, animation.delay);
            }
        },

        /**
         * Define the Controller onRendered() function
         * This gets called each time the view is redrawn.
         */
        onRendered: function () {
            // Check Device Type from the User-Agent
            var ua = navigator.userAgent;
            var removeFilter = (ua.indexOf("Mac OS X") > -1 &&
                ua.indexOf("Chrome/") === -1 &&
                ua.indexOf("Safari/") > -1 &&
                window.devicePixelRatio === 1);

            // Remove filter on if Mac/Safari and not Retina
            // Otherwise the SVG will not be displayed on mobile Safari (for example iPad 2).
            if (removeFilter) {
                document.querySelector('#home-page-computer').style.filter = 'none';
            }

            // Unless a better method is determined, text position values are hard-coded
            // based on the language. To determine the start screen simply comment out
            // [setupAnimation] below and to determine the "Filter" text temporarily
            // change [stopScreen: null] to [stopScreen: 4] and to determine the login
            // screen set [stopScreen: 2] and wait for a full animation.
            switch (app.plugins.i18n.currentLocale) {
                case 'ja':
                    document.querySelector('#Text-Login tspan').setAttribute('x', '290');
                    document.querySelector('#Text-Filter tspan').setAttribute('x', '310');
                    break;
                case 'es':
                    document.querySelector('#Text-User-Name tspan').setAttribute('x', '258');
                    document.querySelector('#Text-Password tspan').setAttribute('x', '295');
                    document.querySelector('#Text-Login tspan').setAttribute('x', '295');
                    break;
                case 'pt-BR':
                    document.querySelector('#Text-User-Name tspan').setAttribute('x', '270');
                    document.querySelector('#Text-Password tspan').setAttribute('x', '330');
                    document.querySelector('#Text-Login tspan').setAttribute('x', '325');
                    break;
                case 'fr':
                    document.querySelector('#Text-User-Name tspan').setAttribute('x', '270');
                    document.querySelector('#Text-Password tspan').setAttribute('x', '290');
                    document.querySelector('#Text-Login tspan').setAttribute('x', '308');
                    break;
            }
            this.setupExamples();
            this.setupAnimation();
        },
    };

    /**
     * Add as a Page to the app object
     */
    app.addPage('homePage', homePage);
})();
