import axios, { type AxiosInstance, type AxiosError } from 'axios';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

/**
 * Creates a configured Axios instance for the Bitbucket Cloud v2 API.
 *
 * - Uses HTTP Basic Auth. Supports both API Token (email + token) and
 *   App Password (username + password) — auto-selected from config.
 * - Credentials are never logged.
 * - Request interceptor logs method + URL at debug level.
 * - Response interceptor logs status at debug level; errors are logged at error level.
 */
export function createBitbucketClient(): AxiosInstance {
  const client = axios.create({
    baseURL: config.bitbucket.baseUrl,
    auth: {
      username: config.bitbucket.authUser,
      password: config.bitbucket.authToken,
    },
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    timeout: 30_000,
  });

  client.interceptors.request.use((req) => {
    logger.debug({ method: req.method?.toUpperCase(), url: req.url }, 'Bitbucket API request');
    return req;
  });

  client.interceptors.response.use(
    (res) => {
      logger.debug({ status: res.status, url: res.config.url }, 'Bitbucket API response');
      return res;
    },
    (err: AxiosError) => {
      logger.error(
        {
          status: err.response?.status,
          url: err.config?.url,
          // Log only message — never log headers/auth which contain credentials
          message: err.message,
        },
        'Bitbucket API error'
      );
      return Promise.reject(err);
    }
  );

  return client;
}
