'----------------------------------------------------------------------------------
'
' This is a VBScript File that runs on Windows and is used to build CodeMirror
' for the Playground Page. An alternative Bash script exists for Mac and Linux.
'
' This script has no dependencies because VBScript works by default in all
' versions of Windows (since Windows 97).
'
' For local development see additional comments in [public\js\codemirror\readme.txt].
'
' This script takes about 5 to 10 seconds to run. Once finished js and css
' files are copied from the current directory to [public\js\codemirror\*].
'
' This script requires UglifyJS to be installed globally:
'     npm install uglify-js -g
'
' To run siumply double-click on the from Windows Explorer or use a command
' prompt (cmd.exe) and run:
'     cd {this-dir}
'     cscript Build_CodeMirror.vbs
'
' A hash of the output files can be generated in recent versions of Windows using:
'     certUtil -hashfile codemirror-5.48.0.min.js MD5
'     certUtil -hashfile codemirror-5.48.0.css MD5
' The result has been verified with the bash script to confirm that both scripts 
' produce the exact same output when using the latest build of UglifyJS.
'
'----------------------------------------------------------------------------------

Option Explicit

'Root URL for CodeMirror Version
Const CODE_MIRROR_VERSION = "5.48.0"
Const CODE_MIRROR_URL = "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.48.0/"

'ADODB Constants used in this file
Const adTypeBinary = 1
Const adSaveCreateOverWrite = 2

'------------------------------------
'Start of Script
'------------------------------------
Main

'Main function
Sub Main()
    Dim Folder, Files, FilePaths, CmCssFile, CmJsFile

    Folder = GetCurrentFolder
    Files = GetFiles
    FilePaths = GetFilePaths(Files, Folder)

    CmCssFile = Folder & "\codemirror-" & CODE_MIRROR_VERSION & ".css"
    CmJsFile = Folder & "\codemirror-" & CODE_MIRROR_VERSION & ".js"

    DownloadFiles Files, FilePaths
    CombineFiles FilePaths, CmCssFile, CmJsFile
    MinifyFiles CmJsFile
    DeleteFiles FilePaths, CmJsFile
End Sub

'Return Files for URL
'Files need to be specified in the correct order for building
Function GetFiles()
    GetFiles = Array("codemirror.css", _
                "addon/lint/lint.css", _
                "codemirror.js", _
                "addon/edit/matchbrackets.js", _
                "mode/htmlmixed/htmlmixed.js", _
                "mode/xml/xml.js", _
                "addon/mode/simple.js", _
                "addon/mode/multiplex.js", _
                "mode/handlebars/handlebars.js", _
                "mode/javascript/javascript.js", _
                "mode/css/css.js", _
                "mode/clike/clike.js", _
                "mode/jsx/jsx.js", _
                "addon/lint/lint.js", _
                "addon/lint/javascript-lint.js")
End Function

'Return the full save file path from URL of files
Function GetFilePaths(Files, Folder)
    Dim File, FileNames, Data, n, m
    m = UBound(Files)
    ReDim FileNames(m)
    For n = 0 To m
        Data = Split(Files(n), "/")
        FileNames(n) = Folder & "\" & Data(UBound(Data))
    Next
    GetFilePaths = FileNames
End Function

'Download an Save all needed CodeMirror files to this directory
Sub DownloadFiles(Files, FilePaths)
    Dim Url, n, m
    m = UBound(Files)
    For n = 0 To m
        Url = CODE_MIRROR_URL & Files(n)
        DownloadFile Url, FilePaths(n)
    Next
End Sub

'Combine Downloaded Files
Sub CombineFiles(FilePaths, CmCssFile, CmJsFile)
    Dim InputFile, CssOutput, JsOutput, File, Folder
    Dim FullPath

    Set InputFile = CreateObject("ADODB.Stream")
    Set CssOutput = CreateObject("ADODB.Stream")
    Set JsOutput = CreateObject("ADODB.Stream")

    InputFile.Type = adTypeBinary
    With CssOutput
        .Type = adTypeBinary
        .Open
    End With
    With JsOutput
        .Type = adTypeBinary
        .Open
    End With

    For Each File in FilePaths
        InputFile.Open
        InputFile.LoadFromFile(File)
        If InStr(File, ".css") > 0 Then
            CssOutput.Write InputFile.Read
        Else
            JsOutput.Write InputFile.Read
        End If
        InputFile.Close
    Next

    CssOutput.SaveToFile CmCssFile, adSaveCreateOverWrite
    JsOutput.SaveToFile CmJsFile, adSaveCreateOverWrite
    CssOutput.Close
    JsOutput.Close
End Sub

'Use [uglify-js] to compress and minify the JS build file
Sub MinifyFiles(ByVal CmJsFile)
    Dim Shell, Command
    Set Shell = WScript.CreateObject("WScript.Shell")
    Command = "cmd.exe /C uglifyjs ""{input}"" -o ""{output}"" -c -m"
    Command = Replace(Command, "{input}", CmJsFile)
    CmJsFile = Replace(CmJsFile, ".js", ".min.js")
    Command = Replace(Command, "{output}", CmJsFile)
    Shell.Run Command, 1, True
End Sub

'Delete all downloaded files
Sub DeleteFiles(FilePaths, CmJsFile)
    Dim fso, File
    Set fso = CreateObject("Scripting.FileSystemObject")
    For Each File in FilePaths
        fso.DeleteFile File
    Next
    fso.DeleteFile CmJsFile
End Sub

'Download and Save a single file
Sub DownloadFile(Url, SavePath)
    Dim Http, Stream
    Set Http = CreateObject("Microsoft.XMLHTTP")
    Set Stream = CreateObject("ADODB.Stream")

    Http.Open "GET", Url, False
    Http.Send

    With Stream
        .Type = adTypeBinary
        .Open
        .Write Http.responseBody
        .SaveToFile SavePath, adSaveCreateOverWrite
        .Close
    End With
End Sub

'Return folder of this script
Function GetCurrentFolder()
    Dim fso
    Set fso = CreateObject("Scripting.FileSystemObject")
    GetCurrentFolder = fso.GetParentFolderName(WScript.ScriptFullName)
End Function
