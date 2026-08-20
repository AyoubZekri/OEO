export function showSnackbar(titleKey: string, messageKey: string, color: string = '#333') {
  // Remove any existing snackbar
  const existingSnackbar = document.getElementById('custom-snackbar');
  if (existingSnackbar) {
    existingSnackbar.remove();
  }

  // Create snackbar container
  const snackbar = document.createElement('div');
  snackbar.id = 'custom-snackbar';
  
  // Apply styling to mimic Flushbar
  Object.assign(snackbar.style, {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: color,
    color: 'white',
    padding: '15px 20px',
    borderRadius: '15px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    zIndex: '9999',
    fontFamily: 'Cairo, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: '250px',
    textAlign: 'center',
    transition: 'opacity 0.3s ease-out'
  });

  // Create title
  const title = document.createElement('div');
  title.textContent = titleKey;
  Object.assign(title.style, {
    fontWeight: 'bold',
    fontSize: '16px'
  });

  // Create message
  const message = document.createElement('div');
  message.textContent = messageKey;
  Object.assign(message.style, {
    fontSize: '14px'
  });

  snackbar.appendChild(title);
  snackbar.appendChild(message);
  
  document.body.appendChild(snackbar);

  // Auto-dismiss after 3 seconds
  setTimeout(() => {
    if (document.body.contains(snackbar)) {
      snackbar.style.opacity = '0';
      // Wait for transition to finish before removing
      setTimeout(() => {
        if (document.body.contains(snackbar)) {
          document.body.removeChild(snackbar);
        }
      }, 300);
    }
  }, 3000);
}
