
import React, { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../hooks';
import { fetchUsers, deleteUser, toggleAdminStatus } from '../../store/slices/usersSlice';
import './AdminPanel.css';

export const AdminPanel: React.FC = () => {
    const dispatch = useAppDispatch();
    const { list: users, loading, error } = useAppSelector((state) => state.users);
    const { isAdmin, token } = useAppSelector((state) => state.auth);
    
    useEffect(() => {
        if (isAdmin && token) {
            dispatch(fetchUsers());
        }
    }, [dispatch, isAdmin, token]);
    
    const handleDeleteUser = (userId: number) => {
        if (window.confirm('Удалить пользователя?')) {
            dispatch(deleteUser(userId));
        }
    };
    
    const handleToggleAdmin = (userId: number, currentStatus: boolean) => {
        dispatch(toggleAdminStatus({ userId, isAdmin: currentStatus }));
    };
    
    if (!isAdmin) {
        return <div className="admin-panel">Нет прав доступа</div>;
    }
    
    if (loading) {
        return <div className="admin-panel">Загрузка...</div>;
    }
    
    if (error) {
        return <div className="admin-panel">Ошибка: {error}</div>;
    }
    
    return (
        <div className="admin-panel">
            <h2>Управление пользователями</h2>
            <table className="users-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Имя пользователя</th>
                        <th>Email</th>
                        <th>Полное имя</th>
                        <th>Администратор</th>
                        <th>Статистика файлов</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user.id}>
                            <td>{user.id}</td>
                            <td>{user.username}</td>
                            <td>{user.email}</td>
                            <td>{user.full_name || user.username}</td>
                            <td>{user.is_admin ? 'Да' : 'Нет'}</td>
                            <td>
                                {user.file_stats ? 
                                    `${user.file_stats.count} файлов, ${(user.file_stats.total_size / 1024 / 1024).toFixed(2)} МБ` : 
                                    'Нет файлов'}
                            </td>
                            <td>
                                <button 
                                    className="btn-admin" 
                                    onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                                >
                                    {user.is_admin ? 'Снять админа' : 'Назначить админом'}
                                </button>
                                <button 
                                    className="btn-delete" 
                                    onClick={() => handleDeleteUser(user.id)}
                                >
                                    Удалить
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};


