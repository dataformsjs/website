/**
 * Getting Started Page
 *
 * The getting started page uses <template> rather than Handlebars or other
 * rendering engines so that example code is display rather than rendered.
 *
 * Updating the build of this file:
 *     See full comments in [page-home-page.js], most recent build:
 *     uglifyjs page-getting-started.js -o page-getting-started.20201205.min.js -c -m
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

                // Update view template link
                model.setupViewLink(page);

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
                        page.setAttribute('aria-selected', 'false');
                    });
                    selectedTmpl.classList.add('active');
                    selectedTmpl.setAttribute('aria-selected', 'true');

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
                model.setupDownloadLink();

                // Escape key to hide drop-down
                document.onkeydown = function (e) {
                    if (e.key === 'Escape' || e.key === 'Esc') {
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

            setupViewLink: function(page) {
                var viewTemplate = document.querySelector('.view-template');
                var path = page.replace('/html/getting-started/', '/getting-started/' + window.i18n_Locale + '/');
                viewTemplate.style.display = '';
                viewTemplate.setAttribute('href', path);
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
