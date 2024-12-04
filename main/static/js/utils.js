// Función para enviar el puntaje al servidor
export function sendScoreToServer(playerName, score) {
    fetch('/api/scores/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'  // Tipo de contenido JSON
        },
        body: JSON.stringify({ player_name: playerName, score: score })  // Enviar datos del jugador y los puntos
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();  // Respuesta en formato JSON
    })
    .then(data => {
        console.log('Score guardado:', data.message);  // Verificar en consola la respuesta del servidor
    })
    .catch(error => {
        console.error('Error al guardar puntaje:', error.message);  // Manejar cualquier error en la solicitud
    });
}

// Función para obtener el token CSRF de las cookies
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.startsWith(`${name}=`)) {
                cookieValue = cookie.substring(name.length + 1);
                break;
            }
        }
    }
    return cookieValue;
}




