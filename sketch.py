import sys
import os
import subprocess

file = './static/index.html'
subprocess.call(["xdg-open", file])
# if sys.platform.startswith('linux'):
    