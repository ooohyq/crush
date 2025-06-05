import asyncio
from aiogram import Bot, Dispatcher, F
from aiogram.types import Message, ReplyKeyboardMarkup, KeyboardButton, WebAppInfo

# Введите ваш токен и ссылку на мини-аппу:
BOT_TOKEN = "7256677058:AAFwDhn6ufFhtvFqTDSZuL3u7Q3iTofkyGg"
WEB_APP_URL = "https://684150c2f4a82fc195d51875--jazzy-selkie-bc4008.netlify.app"  # ссылка на ваше Telegram Web App

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

@dp.message(F.text == "/start")
async def start_cmd(message: Message):
    kb = ReplyKeyboardMarkup(
        keyboard=[
            [
                KeyboardButton(
                    text="🚀 Открыть мини-аппу",
                    web_app=WebAppInfo(url=WEB_APP_URL)
                )
            ]
        ],
        resize_keyboard=True
    )
    await message.answer(
        "Добро пожаловать в Crash Mini App!\n\nНажмите на кнопку ниже, чтобы открыть мини-приложение прямо в Telegram.",
        reply_markup=kb
    )

async def main():
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())