/**
 * DataFormsJS Playground Page
 *
 * The initial playground page was created for FastSitePHP [https://www.fastsitephp.com]
 * (same license and author as DataFormsJS). Re-using the existing JS Code for the
 * DataFormsJS framework was quick and easy. Bascially rather than calling
 * [document.addEventListener('DOMContentLoaded', ...] a minimal [app.addPage('playground',...]
 * is used near the bottom of this file.
 *
 * The core structure and features of the original code did not have to be changed for
 * use with DataFormsJS. Only a few minor changes had to be made (removed PHP, added React, etc).
 * This is a good example showing that it is easy to take existing code and use it in
 * a DataFormsJS app or site.
 *
 * Additionally the server-side PHP template was easy to quick to replace with handlebars
 * as PHP i18n keys were swapped out with Handlebars using Find/Replace.
 *
 * @link     https://www.dataformsjs.com
 * @author   Conrad Sollitt (https://conradsollitt.com)
 * @license  MIT
 */

/* Validates with both [jshint] and [eslint] */
/* global app, CodeMirror */
/* jshint strict: true */
/* eslint-env browser */
/* eslint quotes: ["error", "single", { "avoidEscape": true }] */
/* eslint spaced-comment: ["error", "always"] */
/* eslint no-console: ["error", { allow: ["log", "warn", "error"] }] */

(function() {
    'use strict';

    // Define variables shared between functions. Change the
    // URL when testing locally or using another server.
    var state = {
        cm: null,
        lang: navigator.language,
        urlRoot: 'https://playground.dataformsjs.com/',
        // urlRoot: 'http://localhost:8888/Playground/html/',
        selectedFile: null,
        fileList: [],
        fileCache: {},
        siteKey: null,
        siteString: null,
        siteExpires: null,
        contentChanged: false,
        countdownInterval: null,
    };

    // Setup gets called from the controller [onRendered] event at the bottom of this file
    function setup() {
        state.lang = app.plugins.i18n.currentLocale;
        getSavedSiteKey();
        if (state.siteKey) {
            if (state.fileList.length === 0 || state.selectedFile === null) {
                // Page reloaded with existing valid site
                downloadSite('download-site');
            } else {
                // Display site from memory - user created a site,
                // then viewed another page and came back
                renderFileList();
                showFile(state.fileCache[state.selectedFile]);
                enableSiteEditing();
            }
        } else {
            // No site exists - download a new template
            downloadSite('site-template');
        }
        setupControls();
        setupCmdCtrlKeys();
    }

    function reset() {
        if (state.countdownInterval !== null) {
            window.clearInterval(state.countdownInterval);
            state.countdownInterval = null;
        }
        state.selectedFile = null;
        state.fileList = [];
        state.fileCache = {};
        state.siteKey = null;
        state.siteString = null;
        state.siteExpires = null;
        state.contentChanged = false;
        localStorage.removeItem('playground_site');
        state.cm.toTextArea();
        state.cm = null;
        document.getElementById('code-editor').value = '';
        document.getElementById('countdown').className = '';
        document.querySelector('.editor-container').classList.remove('warning');
        downloadSite('site-template');
        disableSiteEditing();
    }

    /**
     * Handle both [Ctrl+S] and [Command+S] for saving.
     * Windows uses the [Ctrl] key while Mac programs typically use [Command].
     *
     * [document.addEventListener] cannot be used for this
     * because Web Browsers will still display the dialog window
     * so [onkeydown] have to be used for this to work.
     */
    function setupCmdCtrlKeys() {
        document.onkeydown = function (e) {
            if (state.siteKey && (e.ctrlKey || e.metaKey) && e.keyCode === 83) {
                saveFile();
                return false;
            }
        };
    }

    function fetchJson(url, options) {
        return fetch(url, options)
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            if (data.error) {
                throw data.error;
            }
            return data;
        });
    }

    function downloadSite(url) {
        var options = {
            method: 'POST',
            cache: 'no-store',
            mode: 'cors',
            credentials: 'include',
        };

        if (url === 'download-site') {
            options.headers = {
                Authorization: 'Bearer ' + state.siteKey
            };
        } else { // 'site-template'
            url = state.lang + '/' + url;
        }

        fetchJson(state.urlRoot + url, options)
        .then(function(data) {
            loadSite(data);
            setupCodeMirror();
            setActiveFile('app.htm');
            if (state.siteKey) {
                enableSiteEditing();
            }
        })
        .catch(function(error) {
            // If there is an error downloading the default template
            // so a special message as the serve may be down.
            if (url !== 'download-site') { // ':lang/site-template'
                var errEl = document.querySelector('.error-messages');
                if (!errEl) {
                    return; // User clicked to a new page while service was downloading
                }
                var msg = errEl.getAttribute('data-server-down');
                msg += ' Error: ' + error.toString();
                showError(msg);
            } else {
                showError(error);
            }

            // If there was an error downloading a user site then prompt user
            // to create a new site template. This can be replicated by manipulating
            // the site key in local storage and refreshing the page. The timeout
            // allows for the error message element to render before showing the
            // confirm prompt.
            if (url === 'download-site') {
                window.setTimeout(function() {
                    var errEl = document.querySelector('.error-messages');
                    if (!errEl) {
                        return; // User clicked to a new page while service was downloading
                    }
                    var msg = errEl.getAttribute('data-saved-site');
                    if (confirm(msg)) {
                        removeSavedSitekey();
                        // NOTE - `reload()` is now deprecated so some editors such as VS Code
                        // will show a line through it, however it is still included here because
                        // it improves the behavior for older Browsers. For example when using
                        // `reload(true)` IE 11 will send a [Cache-Control: no-cache] Request Header.
                        window.location.reload(true);
                    }
                }, 100);
            }
        });
    }

    function setupControls() {
        var createButtons = document.querySelectorAll('.btn.create-site');
        if (createButtons.length === 0) {
            return; // User clicked to a new page while playground was still loading
        }
        createButtons[0].onclick = createSite;
        createButtons[1].onclick = createSite;
        document.querySelector('.btn.save-file').onclick = saveFile;
        document.querySelector('.btn.rename-file').onclick = renameFile;
        document.querySelector('.btn.add-file').onclick = setNewFile;
        document.querySelector('.btn.delete-file').onclick = deleteFile;
        document.querySelector('.btn.delete-site').onclick = deleteSite;
        document.getElementById('file-list').onchange = function() {
            viewFile(this.value);
        };
        document.querySelector('.error .close-error').onclick = function() {
            document.querySelector('.content.error-message').style.display = 'none';
        };

        // Depending on if mobile or not show a different message
        // when a narrow screen (mobile layout) is used.
        var ua = window.navigator.userAgent.toLowerCase();
        var isMobile = (ua.indexOf('android') > -1 || ua.indexOf('iphone') > -1 || ua.indexOf('ipad') > -1);
        var mobileMessage = document.querySelector('.mobile-message p');
        var attr = (isMobile ? 'data-mobile-screen' : 'data-narrow-screen');
        mobileMessage.textContent = mobileMessage.getAttribute(attr);

        var fileType = document.getElementById('file-type');
        fileType.onchange = function() {
            state.cm.toTextArea();
            state.cm = null;
            var mode = fileType.options[fileType.selectedIndex].getAttribute('data-mode');
            setupCodeMirror(mode);
            setSaveButtonView();
        };

        // Limit characters as the users types the file name
        var fileName = document.getElementById('file-name');
        fileName.oninput = setSaveButtonView;
        fileName.onpaste = function(e) {
            var text = e.clipboardData.getData('text/plain');
            if (!/^[A-Za-z0-9_-]{1,}$/.test(text)) {
                e.preventDefault();
            }
        };
        fileName.onkeydown = function(e) {
            // console.log(e);
            // console.log(e.keyCode);

            // Allowed
            var keyCode = e.keyCode;
            switch (e.keyCode) {
                case 8: // backspace
                    return;
                case 37: // left
                    return;
                case 38: // up
                    return;
                case 39: // right
                    return;
                case 40: // down
                    return;
                case 46: // insert
                    return;
                case 189: // [-] or [_] depending on [Ctrl]
                    return;
            }
            if (keyCode >= 65 && keyCode <= 90) {
                return; // A-Z
            } else if (keyCode >= 97 && keyCode <= 122) {
                return; // a-z
            } else if ((keyCode >= 48 && keyCode <= 57) && !e.shiftKey) {
                return; // 0-9
            }

            // Key not allowed
            return false;
        };
    }

    function showError(error) {
        var container = document.querySelector('.error-message');
        if (!container) {
            return; // User clicked to a new page while function was still running
        }
        var label = container.querySelector('p .text');
        var message = error;
        if (message.toString().toLowerCase().indexOf('error') === -1) {
            message = 'Error: ' + message;
        }
        label.textContent = message;
        container.style.display = '';
        console.error(error);
    }

    function hideSaveButtons() {
        document.querySelector('.btn.save-file').style.display = 'none';
        document.querySelector('.btn.rename-file').style.display = 'none';
        document.querySelector('.msg.file-already-exists').style.display = 'none';
    }

    function setSaveButtonView() {
        // Get needed elements and values
        var attr;
        var btnSaveFile = document.querySelector('.btn.save-file');
        var btnRenameFile = document.querySelector('.btn.rename-file');
        var msgAlreadyExists = document.querySelector('.msg.file-already-exists');
        var fileName = document.getElementById('file-name').value;

        // Check for new file and name change
        var hasFileName = (fileName !== '');
        var isNewFile = (state.selectedFile === null);
        var origName = state.selectedFile;
        if (!isNewFile) {
            origName = origName.substring(0, origName.indexOf('.'));
        }
        var nameHasChanged = (state.selectedFile !== 'app.htm' && !isNewFile && origName !== fileName);

        // Check for duplicate file name
        var alreadyExists = false;
        var notAllowed = false;
        if (isNewFile || nameHasChanged) {
            var type = (isNewFile ? document.getElementById('file-type').value : state.fileCache[state.selectedFile].type);
            var fullName = fileName + '.' + type;
            if (fullName.toLowerCase() === 'app.htm' || fullName.toLowerCase() === 'index.htm') {
                notAllowed = true;
            } else {
                alreadyExists = fileAlreadyExists(fullName);
            }
        }

        // Show or hide controls
        msgAlreadyExists.style.display = 'none';
        if (!hasFileName) {
            btnSaveFile.style.display = 'none';
            btnRenameFile.style.display = 'none';
        } else if (alreadyExists || notAllowed) {
            attr = (alreadyExists ? 'data-already-exists' : 'data-name-not-allowed');
            msgAlreadyExists.textContent = msgAlreadyExists.getAttribute(attr);
            msgAlreadyExists.style.display = '';
            btnSaveFile.style.display = 'none';
            btnRenameFile.style.display = 'none';
        } else if (nameHasChanged) {
            if (!reachedFileLimit()) {
                btnSaveFile.querySelector('.text').textContent = btnSaveFile.getAttribute('data-save-as');
                btnSaveFile.style.display = '';
            }
            // The rename button will show either [Rename] or [Rename and Save] (or a translation)
            // however the same action is performed for both. The different button text simply makes
            // it clear to the user what has changed.
            attr = (state.contentChanged ? 'data-rename-and-save' : 'data-rename');
            btnRenameFile.querySelector('.text').textContent = btnRenameFile.getAttribute(attr);
            btnRenameFile.style.display = '';
        } else if (state.contentChanged) {
            btnSaveFile.querySelector('.text').textContent = btnSaveFile.getAttribute('data-save');
            btnSaveFile.style.display = '';
            btnRenameFile.style.display = 'none';
        } else {
            btnSaveFile.style.display = 'none';
            btnRenameFile.style.display = 'none';
        }
    }

    // Case-insensitive compare used when creating new or renaming files.
    function fileAlreadyExists(name) {
        name = name.toLowerCase();
        for (var n = 0, m = state.fileList.length; n < m; n++) {
            if (state.fileList[n].toLowerCase() === name) {
                return true;
            }
        }
        if (name === 'index.htm') { // name not allowed
            return true;
        }
        return false;
    }

    function createSite() {
        var url = state.urlRoot + state.lang + '/create-site';
        fetchJson(url, {
            method: 'POST',
            cache: 'no-store',
        })
        .then(function(data) {
            saveSiteKey(data.site);
            parseSiteKey();
            enableSiteEditing();
        })
        .catch(function(error) {
            showError(error);
        });
    }

    function enableSiteEditing() {
        document.querySelector('.create-site-overlay').style.display = 'none';
        document.querySelector('.create-site-screen').style.display = 'none';
        document.querySelector('.create-another-site-screen').style.display = 'none';

        var controls = document.querySelectorAll('.controls');
        Array.prototype.forEach.call(controls, function(control) {
            control.style.display = '';
        });
        document.querySelector('.editor-container').classList.remove('no-site');

        var href = state.urlRoot + 'sites/' + state.siteString + '/app.htm';
        document.querySelector('.btn.view-site').href = href;
        document.querySelector('.btn.view-file').href = href;

        showCountdown();
    }

    function showCountdown() {
        // Get current time and remaining time
        var d = new Date(),
            secondsRemaining = Math.floor((state.siteExpires - d.getTime()) / 1000),
            countdown = document.getElementById('countdown'),
            minutesRemaining = 0,
            secondsToNextMinute = 0;

        // Clear previous timer
        // [clearInterval] handles both [setTimeout] and [setInterval]
        if (state.countdownInterval !== null) {
            window.clearInterval(state.countdownInterval);
            state.countdownInterval = null;
        }

        // Note - to test how this works without waiting one hour for a site to expire
        // run a local or development server copy and then in [app.php] change
        // [Crypto::sign($site)] to the desired time to test. For example:
        // [Crypto::sign($site, '+65 seconds')] or [Crypto::sign($site, '+11 minutes')].
        if (secondsRemaining > 60) {
            // Set a timeout for the next minute and then call this function again
            minutesRemaining = Math.ceil(secondsRemaining / 60);
            secondsToNextMinute = secondsRemaining % 60;
            if (secondsToNextMinute === 0) {
                secondsToNextMinute = 60;
            }
            countdown.textContent = countdown.getAttribute('data-minutes').replace('{time}', minutesRemaining);
            state.countdownInterval = window.setTimeout(showCountdown, (secondsToNextMinute * 1000));
        } else {
            // Less than 1 minute so show a seconds countdown timer
            // and flash elements on the screen.
            updateCountdownSeconds(countdown, secondsRemaining);
            secondsRemaining--;
            state.countdownInterval = window.setInterval(function() {
                updateCountdownSeconds(countdown, secondsRemaining);
                secondsRemaining--;
                if (secondsRemaining < 0) {
                    document.querySelector('.site-expired').style.display = '';
                    reset();
                }
            }, 1000);
        }

        // Show warning style if once the the site has 10 minutes left
        if (secondsRemaining <= 600) {
            countdown.classList.add('warning');
        }
    }

    function updateCountdownSeconds(countdown, secondsRemaining) {
        if (secondsRemaining === 1) {
            countdown.textContent = countdown.getAttribute('data-one-second');
        } else {
            countdown.textContent = countdown.getAttribute('data-seconds').replace('{time}', secondsRemaining);
        }
        countdown.classList.toggle('scale');
        document.querySelector('.editor-container').classList.toggle('warning');
    }

    function disableSiteEditing() {
        document.querySelector('.create-site-overlay').style.display = '';
        document.querySelector('.create-another-site-screen').style.display = '';

        var controls = document.querySelectorAll('.controls');
        Array.prototype.forEach.call(controls, function(control) {
            control.style.display = 'none';
        });
        document.querySelector('.editor-container').classList.add('no-site');

        document.querySelector('.btn.view-site').href = '#';
        document.querySelector('.btn.view-file').href = '#';
    }

    function saveSiteKey(key) {
        state.siteKey = key;
        localStorage.setItem('playground_site', key);
    }

    function getSavedSiteKey() {
        state.siteKey = localStorage.getItem('playground_site');
        parseSiteKey();
    }

    function removeSavedSitekey() {
        localStorage.removeItem('playground_site');
        state.siteKey = null;
        state.siteString = null;
        state.siteExpires = null;
    }

    function parseSiteKey() {
        // Read site and expires time from the site key. String Format:
        // https://www.fastsitephp.com/en/api/Security_Crypto_SignedData
        if (state.siteKey) {
            var regex = /^([a-zA-Z0-9_-]{2,}).s.(\d+).[a-zA-Z0-9_-]{2,}$/;
            var result = state.siteKey.match(regex);
            if (!result) {
                state.siteKey = null;
                return;
            }
            state.siteString = decodeBase64UrlSafe(result[1]);
            state.siteExpires = parseInt(result[2], 10);

            // Make sure site has not expired
            if (Date.now() > (new Date(state.siteExpires))) {
                state.siteKey = null;
                state.siteString = null;
                state.siteExpires = null;
            }
        }
    }

    function decodeBase64UrlSafe(base64url) {
        var padding = base64url.length % 4;
        if (padding !== 0) {
            padding = 4 - padding;
        }
        var base64 = base64url.replace(/_/g, '/').replace(/-/g, '+') + '='.repeat(padding);
        return atob(base64);
    }

    function reachedFileLimit() {
        return (state.fileList.length >= 30);
    }

    function renderFileList() {
        // Sort files before showing. Using [localeCompare] keeps the same
        // upper and lower case letters together (example 'c' and 'C').
        // Also by default [app-vue.htm, etc] appear before [app.htm]
        // so make sure [app.htm] shows first.
        state.fileList.sort(function (a, b) {
            if (a === 'app.htm') {
                return -1;
            } else if (b === 'app.htm') {
                return 1;
            }
            return a.localeCompare(b);
        });

        // Show files
        var listHtml = '', selectHtml = '';
        for (var n = 0, m = state.fileList.length; n < m; n++) {
            var file = state.fileList[n];
            var pos = file.indexOf('.');
            var type = file.substring(pos+1);
            file = app.escapeHtml(file);
            listHtml += '<li class="' + type + '">' + file + '</li>';
            selectHtml += '<option>' + file + '</option>';
        }
        document.querySelector('.files ul').innerHTML = listHtml;
        document.getElementById('file-list').innerHTML = selectHtml;

        // Update Add Button
        var btnAdd = document.querySelector('.btn.add-file');
        var limitReached = document.querySelector('.msg.file-limit');
        if (reachedFileLimit()) {
            limitReached.style.display = '';
            btnAdd.style.display = 'none';
        } else {
            limitReached.style.display = 'none';
            btnAdd.style.display = '';
        }

        // Define list item events
        var items = document.querySelectorAll('.files li');
        Array.prototype.forEach.call(items, function(item) {
            item.onclick = function() {
                viewFile(this.textContent);
            };
        });
    }

    function loadSite(data) {
        state.fileList = data.files;
        renderFileList();

        document.getElementById('code-editor').value = data.app_code;

        state.fileCache['app.htm'] = {
            type: 'htm',
            file: 'app.htm',
            content: data.app_code,
        };
    }

    function setNewFile() {
        var items = document.querySelectorAll('.files li');
        Array.prototype.forEach.call(items, function(item) {
            item.classList.remove('active');
        });
        state.selectedFile = null;
        state.contentChanged = true;

        var fileType = document.getElementById('file-type');
        document.getElementById('file-name').value = '';
        document.getElementById('file-name').disabled = false;
        fileType.style.display = '';
        document.querySelector('.btn.view-file').style.display = 'none';
        document.querySelector('.btn.delete-file').style.display = 'none';
        hideSaveButtons();
        var fileName = document.getElementById('file-name');
        fileName.value = '';
        fileName.style.display = '';

        state.cm.toTextArea();
        state.cm = null;
        document.getElementById('code-editor').value = '';
        var mode = fileType.options[fileType.selectedIndex].getAttribute('data-mode');
        setupCodeMirror(mode);
    }

    function setActiveFile(name) {
        // Highlight on file list
        var items = document.querySelectorAll('.files li');
        Array.prototype.forEach.call(items, function(item) {
            if (item.textContent === name) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        state.selectedFile = name;
        state.contentChanged = false;

        // Setup [View File] button
        var viewFile = document.querySelector('.btn.view-file');
        viewFile.style.display = 'none';
        if (state.siteString && name !== 'app.htm') {
            viewFile.href = state.urlRoot + 'sites/' + state.siteString + '/';
            viewFile.href += name;
            viewFile.style.display = '';
        }

        // File Name
        var fileName = document.getElementById('file-name');
        var btnDelete = document.querySelector('.btn.delete-file');
        if (name === 'app.htm') {
            fileName.disabled = true;
            fileName.value = name;
            btnDelete.style.display = 'none';
        } else {
            var pos = name.indexOf('.');
            var nameNoExt = name.substring(0, pos);
            fileName.disabled = false;
            fileName.value = nameNoExt;
            fileName.style.display = '';
            btnDelete.style.display = '';
        }
        document.getElementById('file-type').style.display = 'none';

        // Track when file changes to show/hide save button
        hideSaveButtons();
        state.cm.on('change', function () {
            state.cm.save();
            var cachedFile = (state.fileCache[name] === undefined ? '' : state.fileCache[name].content);
            var currentFile = document.getElementById('code-editor').value;
            cachedFile = cachedFile.replace(/\r\n/g, '\n'); // Normalize Line-endings when comparing
            currentFile = currentFile.replace(/\r\n/g, '\n');
            state.contentChanged = (currentFile !== cachedFile);
            setSaveButtonView();
        });
    }

    function setupCodeMirror(mode) {
        if (mode === undefined) {
            mode = 'text/x-handlebars-template';
        }

        var options = {
            lineNumbers: true,
            matchBrackets: true,
            mode: mode,
            indentUnit: 4,
            indentWithTabs: false,
        };

        if (mode === 'text/javascript') {
            options.gutters = ['CodeMirror-lint-markers'];
            options.lint = true;
        } else if (mode === 'text/x-handlebars-template') {
            options.mode = { name:'handlebars', base:'htmlmixed' };
        }

        if (state.cm !== null) {
            // Manually remove previous editors from the screen if they still exist.
            // This can happen if clicking on and off the pageground page very fast
            // while the service to download images or other resources is slow.
            var editors = document.querySelectorAll('.CodeMirror.cm-s-default');
            if (editors) {
                Array.prototype.forEach.call(editors, function(editor) {
                    editor.parentNode.removeChild(editor);
                });
            }
        }
        state.cm = CodeMirror.fromTextArea(document.getElementById('code-editor'), options);
    }

    // Files are cached until the page is refreshed because user sites
    // are only intended to be edited by one user/browser at a time.
    function viewFile(name) {
        if (state.fileCache[name] !== undefined) {
            showFile(state.fileCache[name]);
        } else {
            downloadFile(name);
        }
    }

    function downloadFile(name) {
        var url = state.urlRoot + 'get-file';
        fetchJson(url, {
            method: 'POST',
            cache: 'no-store',
            mode: 'cors',
            credentials: 'include',
            headers: {
                Authorization: 'Bearer ' + state.siteKey,
                'X-File': name,
            },
        })
        .then(function(data) {
            state.fileCache[name] = data;
            showFile(data);
        })
        .catch(function(error) {
            showError(error);
        });
    }

    function saveFile() {
        // Save CodeMirror content to <textarea>
        state.cm.save();
        var content = document.getElementById('code-editor').value;

        // Handle New files
        var type = null;
        var file = null;
        var enteredName = document.getElementById('file-name').value;
        var isNewFile = false;
        var nameHasChanged = false;

        if (state.selectedFile === null) {
            file = enteredName;
            type = document.getElementById('file-type').value;
            isNewFile = true;
            if (file === '' || type === '') {
                // No name specified, user likely used [Ctrl/Cmd] + [S]
                return;
            }
            file += '.' + type;
        } else if (state.selectedFile === 'app.htm') {
            file = state.selectedFile;
        } else {
            // Check for new File Name if user clicked [Save As].
            // The original file will not be changed.
            var origName = state.selectedFile;
            origName = origName.substring(0, origName.indexOf('.'));
            nameHasChanged = (origName !== enteredName);
            if (nameHasChanged) {
                type = state.fileCache[state.selectedFile].type;
                file = enteredName + '.' + type;
            } else {
                file = state.selectedFile;
            }
        }

        // Exit if new name and file already exists. User likely would trigger this with
        // [Ctrl/Cmd + s] while 'File already exists'or another message is showing.
        if ((isNewFile || nameHasChanged) && fileAlreadyExists(file)) {
            return;
        } else if (nameHasChanged && reachedFileLimit()) {
            return;
        }

        // Save file
        var url = state.urlRoot + 'save-file';
        fetchJson(url, {
            method: 'POST',
            cache: 'no-store',
            mode: 'cors',
            credentials: 'include',
            headers: {
                Authorization: 'Bearer ' + state.siteKey,
                'X-File': file,
                'Content-Type': 'text/plain',
            },
            body: content,
        })
        .then(function() {
            if (isNewFile || nameHasChanged) {
                state.fileCache[file] = {
                    type: type,
                    file: file,
                    content: content,
                };
                state.fileList.push(file);
                renderFileList();
                setActiveFile(file);
            } else {
                state.fileCache[file].content = content;
                state.contentChanged = false;
            }
            showMsgFileSaved();
        })
        .catch(function(error) {
            showError(error);
        });
    }

    function renameFile() {
        // Save CodeMirror content to <textarea>
        state.cm.save();
        var content = document.getElementById('code-editor').value;

        // File Name info
        var file = state.selectedFile;
        var type = state.fileCache[file].type;
        var newFile = document.getElementById('file-name').value + '.' + type;

        // Rename file
        var url = state.urlRoot + 'rename-file';
        fetchJson(url, {
            method: 'POST',
            cache: 'no-store',
            mode: 'cors',
            credentials: 'include',
            headers: {
                Authorization: 'Bearer ' + state.siteKey,
                'X-File': file,
                'X-Rename': newFile,
                'Content-Type': 'text/plain',
            },
            body: content,
        })
        .then(function() {
            // Update file cache
            delete state.fileCache[file];
            state.fileList.splice(state.fileList.indexOf(file), 1);
            state.fileCache[newFile] = {
                type: type,
                file: newFile,
                content: content,
            };
            state.fileList.push(newFile);
            renderFileList();
            setActiveFile(newFile);
            showMsgFileSaved();
        })
        .catch(function(error) {
            showError(error);
        });
    }

    function deleteFile() {
        var url = state.urlRoot + 'delete-file';
        var file = state.selectedFile;
        fetchJson(url, {
            method: 'POST',
            cache: 'no-store',
            mode: 'cors',
            credentials: 'include',
            headers: {
                Authorization: 'Bearer ' + state.siteKey,
                'X-File': file,
            },
        })
        .then(function() {
            delete state.fileCache[file];
            state.fileList.splice(state.fileList.indexOf(file), 1);
            renderFileList();
            setNewFile();
            showMsgFileDeleted();
        })
        .catch(function(error) {
            showError(error);
        });
    }

    function showMsgFileSaved() {
        showMsgFileEvent('data-saved');
    }

    function showMsgFileDeleted() {
        showMsgFileEvent('data-deleted');
    }

    function showMsgFileEvent(attr) {
        // Hide save buttons and show event message for 1 second
        hideSaveButtons();
        var fileEvent = document.querySelector('.msg.file-event');
        fileEvent.textContent = fileEvent.getAttribute(attr);
        fileEvent.style.display = '';
        window.setTimeout(function() {
            fileEvent.style.display = 'none';
            fileEvent.textContent = '';
        }, 1000);
    }

    function deleteSite() {
        var url = state.urlRoot + 'delete-site';

        // Show message unless the site expired with the screen open
        var msg = document.querySelector('.btn.delete-site').getAttribute('data-prompt');
        if (!confirm(msg)) {
            return;
        }

        fetchJson(url, {
            method: 'POST',
            cache: 'no-store',
            mode: 'cors',
            credentials: 'include',
            headers: {
                Authorization: 'Bearer ' + state.siteKey,
            },
        })
        .then(function() {
            document.querySelector('.site-expired').style.display = 'none';
            reset();
        })
        .catch(function(error) {
            showError('The following server error occurred while deleting your site. [' + error.toString() + ']. All files should be deleted within an hour.');
            reset();
        });
    }

    function showFile(data) {
        var mode = null;
        switch (data.type) {
            case 'htm':
                mode = 'text/x-handlebars-template';
                break;
            case 'js':
                mode = 'text/javascript';
                break;
            case 'jsx':
                mode = 'text/jsx';
                break;
            case 'css':
                mode = 'text/css';
                break;
            case 'svg':
                mode = 'application/xml';
                break;
            case 'graphql':
                mode = 'text/plain';
                break;
            default:
                showError('Unknown file type, new file type not yet handled.');
                return;
        }

        // Re-create the CodeMirror plugin on any file change. This prevents issues
        // with the vertical scrollbar and allows for custom options per language.
        if (state.cm !== null) {
            state.cm.toTextArea();
            state.cm = null;
        }
        document.getElementById('code-editor').value = data.content;
        setupCodeMirror(mode);
        setActiveFile(data.file);

        // Update mobile file selection
        document.getElementById('file-list').value = data.file;
    }

    // Add a new page object with an empty model.
    // All page logic is handled by functions and the initial [setup()] function.
    // The controller simply calls [setup()] and a few features for DOM.
    app.addPage('playground', {
        model: {
            getState: function() { return state; } // Used from DevTools to debug UI errors if needed: app.activeModel.getState()
        },
        onRendered: function() {
            setup();
            document.querySelector('footer').style.display = 'none';
        },
        onRouteUnload: function() {
            if (state.countdownInterval !== null) {
                window.clearInterval(state.countdownInterval);
                state.countdownInterval = null;
            }
            document.querySelector('footer').style.display = '';
            document.onkeydown = null;
        },
    });
})();
