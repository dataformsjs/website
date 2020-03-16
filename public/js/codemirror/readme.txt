The Playground Page requires a number of CodeMirror modes and addons. To use individual files they
either need to use a module loader or be loaded in the correct order. 

Either VBScript [scripts\Build_CodeMirror.vbs] or Bash [scripts/build-codemirror.sh] 
can be used to build the CodeMirror files. [uglify-js] is used to minify the files.

https://codemirror.net
https://www.npmjs.com/package/uglify-js

# -----------------------------------------------------------------------------
# Local Development using CDN
# Modify [Website\app\Views\index.htm] with the following settings
# -----------------------------------------------------------------------------

<script
    data-route="/:lang/playground"
    data-lazy-load="codemirror">
</script>
<script>
    app.lazyLoad = {
        codemirror: [
            'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.48.0/codemirror.css',
            'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.48.0/addon/lint/lint.css',
            'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.48.0/codemirror.js',
            'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.48.0/addon/edit/matchbrackets.js',
            'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.48.0/mode/htmlmixed/htmlmixed.js',
            'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.48.0/mode/xml/xml.js',
            'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.48.0/addon/mode/simple.js',
            'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.48.0/addon/mode/multiplex.js',
            'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.48.0/mode/handlebars/handlebars.js',
            'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.48.0/mode/javascript/javascript.js',
            'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.48.0/mode/css/css.js',
            'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.48.0/mode/clike/clike.js',
            'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.48.0/mode/jsx/jsx.js',
            'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.48.0/addon/lint/lint.js',
            'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.48.0/addon/lint/javascript-lint.js',
        ],
    };
</script>

# -----------------------------------------------------------------------------
# Production Settings using the local build
# [Website\app\Views\index.htm] is published with the following settings:
# -----------------------------------------------------------------------------

<script
    data-route="/:lang/playground"
    data-lazy-load="codemirrorCss, codemirrorJs">
</script>
<script>
    app.lazyLoad = {
        codemirrorCss: "js/codemirror/codemirror-5.48.0.css",
        codemirrorJs: "js/codemirror/codemirror-5.48.0.min.js",
    };
</script>
