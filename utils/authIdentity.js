import { env } from '../config/env.js';

export const DEPRECATED_ADMIN_EMAILS = ['dbadmin6432@gmail.com'];

export const normalizeEmail = (email = '') => email.toLowerCase().trim();

export const isConfiguredAdminEmail = (email) => normalizeEmail(email) === env.adminEmail;

export const isDeprecatedAdminEmail = (email) => DEPRECATED_ADMIN_EMAILS.includes(normalizeEmail(email));
