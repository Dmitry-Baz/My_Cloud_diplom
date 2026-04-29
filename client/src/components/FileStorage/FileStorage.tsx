
import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../hooks';
import { fetchFiles, deleteFile, uploadFile, generateShareLink } from '../../store/slices/filesSlice';
import { useParams } from 'react-router-dom';

  const FileStorage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const dispatch = useAppDispatch();
  const { list: files, loading, error } = useAppSelector((state) => state.files);
  const { user, isAdmin } = useAppSelector((state) => state.auth);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [comment, setComment] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const targetUserId = isAdmin && userId ? parseInt(userId) : user?.id;
    if (targetUserId) {
      dispatch(fetchFiles(targetUserId));
    }
  }, [dispatch, userId, isAdmin, user?.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    await dispatch(uploadFile({ file: selectedFile, comment }));
    setSelectedFile(null);
    setComment('');
    setUploading(false);
    const targetUserId = isAdmin && userId ? parseInt(userId) : user?.id;
    if (targetUserId) dispatch(fetchFiles(targetUserId));
  };

  const handleDelete = async (fileId: number) => {
    if (window.confirm('Удалить файл?')) {
      await dispatch(deleteFile(fileId));
      const targetUserId = isAdmin && userId ? parseInt(userId) : user?.id;
      if (targetUserId) dispatch(fetchFiles(targetUserId));
    }
  };

  const handleShare = async (fileId: number) => {
    const result = await dispatch(generateShareLink(fileId));
    if (result.payload) {
      const shareLink = (result.payload as any).share_link;
      navigator.clipboard.writeText(`http://127.0.0.1:8000${shareLink}`);
      alert('Ссылка скопирована!');
    }
  };

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error}</div>;

  return (
    <div className="file-storage">
      <h2>Файловое хранилище</h2>
      
      <div className="upload-section">
        <h3>Загрузить файл</h3>
        <input type="file" onChange={handleFileChange} />
        <input
          type="text"
          placeholder="Комментарий"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <button onClick={handleUpload} disabled={!selectedFile || uploading}>
          {uploading ? 'Загрузка...' : 'Загрузить'}
        </button>
      </div>

      <div className="files-list">
        <h3>Мои файлы</h3>
        {files && files.length === 0 && <p>Нет загруженных файлов</p>}
        <ul>
          {files && files.map((file) => (
            <li key={file.id}>
              <span>{file.original_name}</span>
              <span>{file.size_mb} MB</span>
              <span>{file.comment}</span>
              <button onClick={() => handleShare(file.id)}>Поделиться</button>
              <button onClick={() => handleDelete(file.id)}>Удалить</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default FileStorage;


