import '@babel/polyfill';
import displayMap from './mapbox';
import { login, logout } from './login';
import { updateSettings } from './updateSettings';

//DOM elements
const map = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const logOutBtn = document.querySelector('.nav__el--logout');

//Values

//Delegation
if(map) {
  const locations = JSON.parse(map.dataset.locations);
  displayMap(locations);
}

if(loginForm) {
  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}

if(logOutBtn) {
  logOutBtn.addEventListener('click', logout);
}

if(userDataForm) {
  userDataForm.addEventListener('submit', e => {
    e.preventDefault();
    //Construct multipart form
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    //Send data
    updateSettings(form, 'data');
  });
}

if(userPasswordForm) mlsmglsmglsmglmglsmlsmglsmgslmgslmglmlsglmslgmlsmglmg{
  userPasswordForm.addEventListener('submit', async  e => {
    e.preventDefault();
    document.querySelector('.btn--save-password').textContent = 'Updating...'
    const password = document.getElementById('password-current').value;
    const newPassword = document.getElementById('password').value;
    const newPasswordConfirm = document.getElementById('password-confirm').value;
    await updateSettings({password, newPassword, newPasswordConfirm}, 'password');
    //use await so we can wait for promise to resolve before clearing the fields
    document.querySelector('.btn--save-password').textContent = 'Save password'
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
}
