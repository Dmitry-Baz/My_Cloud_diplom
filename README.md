# Дипломный проект по профессии «Fullstack-разработчик на Python - JS»

# MyCloud - Облачное хранилище

![Демо](client/assets/mycloud.gif)

## Быстрый старт

```bash
# Бэкенд
cd server
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Фронтенд (другой терминал)
cd client
npm install
npm run dev

Технологии
Django, DRF, PostgreSQL

React, Redux Toolkit, TypeScript

API
Метод	Эндпоинт
POST	/api/users/
POST	/api/auth/login/
GET	/api/storage/

© 2026

# 📹 Демонстрация работы

![Демонстрация](client/assets/mycloud.gif)

Build Command: pip install -r requirements.txt

Start Command: cd server && gunicorn backend_project.wsgi:application