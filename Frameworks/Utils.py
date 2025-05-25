import datetime
import sys
import threading
from lunardate import LunarDate
import playsound
from PIL import (
    Image, 
    ImageFilter, 
    ImageDraw, 
    ImageOps,
)

class Utils():
    def __init__(self, args):
        self.UI_LOCALE = args.UI_LOCALE
        self.SET_MUTE = args.SET_MUTE        
        self.UI_SCALE = args.UI_SCALE

    def playsound(self, path: str):
        if not self.SET_MUTE:
            threading.Thread(target=playsound.playsound, args=[path], daemon=True).start()

    def getChineseDate(self, date = None) -> dict:
        if date is None:
            date = datetime.now()

        lunar_date = LunarDate.fromSolarDate(date.year, date.month, date.day)

        weekday_list = ["一", "二", "三", "四", "五", "六", "日"]
        weekday = weekday_list[date.weekday()]

        month_list = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"]
        day_list = [
            "", "初一", "初二", "初三", "初四", "初五", "初六", "初七", "初八", "初九", "初十",
            "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十",
            "廿一", "廿二", "廿三", "廿四", "廿五", "廿六", "廿七", "廿八", "廿九", "三十"
        ]

        heavenly_stems = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"]
        earthly_branches = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"]
        gz_year = f"{heavenly_stems[(lunar_date.year - 4) % 10]}{earthly_branches[(lunar_date.year - 4) % 12]}"

        lunar_month_text = f"闰{month_list[lunar_date.month]}" if lunar_date.isLeapMonth else f"{month_list[lunar_date.month]}"

        return {
            "solar": {
                "year": date.year,
                "month": date.month,
                "day": date.day,
                "weekday": f"星期{weekday}",
            },
            "lunar": {
                "year": lunar_date.year,
                "month": lunar_date.month,
                "day": lunar_date.day,
                "is_leap_month": lunar_date.isLeapMonth,
                "gz_year": gz_year,
                "month_text": lunar_month_text,
                "day_text": day_list[lunar_date.day]
            }
        }

    def getScaled(self, number: float) -> int:
        return int(number * self.UI_SCALE)

    @staticmethod
    def bindCanvaScroll(cv, root):
        def on_linux(event):
            if event.num == 4:
                cv.yview_scroll(-1, "units")
            elif event.num == 5:
                cv.yview_scroll(1, "units")

        def on_other(event):
            cv.yview_scroll(-1 * (event.delta // 120), "units")  # Windows/macOS

        def on_resize(event):
            if hasattr(cv, 'configure'):
                cv.configure(scrollregion=cv.bbox("all"))

        if sys.platform.startswith('linux'):
            cv.bind_all("<Button-4>", on_linux)
            cv.bind_all("<Button-5>", on_linux)
        else:
            cv.bind_all("<MouseWheel>", on_other)

        root.bind("<Configure>", on_resize)

    @staticmethod
    def makeImageBlur(img: Image.Image, radius: int = 10) -> Image.Image:
        return img.filter(ImageFilter.GaussianBlur(radius=radius))

    
    @staticmethod
    def makeRadiusImage(img: Image.Image, radius: int = 30, alpha: float = 0.5) -> Image.Image:
        img = img.convert("RGBA")

        mask = Image.new("L", img.size, 0)
        draw = ImageDraw.Draw(mask)

        draw.rounded_rectangle(
            (0, 0, img.size[0], img.size[1]), radius, fill=int(256 * alpha))

        img.putalpha(mask)

        return img

    
    @staticmethod
    def makeMaskImage(size: tuple, color: tuple) -> Image.Image:
        return Image.new("RGBA", size=size, color=color)

    
    @staticmethod
    def mergeImage(image: Image.Image, alpha: Image.Image) -> Image.Image:
        if image.format != 'RGBA': # ValueError: image has wrong mode 
            image = image.convert('RGBA')

        if alpha.format != 'RGBA':
            alpha = alpha.convert('RGBA')
        return Image.alpha_composite(image, alpha)

    
    @staticmethod
    def getProportionalImage(img: Image.Image, size: tuple) -> Image.Image:
        target_width, target_height = size
        scale_width = target_width / img.width
        scale_height = target_height / img.height
        scale = min(scale_width, scale_height)
        
        new_width = int(img.width * scale)
        new_height = int(img.height * scale)
        
        resized_img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        resized_img = ImageOps.fit(resized_img, (target_width, target_height), Image.Resampling.LANCZOS, 0, (0.5, 0.5))
        
        return resized_img