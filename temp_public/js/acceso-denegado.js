      const logoutBtn = document.getElementById('logout-btn-nav');
      if (logoutBtn) {
          logoutBtn.addEventListener('click', async (e) => {
              e.preventDefault();
              try {
                  const response = await fetch('/logout');
                  const result = await response.json();
                  if (result.success) {
                      alert(result.message);
                      window.location.href = '/';
                  } else {
                      alert('Error al cerrar sesion: ' + result.message);
                  }
              } catch (error) {
                  console.error('Error al cerrar sesion:', error);
                  alert('Ocurrio un error al intentar cerrar sesion.');
              }
          });
      }
