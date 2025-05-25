make = {
    'Sources/yuujin.py': 'Releases/main.app',
}























import py_compile
import os
import Frameworks.Logger as Logger
import sys

Logger.output('Starting project build...')

total = len(make)
current = 1

for src, dst in make.items():
    if not os.path.exists(src):
        Logger.output(f"[{current}/{total}] Source file not found: {src}, skipping...", type=Logger.Type.ERROR)
        sys.exit()

    try:
        py_compile.compile(src, cfile=dst, doraise=True)
        Logger.output(f"[{current}/{total}] {src} -> {dst}", type=Logger.Type.INFO)
    except py_compile.PyCompileError as e:
        Logger.output(f"[{current}/{total}] Syntax error in {src}:\n{e}", type=Logger.Type.ERROR)
        sys.exit()
    
    current += 1

Logger.output(f"Project build complete.")

