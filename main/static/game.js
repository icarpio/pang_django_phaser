// Variables globales
let player;
let harpoon;
let level = 1;
let playerLives = 3;
let score = 0;
let cursors;
let harpoonLaunched = false;
let bubbles = []; 
let levelText, livesText, scoreText, finalScore = 0;
let currentBackground;
let levelBackgrounds = [
    '/static/background_level_1.png', 
    '/static/background_level_2.png',
    '/static/backgrounds/background_level_3.png',
    '/static/backgrounds/background_level_4.png',
];
let platforms;
let harpoons; // Grupo para los arpones


// Función para cargar los recursos
function preload() {
    this.load.image('player', 'static/player.png');
    this.load.image('harpoon', 'static/harpoon.png');
    this.load.image('bubble', 'static/bubble.png');
    this.load.image('bubbleSmall', 'static/bubbleSmall.png');
    this.load.image('bubbleTiny', 'static/bubbleTiny.png'); 
    this.load.image('background', 'static/background.png');
    this.load.image('ground', 'static/ground.png'); 
    for (let i = 0; i < levelBackgrounds.length; i++) {
        this.load.image(`background_${i + 1}`, levelBackgrounds[i]);
    }
}


function create() {
    // Crear el grupo de arpones
    harpoons = this.physics.add.group();

    platforms = this.physics.add.staticGroup();
    platforms.create(400, 568, 'ground').setScale(2).refreshBody();

    player = this.physics.add.sprite(400, 500, 'player').setCollideWorldBounds(true);
    this.physics.add.collider(player, platforms);

    // Crear el arpón inicialmente pero ocultarlo
    harpoon = this.physics.add.image(400, 500, 'harpoon').setVisible(false);
    harpoon.setActive(false);
    harpoon.setCollideWorldBounds(true);
    // Añadir el arpón al grupo
    harpoons.add(harpoon);

    // Configurar controles
    cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.on('keydown-SPACE', shootHarpoon.bind(this)); // Usar bind para asegurar el contexto

    livesText = this.add.text(16, 16, 'Vidas: ' + playerLives, { fontSize: '32px', fill: '#fff' });
    levelText = this.add.text(16, 48, 'Nivel: ' + level, { fontSize: '32px', fill: '#fff' });
    scoreText = this.add.text(16, 80, 'Puntaje: ' + score, { fontSize: '32px', fill: '#fff' });

    currentBackground = this.add.image(400, 300, `background_${level}`).setScrollFactor(0);

    createBubblesAndObstacles.call(this); // Asegúrate de que `this` se refiere a la escena

    // Colisiones entre el arpón y las burbujas
    this.physics.add.collider(harpoons, bubbles, hitBubble, null, this);
}



function shootHarpoon() {
    if (harpoonLaunched) return; // Si ya se disparó un arpón, no hacer nada

    harpoonLaunched = true; // Marcar que el arpón ha sido disparado

    // Hacer visible el arpón y colocarlo en la posición del jugador
    harpoon.setVisible(true);
    harpoon.setPosition(player.x, player.y);
    harpoon.setActive(true); // Hacerlo activo para que se pueda mover
    harpoon.body.enable = true; // Habilitar el cuerpo del arpón

    // Verifica si el arpón está activo y si su cuerpo existe
    if (harpoon.active && harpoon.body) {
        const speed = 500; // La velocidad del arpón
        harpoon.body.setVelocityY(-speed); // Establecer la velocidad en el eje Y hacia arriba
    }

    // Destruir el arpón después de un tiempo (2 segundos)
    this.time.delayedCall(2000, () => {
        if (harpoon.active) {
            harpoon.setVisible(false); // Ocultar el arpón
            harpoon.setActive(false); // Desactivar el arpón
            harpoon.body.enable = false; // Deshabilitar el cuerpo para que no siga moviéndose
            harpoonLaunched = false; // Permitir que se dispare de nuevo
        }
    });
}



// Función para manejar la colisión con el arpón
function hitBubble(bubble, harpoon) {
    if (!bubble || !harpoon || !bubble.active || !harpoon.active) {
        return; // Salir si alguno de los objetos no está activo
    }

    bubble.destroy(); // Destruir la burbuja al ser golpeada por el arpón

    score += 10; // Incrementar el puntaje
    scoreText.setText('Puntaje: ' + score); // Actualizar el texto del puntaje

    // Desactivar el arpón en lugar de destruirlo
    harpoon.setVisible(false); // Ocultar el arpón
    harpoon.setActive(false); // Desactivar el arpón
    harpoon.body.enable = false; // Deshabilitar el cuerpo para que no siga moviéndose

    harpoonLaunched = false; // Permitir que se dispare de nuevo el arpón
}

// Función para crear burbujas y obstáculos
function createBubblesAndObstacles() {
    // Destruir las burbujas previas pero solo si están activas
    bubbles.forEach(bubble => {
        if (bubble && bubble.active) {
            bubble.destroy(); // Asegurarse de destruir solo las burbujas activas
        }
    });
    bubbles = []; // Reiniciar el array de burbujas

    // Crear nuevas burbujas
    for (let i = 0; i < level * 3; i++) {
        let bubbleType = Phaser.Math.Between(0, 1) ? 'bubble' : 'bubbleSmall';
        let bubble = this.physics.add.image(Phaser.Math.Between(50, 750), 0, bubbleType);
        bubble.setVelocity(Phaser.Math.Between(-100, 100), Phaser.Math.Between(50, 200));
        bubble.setBounce(1, 1);
        bubble.setCollideWorldBounds(true);
        bubble.setData('splitCount', 0);
        bubble.setInteractive();

        // Agregar el collider para el arpón solo si ambos son activos
        if (harpoons) {
            this.physics.add.collider(bubble, harpoons, hitBubble, null, this);
        }
        this.physics.add.collider(player, bubble, hitPlayerBubble, null, this);
        this.physics.add.collider(bubble, platforms); // Colisión con el suelo

        bubbles.push(bubble);
    }
}




// Función para manejar la colisión del jugador con la burbuja
function hitPlayerBubble(player, bubble) {
    if (!bubble || !bubble.active) {
        return; // Si la burbuja no está activa, no hacer nada
    }

    playerLives--; // Reducir vidas
    livesText.setText('Vidas: ' + playerLives); // Actualizar el texto de vidas
    bubble.destroy(); // Destruir la burbuja al ser golpeada por el jugador

    if (playerLives <= 0) {
        // Lógica para manejar el fin del juego
        console.log('Game Over');
    }
}

// Función de actualización (update) - esto debe estar en tu ciclo de actualización
function update() {
    // Control de movimiento del jugador
    if (cursors.left.isDown) {
        player.setVelocityX(-160);
    } else if (cursors.right.isDown) {
        player.setVelocityX(160);
    } else {
        player.setVelocityX(0);
    }

    // Solo disparar el arpón si no ha sido lanzado
    if (cursors.up.isDown && !harpoonLaunched) {
        shootHarpoon(); // Lanza el arpón si no se ha lanzado aún
    }
}

// Configuración de Phaser
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: { preload, create, update },
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false }
    }
};

const game = new Phaser.Game(config);

