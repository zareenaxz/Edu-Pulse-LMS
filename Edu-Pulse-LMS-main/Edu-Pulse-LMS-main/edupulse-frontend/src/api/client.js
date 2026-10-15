// EduPulse API Client
// Centralized frontend -> backend communication

const API_ORIGIN =
  import.meta.env?.VITE_API_URL ||
  'http://localhost:5000';

// Accept both:
// http://localhost:5000
// http://localhost:5000/api
// Prevent /api/api/... problems
const BASE = API_ORIGIN
  .replace(/\/+$/, '')
  .replace(/\/api$/, '');

const API_BASE = `${BASE}/api`;

const REQUEST_TIMEOUT = 15000;

const TOKEN_KEY = 'edupulse_token';
const USER_KEY = 'edupulse_user';


// ====================================================
// SESSION
// ====================================================

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};


export const getUser = () => {
  try {
    return JSON.parse(
      localStorage.getItem(USER_KEY) || 'null'
    );
  } catch {
    return null;
  }
};


export const setSession = (token, user) => {

  if (token) {
    localStorage.setItem(
      TOKEN_KEY,
      token
    );
  }

  if (user) {
    localStorage.setItem(
      USER_KEY,
      JSON.stringify(user)
    );
  }
};


export const clearSession = () => {

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);

};


// ====================================================
// FILE URL
// ====================================================

export const fileUrl = (url) => {

  if (!url) return '';

  // Already a complete URL
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  // Backend uploaded files
  return `${BASE}${url.startsWith('/') ? '' : '/'}${url}`;

};


// ====================================================
// CORE REQUEST
// ====================================================

async function request(
  path,
  {
    method = 'GET',
    body,
    formData
  } = {}
) {

  const headers = {};

  const token = getToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }


  let payload;


  // Multipart / file upload
  if (formData) {

    payload = formData;

  }

  // JSON request
  else if (body !== undefined) {

    headers['Content-Type'] =
      'application/json';

    payload = JSON.stringify(body);

  }


  const controller =
    new AbortController();

  const timeoutId =
    setTimeout(
      () => controller.abort(),
      REQUEST_TIMEOUT
    );


  let response;


  try {

    response = await fetch(
      `${API_BASE}${
        path.startsWith('/')
          ? path
          : `/${path}`
      }`,
      {
        method,
        headers,
        body: payload,

        // Keep cookies if backend uses them
        credentials: 'include',

        // Always get latest database data
        cache: 'no-store',

        signal: controller.signal
      }
    );

  }

  catch (error) {

    if (error?.name === 'AbortError') {

      throw new Error(
        'Request timed out. Please make sure the EduPulse backend is running.'
      );

    }

    throw new Error(
      'Cannot connect to the EduPulse backend. Please make sure the server is running on port 5000.'
    );

  }

  finally {

    clearTimeout(timeoutId);

  }


  // ==================================================
  // RESPONSE
  // ==================================================

  let data = null;

  const contentType =
    response.headers.get(
      'content-type'
    ) || '';


  if (
    contentType.includes(
      'application/json'
    )
  ) {

    try {

      data = await response.json();

    }

    catch {

      data = null;

    }

  }


  // ==================================================
  // UNAUTHORIZED
  // ==================================================

  if (response.status === 401) {

    clearSession();

  }


  // ==================================================
  // ERROR
  // ==================================================

  if (!response.ok) {

    throw new Error(
      data?.message ||
      data?.error ||
      `Request failed (${response.status})`
    );

  }


  return data;

}


// ====================================================
// API
// ====================================================

const api = {

  // ==================================================
  // GENERIC REQUESTS
  // ==================================================

  get(path) {

    return request(path);

  },


  post(path, body) {

    return request(path, {
      method: 'POST',
      body
    });

  },


  patch(path, body) {

    return request(path, {
      method: 'PATCH',
      body
    });

  },


  put(path, body) {

    return request(path, {
      method: 'PUT',
      body
    });

  },


  delete(path) {

    return request(path, {
      method: 'DELETE'
    });

  },


  del(path) {

    return request(path, {
      method: 'DELETE'
    });

  },


  // ==================================================
  // FILE UPLOAD
  // ==================================================

  upload(
    path,
    formData,
    method = 'POST'
  ) {

    return request(path, {
      method,
      formData
    });

  },


  // ==================================================
  // AUTH
  // ==================================================

  // --------------------------------------------------
  // LOGIN
  // --------------------------------------------------

  login: async (
    email,
    password
  ) => {

    const data =
      await request(
        '/auth/login',
        {
          method: 'POST',

          body: {
            email,
            password
          }
        }
      );


    setSession(
      data.token,
      data.user
    );


    return data.user;

  },


  // --------------------------------------------------
  // STUDENT REGISTER
  // --------------------------------------------------

  registerStudent: async ({
    name,
    email,
    password
  }) => {

    const data =
      await request(
        '/auth/register/student',
        {
          method: 'POST',

          body: {
            name,
            email,
            password
          }
        }
      );


    // Automatically login student
    if (
      data.token &&
      data.user
    ) {

      setSession(
        data.token,
        data.user
      );

    }


    return data;

  },


  // --------------------------------------------------
  // INSTRUCTOR REGISTER
  // --------------------------------------------------

  registerInstructor: async ({
    name,
    email,
    password,
    qualification,
    experience,
    profileImage
  }) => {

    let data;


    // With profile image
    if (profileImage) {

      const formData =
        new FormData();


      formData.append(
        'name',
        name
      );

      formData.append(
        'email',
        email
      );

      formData.append(
        'password',
        password
      );

      formData.append(
        'qualification',
        qualification || ''
      );

      formData.append(
        'experience',
        experience || ''
      );

      formData.append(
        'profile_image',
        profileImage
      );


      data =
        await request(
          '/auth/register/instructor',
          {
            method: 'POST',
            formData
          }
        );

    }

    // Without profile image
    else {

      data =
        await request(
          '/auth/register/instructor',
          {
            method: 'POST',

            body: {
              name,
              email,
              password,

              qualification:
                qualification || '',

              experience:
                experience || ''
            }
          }
        );

    }


    return data;

  },


  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------

  logout: async () => {

    try {

      await request(
        '/auth/logout',
        {
          method: 'POST'
        }
      );

    }

    catch (error) {

      console.error(
        'Logout request failed:',
        error.message
      );

    }


    clearSession();

  },


  // --------------------------------------------------
  // CURRENT USER
  // --------------------------------------------------

  getMe: async () => {

    const data =
      await request(
        '/auth/me'
      );


    if (data?.user) {

      localStorage.setItem(
        USER_KEY,
        JSON.stringify(
          data.user
        )
      );

    }


    return data?.user || null;

  }

};


// ====================================================
// EXPORT
// ====================================================

export { api };

export default api;