import axios from 'axios';

export const getLatestMatch = async () => {
  try {
    const res = await axios.get('http://localhost:3000/matches/latest');
    return res.data;
  } catch (err) {
    console.error('Error getLatestMatch', err);
    return null;
  }
};

export const getUpcomingMatches = async (limit = 10) => {
  try {
    const res = await axios.get(`http://localhost:3000/matches/upcoming?limit=${limit}`);
    return res.data || [];
  } catch (err) {
    console.error('Error getUpcomingMatches', err);
    return [];
  }
};

export const getPastMatches = async (limit = 20) => {
  try {
    const res = await axios.get(`http://localhost:3000/matches/past?limit=${limit}`);
    return res.data || [];
  } catch (err) {
    console.error('Error getPastMatches', err);
    return [];
  }
};