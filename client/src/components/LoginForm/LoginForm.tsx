import "./LoginForm.css";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../hooks";
import {
  loginStart,
  loginSuccess,
  loginFailure,
} from "../../store/slices/authSlice";
import axios from "axios";

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
    dispatch(loginStart());

    try {
      const authResponse = await axios.post(
        `${API_BASE_URL}/auth/token/login/`,
        {
          username,
          password,
        }
      );

      const auth_token = authResponse.data.auth_token;

      const userResponse = await axios.get(
        `${API_BASE_URL}/api/users/user_info/`,
        {
          headers: {
            Authorization: `Token ${auth_token}`,
          },
        }
      );

      const userData = userResponse.data;

      const userPayload = {
        id_user: userData.id_user,
        username: userData.username,
        email: userData.email,
        role: userData.role,
        is_superuser: userData.is_superuser || userData.role === "admin",
      };

      dispatch(loginSuccess({ token: auth_token, user: userPayload }));

      if (userPayload.role === "admin" || userPayload.is_superuser) {
        navigate("/admin");
      } else {
        navigate(`/storage/${userPayload.id_user}`);
      }
    } catch (err: any) {
      dispatch(loginFailure());
      console.error(err);

      if (err.response && err.response.data && err.response.data.detail) {
        setLocalError(err.response.data.detail);
      } else if (err.message) {
        setLocalError(err.message);
      } else {
        setLocalError("Произошла ошибка при входе");
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
