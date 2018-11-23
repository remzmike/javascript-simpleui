rem chrome_cmd.exe --no-sandbox --js-flags="--trace-opt --trace-deopt --allow-natives-syntax --redirect-code-traces"
rem C:\Chromium\bin\chrome_cmd.exe --js-flags="--trace-deopt --allow-natives-syntax --redirect-code-traces"
rem the above crashes often for some reason (redirect code traces)
rem the below does not
rem C:\Chromium\bin\chrome_cmd.exe --js-flags="--trace-opt --trace-deopt --allow-natives-syntax"
rem changing to gui to see if things show in debugview
rem for some reason --no-sandbox helps debugview?
rem C:\Chromium\bin\chrome_gui.exe --no-sandbox --js-flags="--trace-deopt --allow-natives-syntax --redirect-code-traces"

rem C:\Chromium\bin\chrome_gui.exe --no-sandbox --js-flags="--code-comments --trace-deopt --allow-natives-syntax --redirect-code-traces"
rem --remote-debugging-port=9222
C:\Chromium\bin\chrome_gui.exe --no-sandbox --js-flags="--code-comments --trace-deopt --allow-natives-syntax --redirect-code-traces --remote-debugging-port=9222"

rem C:\Chromium\bin\chrome_cmd.exe --js-flags="--trace-deopt --allow-natives-syntax"
rem C:\Chromium\bin\chrome_cmd.exe --js-flags="--allow-natives-syntax"