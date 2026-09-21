import { useState, useEffect } from 'react';
import axios from 'axios';
import { Applink } from '../../../LinkApi';
import type { Club } from './club_model';

export function useClubsController() {
  const [clubs, setClubs] = useState<Club[]>([]);

  const fetchClubs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(Applink.clubs, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClubs(response.data);
    } catch (error) {
      console.error('Error fetching clubs:', error);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, []);

  const addClub = async (data: any) => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('symbol', data.symbol || '');
      if (data.file) {
        formData.append('logo', data.file);
      }

      await axios.post(Applink.createClub, formData, {
        headers: { 
          Authorization: `Bearer ${token}`
        }
      });
      await fetchClubs();
    } catch (error: any) {
      console.error('Error adding club:', error.response?.data || error);
      const msg = error.response?.data?.message || 'Error';
      const errors = error.response?.data?.errors ? JSON.stringify(error.response.data.errors) : '';
      alert(`فشل الإضافة: ${msg} ${errors}`);
    }
  };

  const updateClub = async (id: string | number, data: any) => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('symbol', data.symbol || '');
      if (data.file) {
        formData.append('logo', data.file);
      }

      await axios.post(Applink.updateClub(id), formData, {
        headers: { 
          Authorization: `Bearer ${token}`
        }
      });
      await fetchClubs();
    } catch (error: any) {
      console.error('Error updating club:', error.response?.data || error);
      const msg = error.response?.data?.message || 'Error';
      const errors = error.response?.data?.errors ? JSON.stringify(error.response.data.errors) : '';
      alert(`فشل التعديل: ${msg} ${errors}`);
    }
  };

  const deleteClub = async (id: string | number) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(Applink.deleteClub(id), {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchClubs();
    } catch (error: any) {
      console.error('Error deleting club:', error.response?.data || error);
      alert('فشل الحذف');
    }
  };

  return {
    clubs,
    addClub,
    updateClub,
    deleteClub
  };
}
