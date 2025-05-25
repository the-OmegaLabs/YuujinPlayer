import webview
import os

class Application:
    def __init__(self, args):
        window = webview.create_window(
            title="Yuujin Player",  # 窗口标题
            url="/index.html",      # 加载的 HTML 文件
            width=1280,            # 窗口宽度
            height=720             # 窗口高度
        )
        webview.start()
