/**
 * Getting Started Page
 *
 * The getting started page uses <template> rather than Hanldebars or other
 * rendering engines so that example code is display rather than rendered.
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

    /**
     * Create a new page object
     */
    var gettingStarted = {
        /**
         * Define a model for the page object
         */
        model: {
            // Keep track of selected template between page changes
            activeTemplate: 'web-components',

            // Track which version of the site is being used
            usingWebComponents: false,

            // Click event for [.template-page] elements
            changeTemplate: function(e) {
                // Get elements and attributes
                var model = this;
                var selectedTmpl = e.target;
                if (selectedTmpl.getAttribute('data-page') === null) {
                    selectedTmpl = selectedTmpl.parentNode;
                }
                var page = selectedTmpl.getAttribute('data-page');
                var className = selectedTmpl.getAttribute('data-class');

                if (e.stopPropagation) {
                    e.stopPropagation();
                }

                // Update links
                document.querySelector('.view-template').href = page;

                // Update HTML Control - <code data-template-url="url">
                var code = document.querySelector('.template code');
                code.setAttribute('data-template-url', page);
                code.setAttribute('class', className);

                // Update active label
                document.querySelector('.active-template').innerHTML = selectedTmpl.innerHTML;

                // Refresh the control, this will dynamically download templates
                // as they are viewed and then cache them in memory so they are
                // downloaded only once. Use with the Web Component or Framework
                // app object depending on which version of the page is used.
                var apiObject = (model.usingWebComponents ? document.querySelector('html-import-service') : app);
                apiObject.refreshHtmlControl(code, function() {
                    // Re-highlight Code
                    if (model.usingWebComponents) {
                        document.querySelector('i18n-service').updateContent(code.parentNode);
                        document.querySelector('prism-service').onLoad(document);
                    } else {
                        app.plugins.i18n.onRendered(code.parentNode);
                        app.plugins.prism.onRendered();
                    }

                    // Set "active" button
                    var allPages = document.querySelectorAll('.template-page');
                    Array.prototype.forEach.call(allPages, function(page) {
                        page.classList.remove('active');
                    });
                    selectedTmpl.classList.add('active');

                    // Save template language so it appears when page is loaded
                    model.activeTemplate = selectedTmpl.getAttribute('data-lang');

                    // Hide the drop-down list
                    document.querySelector('.all-templates').style.display = 'none';
                    document.querySelector('.active-template').style.visibility = '';
                });
            },

            // Called once every time the page is loaded
            setup: function() {
                // Reference the current model and get elements
                var model = this;
                var selected = document.querySelector('.template-page.active');
                var allPages = document.querySelectorAll('.template-page');
                var activeTemplate = document.querySelector('.active-template');

                // Change template if needed
                if (!(selected && selected.getAttribute('data-lang') === this.activeTemplate)) {
                    selected = document.querySelector('.template-page[data-lang="' + this.activeTemplate + '"]');
                    this.changeTemplate({ target:selected });
                }

                // Click to show/hide full template list
                activeTemplate.onclick = function(e) {
                    document.querySelector('.all-templates').style.display = '';
                    activeTemplate.style.visibility = 'hidden';
                    e.stopPropagation();
                };
                document.documentElement.addEventListener('click', this.hideDropDown);

                // Setup click events and download link
                Array.prototype.forEach.call(allPages, function(page) {
                    page.onclick = model.changeTemplate.bind(model);
                });
                model.setupViewLink();
                model.setupDownloadLink();

                // Escape key to hide drop-down
                document.onkeydown = function (e) {
                    if (e.keyCode === 27) {
                        model.hideDropDown();
                    }
                };
            },

            hideDropDown: function() {
                var dropDown = document.querySelector('.all-templates');
                if (dropDown) {
                    dropDown.style.display = 'none';
                }

                var activeTemplate = document.querySelector('.active-template');
                if (activeTemplate) {
                    activeTemplate.style.visibility = '';
                }
            },

            setupViewLink: function() {
                // IE partially works when using [win.document.write(code);]
                // However the user has to press [F5] to refresh the page.
                // Until a more reliable solution is found the buttin is simply
                // hidden from IE.
                var isIE = (navigator.userAgent.indexOf('Trident/') !== -1);
                if (isIE) {
                    return;
                }

                // Assume modern browser if not IE
                var viewTemplate = document.querySelector('.view-template');
                viewTemplate.style.display = '';
                viewTemplate.onclick = function() {
                    // As of late 2019 this method works to dynamically write the template
                    // to another tab by using an <iframe> with "data:" url. Because Browsers
                    // may change security rules for new tabs in the future this could break
                    // at any time but for now it works. The reason that content is written
                    // to the tab is because the i18n strings need to be updated before
                    // displaying the page and that happens in the browser.
                    //
                    // A possible future alternative option would be to render the templates
                    // server side using PHP.
                    //    <a class="view-template" href="{url_lang}" target="_blank" data-i18n="view_tmpl"></a>
                    //
                    // Code modified from:
                    // https://ourcodeworld.com/articles/read/682/what-does-the-not-allowed-to-navigate-top-frame-to-data-url-javascript-exception-means-in-google-chrome
                    var code = document.querySelector('.template code').textContent;
                    var url = 'data:text/html,' + encodeURIComponent(code);
                    var iframe = '<!doctype html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">';
                    iframe += '<style>*{margin:0;padding:0}</style></head><body><iframe src="' + url  + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:99vh;" allowfullscreen></iframe></body></html>';
                    var win = window.open();
                    win.document.write(iframe);
                };
            },

            setupDownloadLink: function() {
                // Check if browser downloads are supported. This prevents the download
                // link from showing on mobile and unsupported devices.
                var isSupported = false;
                var firstLinkFound = document.querySelector('a');
                if (firstLinkFound === null) {
                    firstLinkFound = document.createElement('a');
                }
                isSupported = (navigator.msSaveBlob !== undefined || firstLinkFound.download !== undefined);

                // Only show the button if supported. By default it is hidden from HTML.
                if (isSupported) {
                    var downloadLink = document.querySelector('.download-template');
                    downloadLink.style.display = '';
                    downloadLink.onclick = function() {
                        // Get code and file name
                        var code = document.querySelector('.template code').textContent;
                        var fileName = document.querySelector('.template-page.active').getAttribute('data-page');
                        fileName = fileName.replace('html/getting-started/', '');

                        // Export
                        var blob = new Blob([code], { type: 'text/html; charset=utf-8;' });
                        if (navigator.msSaveBlob !== undefined) {
                            navigator.msSaveBlob(blob, fileName);
                        } else {
                            var link = document.createElement('a');
                            var url = URL.createObjectURL(blob);
                            link.setAttribute('href', url);
                            link.setAttribute('download', fileName);
                            link.style.visibility = 'hidden';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }
                    };
                }
            },
        },

        /**
         * Define the Controller [onRendered()] function.
         * This gets called each time the view is redrawn.
         */
        onRendered: function() {
            this.setup();
        },

        /**
         * When the page is changed remove an added Event Listener on the
         * document element, otherwise it could still be called from other pages.
         */
        onRouteUnload: function() {
            document.documentElement.removeEventListener('click', this.hideDropDown);
            document.onkeydown = null;
        },
    };

    /**
     * This page is shared between several different versions of the site.
     * The original version uses the standard DataFormsJS Framework so it will
     * use the standard Page Object if <url-router> does not exist on the page
     * while the Web Component Version will use global functions that reference
     * shared code from the original page object.
     */
    if (document.querySelector('url-router')) {
        gettingStarted.model.usingWebComponents = true;
        window.setupGettingStarted = function() {
            gettingStarted.onRendered.apply(gettingStarted.model);
        };
        window.unloadGettingStarted = function() {
            gettingStarted.onRouteUnload.apply(gettingStarted.model);
        };
        return;
    }

    /**
     * Add page to app
     */
    app.addPage('gettingStarted', gettingStarted);
})();
