// client/src/components/LoginForm/LoginForm.tsx
import "./LoginForm.css";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../hooks";
import { login } from "../../store/slices/authSlice";
import axios, { AxiosError } from "axios";  // ← добавляем импорт AxiosError

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export const LoginForm: React.FC = () => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [localError, setLocalError] = useState<string>("");

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError("");
    
    try {
      const result = await dispatch(login({ username, password }));
      
      if (login.fulfilled.match(result)) {
        const user = result.payload.user;
        if (user.is_admin || user.role === "admin") {
          navigate("/admin");
        } else {
          navigate(`/storage/${user.id}`);
        }
      } else if (login.rejected.match(result)) {
        setLocalError(result.payload as string || "Ошибка при входе");
      }
    } catch (err) {
      // 👇 ПРАВИЛЬНАЯ ОБРАБОТКА ОШИБОК без 'any'
      if (err instanceof AxiosError) {
        // Ошибка axios (сетевая или от сервера)
        const serverMessage = err.response?.data?.detail || err.response?.data?.message;
        setLocalError(serverMessage || err.message || "Ошибка сети");
      } else if (err instanceof Error) {
        // Обычная ошибка JavaScript
        setLocalError(err.message);
      } else {
        // Неизвестная ошибка
        setLocalError("Произошла неизвестная ошибка");
      }
    }
  };

  return (
    <div className="wrap">
      <h2>Введите данные для входа</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-signin">
          <label>
            Логин:
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>
        </div>
        <div className="input-signin">
          <label>
            Пароль:
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
        </div>
        {localError && <div style={{ color: "red" }}>{localError}</div>}
        <button className="button-signin" type="submit">
          Войти
        </button>
      </form>
    </div>
  );
};
