import { sendScoreToServer } from './utils.js';

// Variables globales
let player;
let harpoon;
let level = 1;
let playerLives = 3;
let score = 0;
let cursors;
let harpoonLaunched = false;
let levelText, livesText, scoreText, finalScore = 0;
let currentBackground;
let platforms;
let obstacle;
let harpoons; // Grupo para los arpones
let levelBackgrounds = [
    '/static/img/background_level_1.PNG', 
    '/static/img/background_level_2.PNG',
    '/static/img/background_level_3.PNG',
    '/static/img/background_level_4.PNG',
    '/static/img/background_level_5.PNG',
    '/static/img/background_level_6.PNG',
    '/static/img/background_level_7.PNG',
    '/static/img/background_level_8.PNG',
    '/static/img/background_level_9.PNG',
    '/static/img/background_level_10.PNG',
    '/static/img/background_level_11.PNG',
    '/static/img/background_level_12.PNG',
];

let bubbles = []; 
const BUBBLE_TYPES = {
    'bubbleRed': { image: 'bubbleRed', score: 10, splitCount: 2, size: 100 },     
    'bubbleBlue': { image: 'bubbleBlue', score: 15, splitCount: 2, size: 100 },     
    'bubblePurple': { image: 'bubblePurple', score: 12, splitCount: 2, size: 140 },

    'bubbleRedSmall': { image: 'bubbleRed', score: 20, splitCount: 1, size: 50 }, 
    'bubbleBlueSmall': { image: 'bubbleBlue', score: 25, splitCount: 1, size: 50 }, 
    'bubblePurpleSmall': { image: 'bubblePurple', score: 22, splitCount: 3, size: 90},

    'bubbleRedTiny': { image: 'bubbleRed', score: 30, splitCount: 0, size:30 },
    'bubbleBlueTiny': { image: 'bubbleBlue', score: 35, splitCount: 0, size:30 },
    'bubblePurpleTiny': { image: 'bubblePurple', score: 32, splitCount: 0, size:30 }
};

//Obtener el nombre del usuario
const playerName = window.playerName || 'Unknown Player';

// Función para cargar los recursos
function preload() {
    //this.load.image('player', '/static/img/player.png');
    this.load.spritesheet('player', '/static/img/playersheet.png',{ frameWidth: 32, frameHeight: 32});
    this.load.image('harpoon', '/static/img/harpoon.png');

    this.load.image('bubbleRed', '/static/img/bubbleRed.png');        
    this.load.image('bubbleBlue', '/static/img/bubbleBlue.png'); 
    this.load.image('bubblePurple', '/static/img/bubblePurple.png'); 
    this.load.image('obstacle', '/static/img/obstacle.png'); 
    this.load.image('ground', '/static/img/ground.PNG'); 
    for (let i = 0; i < levelBackgrounds.length; i++) {
        this.load.image(`background_${i + 1}`, levelBackgrounds[i]);
    }
    this.load.image('leftButtonImage', '/static/img/leftButton.png'); // Carga la imagen del botón izquierdo
    this.load.image('rightButtonImage', '/static/img/rightButton.png'); // Carga la imagen del botón derecho
    this.load.image('shootButtonImage', '/static/img/shootButton.png'); // Carga la imagen del botón de disparo

    this.load.image('lifeIcon', '/static/img/lifeIcon.png');
    this.load.image('levelIcon', '/static/img/levelIcon.png');
    this.load.image('scoreIcon', '/static/img/scoreIcon.png');
}

function create() {
    platforms = this.physics.add.staticGroup();
    platforms.create(400, 568, 'ground').setScale(1).refreshBody();
    
    //PLAYER
    player = this.physics.add.sprite(400, 500, 'player').setCollideWorldBounds(true);
    player.setDisplaySize(50, 50);
    this.physics.add.collider(player, platforms);

    // Hacer que el jugador sea inmóvil en colisiones con burbujas
    player.body.immovable = true; 
    console.log('PLAYER',playerName)

    this.anims.create({
        key: 'walk_left',
        frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1 // Repetir la animación en bucle
    });

    this.anims.create({
        key: 'shoot',
        frames: [{ key: 'player', frame: 4 }], // Usar solo el frame 4
        frameRate: 1, // Frame estático
        repeat: 0 // No repetir
    });

    harpoons = this.physics.add.group({
        defaultKey: 'harpoon',
        maxSize: 10 
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

    // Icono de vidas
    const lifeIcon = this.add.image(16, 12, 'lifeIcon').setOrigin(0); // Escalar si es necesario
    // Añadir el texto al lado de la imagen, alineado en la misma altura
    livesText = this.add.text(lifeIcon.x + lifeIcon.width + 5, lifeIcon.y, playerLives, {
        fontSize: '32px',
        fontFamily: 'Arial',
        fill: '#1a53b6'
    });

    const scoreIcon = this.add.image(16, 48, 'scoreIcon').setOrigin(0); 
    scoreText = this.add.text(scoreIcon.x + scoreIcon.width + 5, scoreIcon.y, score, {
        fontSize: '32px',
        fontFamily: 'Arial',
        fill: '#1a53b6'
    });

    const levelIcon = this.add.image(16, 84, 'levelIcon').setOrigin(0); 
    levelText = this.add.text(levelIcon.x + levelIcon.width + 5, levelIcon.y, level, {
        fontSize: '32px',
        fontFamily: 'Arial',
        fill: '#1a53b6'
    });

    //levelText = this.add.text(16, 48, 'Level: ' + level, { fontSize: '32px', fill: '#1a53b6',fontFamily: 'Arial',fontWeight: 'bold'});
    //scoreText = this.add.text(16, 80, 'Score: ' + score, { fontSize: '32px', fill: '#1a53b6',fontFamily: 'Arial',fontWeight: 'bold'});

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

    this.physics.add.overlap(harpoons, bubbles, hitBubble, null, this);
    this.physics.add.overlap(player, bubbles, hitPlayerBubble, null, this);

    player.anims.play('shoot', true);

     
}
function shootHarpoon() {
    if (harpoonLaunched) return; 

    const harpoon = harpoons.get();
    if (!harpoon) {
        console.error("No hay arpones disponibles en el grupo.");
        return;
    }
    player.anims.play('shoot', true);
    harpoonLaunched = true; 

    // Configura el arpón
    harpoon.setVisible(true);
    harpoon.setDisplaySize(25, 25);
    harpoon.setPosition(player.x, player.y -25); //Posicion desde donde se dispara el harpoon
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
    scoreText.setText(score);

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
    // Limpiar burbujas existentes
    bubbles.forEach(bubble => {
        if (bubble && bubble.active) {
            bubble.destroy();
        }
    });
    bubbles = [];

    // Limpiar obstáculo existente si es necesario
    if (this.currentObstacle && this.currentObstacle.active) {
        this.currentObstacle.destroy();
    }

    this.currentObstacle = this.physics.add.image(
        Phaser.Math.Between(50, 750), // Rango horizontal
        Phaser.Math.Between(150, this.cameras.main.height / 2), // Rango vertical (mitad superior)
        'obstacle'
    );
    this.currentObstacle.setImmovable(true); // Hacer que el obstáculo sea inamovible
    this.currentObstacle.setCollideWorldBounds(true); // Limitarlo dentro del mundo

    // Tipos de burbujas para la primera burbuja
    const firstBubbleTypes = ['bubbleRed', 'bubbleBlue', 'bubblePurple'];

    // Determinar cuántas burbujas crear según el nivel
    let numberOfBubbles;
    if (level >= 1 && level <= 4) {
        numberOfBubbles = 1;
    } else if (level >= 5 && level <= 10) {
        numberOfBubbles = 2;
    } else if (level >= 11 && level <= 12) {
        numberOfBubbles = 3;
    } else {
        numberOfBubbles = 0; // Si el nivel es mayor a 12, no se generan burbujas
        finishGame.call(this);
    }

    // Crear burbujas según el número determinado
    for (let i = 0; i < numberOfBubbles; i++) { 
        const randomFirstBubbleType = firstBubbleTypes[Phaser.Math.Between(0, firstBubbleTypes.length - 1)];
        const firstBubbleInfo = BUBBLE_TYPES[randomFirstBubbleType];

        // Crear la burbuja
        let firstBubble = this.physics.add.image(
            Phaser.Math.Between(50, 750),
            0,
            firstBubbleInfo.image
        );
        firstBubble.setDisplaySize(firstBubbleInfo.size, firstBubbleInfo.size);
        firstBubble.setVelocity(
            Phaser.Math.Between(-100, 100),
            Phaser.Math.Between(50, 200)
        );
        firstBubble.setBounce(1, 1);
        firstBubble.setCollideWorldBounds(true);
        firstBubble.setData('type', randomFirstBubbleType);
        firstBubble.setInteractive();

        // Añadir colisiones
        this.physics.add.collider(firstBubble, harpoons, hitBubble, null, this);
        this.physics.add.collider(player, firstBubble, hitPlayerBubble, null, this);
        this.physics.add.collider(firstBubble, this.currentObstacle); // Colisión con el único obstáculo
        this.physics.add.collider(firstBubble, platforms);

        bubbles.push(firstBubble);
    }
}


function createSmallerBubbles(x, y, count, bubbleType) {
    let newBubbleType;

    if (bubbleType === 'bubbleRed') {
        newBubbleType = 'bubbleRedSmall';
    } else if (bubbleType === 'bubbleRedSmall') {
        newBubbleType = 'bubbleRedTiny';
    } else if (bubbleType === 'bubbleBlue') {
        newBubbleType = 'bubbleBlueSmall';
    } else if (bubbleType === 'bubbleBlueSmall') {
        newBubbleType = 'bubbleBlueTiny';
    } else if (bubbleType === 'bubblePurple') {
        newBubbleType = 'bubblePurpleSmall';
    } else if (bubbleType === 'bubblePurpleSmall') {
        newBubbleType = 'bubblePurpleTiny';
    } else {
        return; // Si no es un tipo válido, salir de la función
    }

    const bubbleInfo = BUBBLE_TYPES[newBubbleType];

    for (let i = 0; i < count; i++) {
        const bubble = this.physics.add.image(x, y, bubbleInfo.image);

        // Ajustar el tamaño de la burbuja
        bubble.setDisplaySize(bubbleInfo.size, bubbleInfo.size);

        bubble.setVelocity(Phaser.Math.Between(-100, 100), Phaser.Math.Between(50, 200));
        bubble.setBounce(1, 1);
        bubble.setCollideWorldBounds(true);
        bubble.setData('type', newBubbleType);

        // Añadir colisiones específicas para burbujas más pequeñas
        this.physics.add.collider(bubble, harpoons, hitBubble, null, this);
        this.physics.add.collider(player, bubble, hitPlayerBubble, null, this);
        this.physics.add.collider(bubble, platforms);

        // Usa this.currentObstacle para las colisiones con obstáculos
        if (this.currentObstacle) {
            this.physics.add.collider(bubble, this.currentObstacle);
        }

        bubbles.push(bubble);
    }
}


function hitPlayerBubble(bubble) {
    if (!bubble || !bubble.active) {
        return; 
    }

    playerLives--; 
    livesText.setText(playerLives); 

    if (playerLives <= 0) {
        console.log('Game Over');
        endGame.call(this);
    }
}
// Función para pasar al siguiente nivel
function nextLevel() {
    // Incrementar el nivel
    level++;
    levelText.setText(level);

    // Actualizar el fondo para el siguiente nivel
    currentBackground.setTexture(`background_${level}`);
    
    // Aumentar el número de burbujas para el siguiente nivel
    createBubblesAndObstacles.call(this);
     // Verificar si el nivel es 8 o superior
     if (level >= 13) {
        finishGame.call(this);
        return;
    }
}

// Función de fin de juego
function endGame() {
    // Muestra el mensaje de GAME OVER
    const gameOverText = this.add.text(400, 300, 'GAME OVER', {
        fontSize: '32px',
        fill: '#d5dbe7',
        fontFamily: 'Arial',fontWeight: 'bold'
    });
    gameOverText.setOrigin(0.5);

    // Indica cómo reiniciar el juego
    const restartText = this.add.text(400, 350, 'Toca para reiniciar o presiona "R"', {
        fontSize: '24px',
        fill: '#d5dbe7',
        fontFamily: 'Arial',fontWeight: 'bold'
    });
    restartText.setOrigin(0.5);

    sendScoreToServer(playerName,score)

    // Desactivar al jugador y otros elementos si es necesario
    player.setActive(false).setVisible(false);
    bubbles.forEach(bubble => {
        bubble.setActive(false).setVisible(false);
    });
    //harpoon.setActive(false).setVisible(false);

    // Configurar un evento de toque para reiniciar el juego
    this.input.on('pointerdown', restartGame, this);

    // Configurar una tecla para reiniciar el juego
    this.input.keyboard.once('keydown-R', restartGame, this);
}

function finishGame() {
    // Muestra el mensaje de GAME OVER
    const gameOverText = this.add.text(400, 300, 'VICTORY', {
        fontSize: '32px',
        fill: '#d5dbe7',
        fontFamily: 'Arial',fontWeight: 'bold'
    });
    gameOverText.setOrigin(0.5);

    // Indica cómo reiniciar el juego
    const restartText = this.add.text(400, 350, 'Toca para reiniciar o presiona "R"', {
        fontSize: '24px',
        fill: '#d5dbe7',
        fontFamily: 'Arial',fontWeight: 'bold'
    });
    restartText.setOrigin(0.5);

    sendScoreToServer(playerName,score)

    // Desactivar al jugador y otros elementos si es necesario
    player.setActive(false).setVisible(false);
    bubbles.forEach(bubble => {
        bubble.setActive(false).setVisible(false);
    });

    // Configurar un evento de toque para reiniciar el juego
    this.input.on('pointerdown', restartGame, this);

    // Configurar una tecla para reiniciar el juego
    this.input.keyboard.once('keydown-R', restartGame, this);
}


// Función para manejar controles móviles
function handleMobileControls() {
   
}

// Función para reiniciar el juego
function restartGame() {
    // Restablecer variables del juego
    level = 1;
    playerLives = 3;
    score = 0;

    // Actualizar los textos de nivel, puntaje y vidas
    livesText.setText(playerLives);
    scoreText.setText(score);
    levelText.setText(level);
    //scoreText.setText('Score: ' + score);
    //levelText.setText('Level: ' + level);
    //scoreText.setText('Score: ' + score);
    

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
            player.flipX = false; // No voltear el sprite
            player.anims.play('walk_left', true); // Reproducir animación de caminar a la izquierda
        } else if (cursors.right.isDown) {
            player.setVelocityX(160);
            player.flipX = true; // Voltear el sprite horizontalmente
            player.anims.play('walk_left', true); // Reproducir la misma animación pero volteada
        } else {
            player.setVelocityX(0);
            player.anims.play('shoot', true);  
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


// Función para construir controles móviles
function buildMobileControls() {
    // Crear botones táctiles para controles móviles

    //const leftButton = this.add.rectangle(50, this.scale.height - 50, 100, 50, 0x0000ff).setInteractive();
    const leftButton = this.add.sprite(50, this.scale.height - 40, 'leftButtonImage').setInteractive();
    const rightButton = this.add.sprite(150, this.scale.height - 40, 'rightButtonImage').setInteractive();
    const shootButton = this.add.sprite(750, this.scale.height - 40, 'shootButtonImage').setInteractive(); 

    // Escala los botones si es necesario
    leftButton.setScale(2); // Ajusta el tamaño según sea necesario
    rightButton.setScale(2);
    shootButton.setScale(2);

    leftButton.on('pointerdown', () => {
        player.setVelocityX(-160);
        player.flipX = false; 
        player.anims.play('walk_left', true); 
    });
    leftButton.on('pointerup', () => {
        player.setVelocityX(0);
        player.anims.play('shoot', true);  
    });

    rightButton.on('pointerdown', () => {
        player.setVelocityX(160);
        player.flipX = true; 
        player.anims.play('walk_left', true); 
    });
    rightButton.on('pointerup', () => {
        player.setVelocityX(0);
        player.anims.play('shoot', true);  
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
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false } // Cambia a true para activar el debug
    }
};
const game = new Phaser.Game(config);

