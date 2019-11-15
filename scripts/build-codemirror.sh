#!/usr/bin/env bash

# =================================================================================
#
#   This is a Bash Script that runs on Mac or Linux and is used to build CodeMirror
#   for the Playground Page. An alternative VBScript file exists for Windows.
#
#   For local development see additional comments in
#   [public\js\codemirror\readme.txt].
#
#   This script takes about 5 to 10 seconds to run.
#
#   To Run:
#   1) Install Global Uglify Command from NPM:
#      sudo npm install uglify-js -g
#   2) Navigate to the directory of this Script:
#      cd {dir}
#   3) Execute:
#        ./build-codemirror.sh
#      OR:
#        bash build-codemirror.sh
#
#   A hash of the output files can be generated using:
#     Mac:
#       md5 codemirror*
#     Linux:
#       md5sum codemirror*
#   The result has been verified with the VBScript file to confirm that both
#   scripts produce the exact same output when using the latest build of UglifyJS.
#
# =================================================================================

# Get Run-time directory of this Script
CURRENT_DIR=$(dirname "${BASH_SOURCE[0]}")

# ---------------------------------------------------------
# Main function, CDN and Version settings are defined
# at the top of this function.
# ---------------------------------------------------------
main ()
{
    # Root URL for CodeMirror Version
    root_url='https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.48.0/'
    cm_ver='5.48.0'

    # Define an Array of Files for the Build
    # Files need to be specified in the correct order for building
    files=(
        'codemirror.css'
        'addon/lint/lint.css'
        'codemirror.js'
        'addon/edit/matchbrackets.js'
        'mode/htmlmixed/htmlmixed.js'
        'mode/xml/xml.js'
        'addon/mode/simple.js'
        'addon/mode/multiplex.js'
        'mode/handlebars/handlebars.js'
        'mode/javascript/javascript.js'
        'mode/css/css.js'
        'mode/clike/clike.js'
        'mode/jsx/jsx.js'
        'addon/lint/lint.js'
        'addon/lint/javascript-lint.js'
    )

    # Build an array of full file paths (current directory + downloaded file name)
    file_paths=()
    for n in "${!files[@]}"; do
        file="${files[n]}"
        if [[ "${file}" = 'codemirror.css' || "${file}" = 'codemirror.js' ]]; then
            file_name=$file
        else
            file_name=$(echo "${file}" | awk -F'/' '{print $3}')
        fi
        file_paths+=("${CURRENT_DIR}/${file_name}")
    done

    # Download the files
    for n in "${!files[@]}"; do        
        file=${files[n]}
        file_path=${file_paths[n]}
        url="${root_url}${file}"
        echo "Downloading ${url}"
        curl "${url}" -s -o "${file_path}"
    done

    # Define output files
    js_file="${CURRENT_DIR}/codemirror-${cm_ver}.js"
    css_file="${CURRENT_DIR}/codemirror-${cm_ver}.css"
    min_file="${CURRENT_DIR}/codemirror-${cm_ver}.min.js"

    # Combine the files
    css_files=''
    js_files=''
    for n in "${!file_paths[@]}"; do
        file=${file_paths[n]}
        if [[ $file == *".css" ]]; then
            css_files="${css_files} \"${file}\""
        else
            js_files="${js_files} \"${file}\""
        fi
    done
    eval "cat ${css_files} > \"${css_file}\""
    eval "cat ${js_files} > \"${js_file}\""

    # Minify JS file using Global UglifyJS Command
    echo 'Running: uglifyjs'
    eval "uglifyjs \"${js_file}\" -o \"${min_file}\" -c -m"

    # Delete downloaded files
    for n in "${!file_paths[@]}"; do
        file=${file_paths[n]}
        rm "${file}"
    done
    rm "${js_file}"

    # Success
    echo 'Finished'
    echo "JS File: ${js_file}"
    echo "CSS File: ${css_file}"
    return 0
}

#---------------------------------------------------------
# Run the main() function and exit with the result
#---------------------------------------------------------
main
exit $?
