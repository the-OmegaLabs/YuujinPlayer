import sys
import importlib.machinery
import importlib.util
import os
import Frameworks.Logger as Logger

class AppRuntime():
    def loadConfig(self):
        self.IS_DEVMODE   = True            # run source code
        # self.IS_DEVMODE = False           # run compiled code

        self.APP_PATH     = 'Sources/yuujin.py'    # path
                                    
        self.IS_LOWGPU    = False           # disable animation
        self.UI_SCALE     = 1.3             # scale of UI
        self.UI_FPS       = 200             # animation fps
        self.UI_THEME     = 'dark' 
        self.UI_LOCALE    = 'zh'    
        self.UI_ANIMATIME = 500
        self.UI_FAMILY    = '源流黑体 CJK'
        self.SET_USER     = 'root'
        self.SET_UID      = 1000
        self.SET_MUTE     = False           # disable sound play

    def launch(self):
        if sys.argv[-1].endswith('.app'):
            self.APP_PATH = sys.argv[-1]
        
        self.APP_PATH = os.path.abspath(self.APP_PATH)

        if sys.argv[-1].endswith('.py'):
            spec = importlib.util.spec_from_file_location("loaded_module", self.APP_PATH)
            print(self.APP_PATH)
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
        
        elif sys.argv[-1].endswith('.app'):
            loader = importlib.machinery.SourcelessFileLoader("loaded_module", self.APP_PATH)
            module = loader.load_module()

        else:
            Logger.output('Unsupported executable format', type=Logger.Type.ERROR)
            exit()


        module.Application(self)

    def __init__(self):
        self.loadConfig()

        if self.IS_LOWGPU:
            self.UI_ANIMATIME = 0
        
        self.launch()
            
AppRuntime()