/* ==========================================================
   AUTH — login / logout / sesión con Supabase Auth
========================================================== */
const loginScreen = document.getElementById('login-screen');
const appShell = document.getElementById('app-shell');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const loginSubmit = document.getElementById('login-submit');
const adminEmailEl = document.getElementById('admin-email');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.hidden = true;
  loginSubmit.disabled = true;
  loginSubmit.textContent = 'Ingresando…';

  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  const { error } = await sb.auth.signInWithPassword({ email, password });

  loginSubmit.disabled = false;
  loginSubmit.textContent = 'Iniciar sesión';

  if(error){
    loginError.textContent = error.message === 'Invalid login credentials'
      ? 'Correo o contraseña incorrectos.'
      : sbErrorMsg(error);
    loginError.hidden = false;
    return;
  }
  // onAuthStateChange (en app.js) se encarga de mostrar el dashboard
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  await sb.auth.signOut();
});

function showLoginScreen(){
  loginScreen.hidden = false;
  appShell.hidden = true;
}

function showAppShell(session){
  loginScreen.hidden = true;
  appShell.hidden = false;
  adminEmailEl.textContent = session?.user?.email || '';
}
