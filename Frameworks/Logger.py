import datetime
import inspect
import sys
import re

from colorama import Fore, Style, Back, init

init()

log = []

class Type():
    INFO = f'{Back.BLUE} INFO {Back.RESET}'
    ERROR = f'{Back.RED}{Style.BRIGHT} FAIL {Back.RESET}{Fore.RED}'
    WARN = f'{Back.YELLOW} WARN {Back.RESET}{Fore.YELLOW}'
    DEBUG = f'{Back.MAGENTA} DEBG {Back.RESET}'

with open('latest.log', 'w'):
    pass

def output(value: str, end: str = "\n", type: str = Type.INFO):
    global log

    now = datetime.datetime.now()
    sys.stdout.write(f"{Back.GREEN} {now.strftime('%H:%M:%S')} {Back.CYAN} " +
                     inspect.stack()[1].filename.replace('\\', '/').split('/')[-1][:-3] + f" {type} {value} {Style.RESET_ALL}")
    type = re.compile('\x1B(?:[@-Z\\\\-_]|\\[[0-?]*[ -/]*[@-~])').sub('', type)
    moduleName = inspect.stack()[1].filename.replace('\\', '/').split('/')[-1][:-3]
    log.append(f"{now.strftime('%H:%M:%S')} {moduleName}{type}{value}")

    with open('latest.log', 'a') as f:
        f.write(f"{now.strftime('%H:%M:%S')} {moduleName}{type}{value}\n")

    sys.stdout.write(f'{end}')
    sys.stdout.flush()
