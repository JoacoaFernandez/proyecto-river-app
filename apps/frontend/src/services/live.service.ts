import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const getLiveDashboard = async () => {
  try {
    const res = await axios.get(`${API_URL}/live/dashboard`);
    return res.data;
  } catch (error) {
    console.error('Error fetching live dashboard:', error);
    return null;
  }
};