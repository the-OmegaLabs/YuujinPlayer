import webview

# 创建窗口
def create_window():
    window = webview.create_window(
        title="Yuujin Player",  # 窗口标题
        url="index.html",      # 加载的 HTML 文件
        width=1280,            # 窗口宽度
        height=720             # 窗口高度
    )

    webview.start(debug=True)  # 启动窗口

if __name__ == "__main__":
    create_window()