import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form,    setForm]    = useState({ name: '', username: '', email: '', password: '', semester: '', year: '', department: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authAPI.register(form);
      login(data.user, data.token);
      toast.success('Account created! Welcome to UniHub 🎓');
      navigate('/feed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
    setLoading(false);
  };

  const upd = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="auth-page">
      <div className="auth-card wide">
        <div className="auth-brand">
          <div className="auth-brand-logo">Uni<span>Hub</span></div>
          <div className="auth-brand-tagline">Your university knowledge network</div>
        </div>
        <h2 className="auth-title">Create your account</h2>
        <p className="auth-subtitle">Join your university's knowledge network</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" value={form.name} onChange={upd('name')}
                placeholder="Your full name" required className="input-field" />
            </div>
            <div className="form-group">
              <label>Username</label>
              <input type="text" value={form.username} onChange={upd('username')}
                placeholder="e.g. nimal_k" required className="input-field" />
            </div>
          </div>
          <div className="form-group">
            <label>University Email</label>
            <input type="email" value={form.email} onChange={upd('email')}
              placeholder="you@university.edu" required className="input-field" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={form.password} onChange={upd('password')}
              placeholder="Minimum 6 characters" required className="input-field" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Department</label>
              <input type="text" value={form.department} onChange={upd('department')}
                placeholder="e.g. Computer Science" className="input-field" />
            </div>
            <div className="form-group">
              <label>Year</label>
              <select value={form.year} onChange={upd('year')} className="input-field">
                <option value="">Select year</option>
                {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Semester</label>
              <select value={form.semester} onChange={upd('semester')} className="input-field">
                <option value="">Select semester</option>
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" className="btn-primary btn-full" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
};
export default RegisterPage;
