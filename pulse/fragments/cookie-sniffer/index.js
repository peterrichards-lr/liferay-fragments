if (!fragmentNamespace) {
  return;
}

const isEditMode = document.body.classList.contains('has-edit-mode-menu');

if (isEditMode) {
  if (fragmentElement) {
    const info = document.createElement('div');
    info.classList.add('alert');
    info.classList.add('alert-info');
    info.innerText =
      'This fragment will display campaign information from Pulse cookies';
    fragmentElement.append(info);
  }
  return;
}

if (!getCookie) {
  if (fragmentElement) {
    const info = document.createElement('div');
    info.classList.add('alert');
    info.classList.add('alert-warn');
    info.innerText =
      'The JS client extension for Pulse has not been added to this page';
    fragmentElement.append(info);
  }
  return;
}

const dl = document.createElement('dl');
dl.classList.add('info-grid');
var dt = document.createElement('dt');
var dd = document.createElement('dd');
dt.innerText = 'Pulse Campaign Id';
dd.innerText = getCookie('__pcId');
dl.appendChild(dt);
dl.appendChild(dd);
fragmentElement.appendChild(dl);

dt = document.createElement('dt');
dd = document.createElement('dd');
dt.innerText = 'Pulse URL Token';
dd.innerText = getCookie('__pcUt');
dl.appendChild(dt);
dl.appendChild(dd);
fragmentElement.appendChild(dl);

dt = document.createElement('dt');
dd = document.createElement('dd');
dt.innerText = 'Pulse Interaction Id';
dd.innerText = getCookie('__intId');
dl.appendChild(dt);
dl.appendChild(dd);
fragmentElement.appendChild(dl);
