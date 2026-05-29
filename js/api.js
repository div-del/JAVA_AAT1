/**
 * api.js — Centralized API calls for CollegeFixIt
 * Base URL points to the Spring Boot backend.
 */

const BASE_URL = 'http://localhost:8080';

const API = {

  /** POST /auth/register */
  register: async (name, email, password, role) => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || 'Registration failed');
    }
    return res.json(); // now returns full user { id, name, email, role }
  },

  /** POST /auth/login */
  login: async (email, password) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || 'Invalid email or password');
    }
    return res.json(); // returns full user { id, name, email, role }
  },

  /** POST /complaints — student submits */
  submitComplaint: async (title, description, userId) => {
    const res = await fetch(`${BASE_URL}/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, userId })
    });
    const text = await res.text();
    if (!res.ok) throw new Error(text || 'Failed to submit complaint');
    return text;
  },

  /** GET /complaints/user/{id} — student's own complaints */
  getMyComplaints: async (userId) => {
    const res = await fetch(`${BASE_URL}/complaints/user/${userId}`);
    if (!res.ok) throw new Error('Failed to load complaints');
    return res.json();
  },

  /** GET /complaints/all — admin sees all */
  getAllComplaints: async () => {
    const res = await fetch(`${BASE_URL}/complaints/all`);
    if (!res.ok) throw new Error('Failed to load complaints');
    return res.json();
  },

  /** PUT /complaints/{id} — admin updates status */
  updateStatus: async (complaintId, status) => {
    const res = await fetch(`${BASE_URL}/complaints/${complaintId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const text = await res.text();
    if (!res.ok) throw new Error(text || 'Failed to update status');
    return text;
  }
};
