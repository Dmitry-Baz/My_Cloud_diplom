import React, { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks";
import {
  fetchFiles,
  deleteFile,
  uploadFile,
} from "../../store/slices/filesSlice";
import { logout } from "../../store/slices/authSlice";
import { useNavigate } from "react-router-dom";

const FileStorage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { user, token } = useAppSelector((state) => state.auth);
  const {
    items: files,
    status,
    error,
  } = useAppSelector((state) => state.files);

  useEffect(() => {
    if (user && token) {
      dispatch(fetchFiles({ userId: user.id_user, token }));
    } else {
      navigate("/login");
    }
  }, [dispatch, user, token, navigate]);

  const handleDelete = (fileId: number) => {
    if (token) {
      dispatch(deleteFile({ fileId, token }));
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && user && token) {
      dispatch(
        uploadFile({ file: e.target.files[0], userId: user.id_user, token })
      );
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  if (status === "loading") return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error}</div>;

  return (
    <div>
      <header>
        <h1>Привет, {user?.username}</h1>
        <button onClick={handleLogout}>Выйти</button>
      </header>

      <div className="upload-section">
        <input type="file" onChange={handleUpload} />
      </div>

      <ul>
        {files.map((file) => (
          <li key={file.id}>
            <a href={file.file} target="_blank" rel="noopener noreferrer">
              {file.file.split("/").pop()}
            </a>
            <button onClick={() => handleDelete(file.id)}>Удалить</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FileStorage;
