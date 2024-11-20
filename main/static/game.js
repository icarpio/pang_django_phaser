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
    '/static/background_level_1.PNG', 
    '/static/background_level_2.PNG',
    '/static/background_level_3.PNG',
    '/static/background_level_4.PNG',
    '/static/background_level_5.PNG',
];
let platforms;
let harpoons; // Grupo para los arpones

const BUBBLE_TYPES = {
    'bubble': { image: 'bubble', score: 10, splitCount: 2 },     
    'bubbleSmall': { image: 'bubbleSmall', score: 20, splitCount: 1 }, 
    'bubbleTiny': { image: 'bubbleTiny', score: 30, splitCount: 0 } 
};

// Función para cargar los recursos
function preload() {
    this.load.image('player', '/static/player.png');
    this.load.image('harpoon', '/static/harpoon.png');
    this.load.image('bubble', '/static/bubble.png');        
    this.load.image('bubbleSmall', '/static/bubbleSmall.png'); 
    this.load.image('bubbleTiny', '/static/bubbleTiny.png'); 
    this.load.image('ground', '/static/ground.PNG'); 
    for (let i = 0; i < levelBackgrounds.length; i++) {
        this.load.image(`background_${i + 1}`, levelBackgrounds[i]);
    }
}

function create() {
    platforms = this.physics.add.staticGroup();
    platforms.create(400, 568, 'ground').setScale(1).refreshBody();

    player = this.physics.add.sprite(400, 500, 'player').setCollideWorldBounds(true);
    player.setDisplaySize(50, 50);
    this.physics.add.collider(player, platforms);

    // Hacer que el jugador sea inmóvil en colisiones con burbujas
    player.body.immovable = true; 

    harpoons = this.physics.add.group({
        defaultKey: 'harpoon',
        maxSize: 10 // Número máximo de arpones que puedes tener
    });

    // Inicializa los arpones en el grupo
    harpoons.children.iterate((harpoon) => {
        harpoon.setDisplaySize(20, 20);
        harpoon.setCollideWorldBounds(true);
        harpoon.setVisible(false); // Inicialmente oculto
        harpoon.setActive(false); // Inicialmente no activo
        harpoon.body.enable = false; // Desactiva el cuerpo
    });

    
    // Detección de dispositivos
    if (this.sys.game.device.input.touch) {
        buildMobileControls.call(this);
    } else {
        cursors = this.input.keyboard.createCursorKeys();
    }
    this.input.keyboard.on('keydown-SPACE', shootHarpoon.bind(this));

    livesText = this.add.text(16, 16, 'Vidas: ' + playerLives, { fontSize: '32px', fill: '#fff' });
    levelText = this.add.text(16, 48, 'Nivel: ' + level, { fontSize: '32px', fill: '#fff' });
    scoreText = this.add.text(16, 80, 'Puntaje: ' + score, { fontSize: '32px', fill: '#fff' });

    // Obtener el tamaño del juego
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;

    // Agregar la imagen de fondo y establecer su tamaño
    currentBackground = this.add.image(0, 0, `background_${level}`)
        .setOrigin(0, 0) // Asegurarse de que la imagen se ancle en la esquina superior izquierda
        .setDisplaySize(gameWidth , gameHeight-50) // Ajustar el tamaño de la imagen al tamaño de la pantalla
        .setScrollFactor(0) // No se mueve con la cámara
        .setDepth(-1); // Colocar detrás de otros objetos

    createBubblesAndObstacles.call(this); 

    // Cambiar la colisión del jugador con burbujas a un overlap
    this.physics.add.overlap(harpoons, bubbles, hitBubble, null, this);
    this.physics.add.overlap(player, bubbles, hitPlayerBubble, null, this);
}
function shootHarpoon() {
    if (harpoonLaunched) return; 

    const harpoon = harpoons.get();
    if (!harpoon) {
        console.error("No hay arpones disponibles en el grupo.");
        return;
    }

    harpoonLaunched = true; 

    // Configura el arpón
    harpoon.setVisible(true);
    harpoon.setDisplaySize(25, 25);
    harpoon.setPosition(player.x, player.y);
    harpoon.setActive(true);
    harpoon.body.enable = true;

    const speed = 500; 
    harpoon.body.setVelocityY(-speed);

    this.time.delayedCall(2000, () => {
        if (harpoon.active) {
            harpoon.setVisible(false);
            harpoon.setActive(false);
            harpoon.body.enable = false;
            harpoonLaunched = false;
        }
    });
}

function hitBubble(bubble, harpoon) {
    if (!bubble || !harpoon || !bubble.active || !harpoon.active) return;

    const bubbleType = bubble.getData('type');
    const bubbleInfo = BUBBLE_TYPES[bubbleType];

    if (!bubbleInfo) {
        console.error('Tipo de burbuja no válido:', bubbleType);
        return;
    }

    score += bubbleInfo.score;
    scoreText.setText('Puntaje: ' + score);

    if (bubbleInfo.splitCount > 0) {
        createSmallerBubbles.call(this, bubble.x, bubble.y, bubbleInfo.splitCount, bubbleType);
    }

    bubble.destroy();
    harpoon.destroy();
    harpoonLaunched = false;

    // Remover la burbuja del array
    bubbles = bubbles.filter(b => b !== bubble);
}

function createBubblesAndObstacles() {
    bubbles.forEach(bubble => {
        if (bubble && bubble.active) {
            bubble.destroy();
        }
    });
    bubbles = [];

    for (let i = 0; i < level * 1; i++) {
        let bubbleType = 'bubble';
        let bubble = this.physics.add.image(Phaser.Math.Between(50, 750), 0, bubbleType);

        bubble.setVelocity(Phaser.Math.Between(-100, 100), Phaser.Math.Between(50, 200));
        bubble.setBounce(1, 1);
        bubble.setCollideWorldBounds(true);
        bubble.setData('type', bubbleType);
        bubble.setInteractive();

        // Añadir colisiones
        this.physics.add.collider(bubble, harpoons, hitBubble, null, this);
        this.physics.add.collider(player, bubble, hitPlayerBubble, null, this);
        this.physics.add.collider(bubble, platforms);

        bubbles.push(bubble);
    }
}

function createSmallerBubbles(x, y, count, bubbleType) {
    let newBubbleType;

    if (bubbleType === 'bubble') {
        newBubbleType = 'bubbleSmall';
    } else if (bubbleType === 'bubbleSmall') {
        newBubbleType = 'bubbleTiny';
    } else {
        return;
    }

    for (let i = 0; i < count; i++) {
        const bubble = this.physics.add.image(x, y, BUBBLE_TYPES[newBubbleType].image);
        bubble.setVelocity(Phaser.Math.Between(-100, 100), Phaser.Math.Between(50, 200));
        bubble.setBounce(1, 1);
        bubble.setCollideWorldBounds(true);
        bubble.setData('type', newBubbleType);

        // Añadir colisiones específicas para burbujas más pequeñas
        this.physics.add.collider(bubble, harpoons, hitBubble, null, this);
        this.physics.add.collider(player, bubble, hitPlayerBubble, null, this);
        this.physics.add.collider(bubble, platforms);

        bubbles.push(bubble);
    }
}


function hitPlayerBubble(bubble) {
    if (!bubble || !bubble.active) {
        return; 
    }

    playerLives--; 
    livesText.setText('Vidas: ' + playerLives); 

    if (playerLives <= 0) {
        console.log('Game Over');
        endGame.call(this);
    }
}
// Función para pasar al siguiente nivel
function nextLevel() {

    // Incrementar el nivel
    level++;
    levelText.setText('Nivel: ' + level);

    // Actualizar el fondo para el siguiente nivel
    currentBackground.setTexture(`background_${level}`);
    
    // Aumentar el número de burbujas para el siguiente nivel
    createBubblesAndObstacles.call(this);
     // Verificar si el nivel es 6 o superior
     if (level >= 6) {
        finishGame.call(this);
        return;
    }
}

// Función de fin de juego
function endGame() {
    console.log("GAME OVER");

    // Muestra el mensaje de GAME OVER
    const gameOverText = this.add.text(400, 300, 'GAME OVER', {
        fontSize: '32px',
        fill: '#ffffff'
    });
    gameOverText.setOrigin(0.5);

    // Indica cómo reiniciar el juego
    const restartText = this.add.text(400, 350, 'Presiona "R" para reiniciar', {
        fontSize: '24px',
        fill: '#ffffff'
    });
    restartText.setOrigin(0.5);

    // Desactivar al jugador y otros elementos si es necesario
    player.setActive(false).setVisible(false);
    bubbles.forEach(bubble => {
        bubble.setActive(false).setVisible(false);
    });

    // Configurar una tecla para reiniciar el juego
    this.input.keyboard.once('keydown-R', restartGame, this);
}

// Función para finalizar el juego al alcanzar el nivel 6
function finishGame() {
    console.log("¡Felicidades! Has completado el juego.");

    const victoryText = this.add.text(400, 300, '¡Felicidades! Has completado el juego.', {
        fontSize: '32px',
        fill: '#ffffff'
    });
    victoryText.setOrigin(0.5);

    const restartText = this.add.text(400, 350, 'Presiona "R" para reiniciar', {
        fontSize: '24px',
        fill: '#ffffff'
    });
    restartText.setOrigin(0.5);

    player.setActive(false).setVisible(false);
    bubbles.forEach(bubble => {
        bubble.setActive(false).setVisible(false);
    });

    this.input.keyboard.once('keydown-R', restartGame, this);
}

// Función para reiniciar el juego
function restartGame() {
    // Restablecer variables del juego
    level = 1;
    playerLives = 3;
    score = 0;

    // Actualizar los textos de nivel, puntaje y vidas
    levelText.setText('Nivel: ' + level);
    scoreText.setText('Puntaje: ' + score);
    livesText.setText('Vidas: ' + playerLives);

    // Reiniciar la escena
    this.scene.restart();
}


// Función de actualización (update) - esto debe estar en tu ciclo de actualización
function update() {
    // Control de movimiento del jugador
    if (this.sys.game.device.input.touch) {
        handleMobileControls.call(this);
    } else {
        // Controles de teclado
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

    // Verificar si se destruyeron todas las burbujas
    if (bubbles.length === 0) {
        nextLevel.call(this);
    }

    bubbles.forEach(bubble => {
        if (bubble.active) {
            bubble.angle += 2; // Rotación continua en sentido antihorario
        }
    });
    console.log(bubbles.length);
}

// Función para manejar controles móviles
function handleMobileControls() {
    // Aquí puedes manejar la lógica de los controles móviles
    // Por ejemplo, verificar el estado de los botones táctiles
}

// Función para construir controles móviles
function buildMobileControls() {
    // Crear botones táctiles para controles móviles
    const leftButton = this.add.rectangle(50, this.scale.height - 50, 100, 50, 0x0000ff).setInteractive();
    const rightButton = this.add.rectangle(150, this.scale.height - 50, 100, 50, 0x00ff00).setInteractive();
    const shootButton = this.add.rectangle(250, this.scale.height - 50, 100, 50, 0xff0000).setInteractive();

    shootButton.setInteractive();

    leftButton.on('pointerdown', () => {
        player.setVelocityX(-160);
    });
    leftButton.on('pointerup', () => {
        player.setVelocityX(0);
    });

    rightButton.on('pointerdown', () => {
        player.setVelocityX(160);
    });
    rightButton.on('pointerup', () => {
        player.setVelocityX(0);
    });

    shootButton.on('pointerdown', () => {
        if (!harpoonLaunched) {
            shootHarpoon.call(this);  // Dispara el arpón
        }
    });
}

// Configuración de Phaser
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: { preload, create, update },
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false } // Cambia a true para activar el debug
    }
};
const game = new Phaser.Game(config);

