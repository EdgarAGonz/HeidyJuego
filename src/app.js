// app.js - Este archivo es el principal del juego, maneja la interfaz y la lógica de jugabilidad

// Importamos las clases necesarias para el juego
import DamasBoard from './game/damasBoard.js';  // Tablero de damas y reglas del juego
import ReactivePlayer from './game/playerReactive.js';  // IA que juega contra el humano

// Función principal para iniciar un nuevo juego
function newGame(startingPlayer = 1, agentType = 'reactive') {
  // Configuración inicial del juego
  const board = new DamasBoard(8); // Crea un tablero de 8x8 casillas
  const reactiveAgent = new ReactivePlayer(); // Crea la IA que tomará decisiones
  
  // Por ahora solo usamos el agente reactivo como IA
  const computerAgent = reactiveAgent;
  
  // Obtenemos elementos del HTML para manipular la interfaz
  const boardDIV = document.getElementById("board"); // Div donde se dibuja el tablero
  const winnerMsgDiv = document.getElementById("winnerMessage"); // Mensaje cuando alguien gana
  const winnerText = document.getElementById("winnerText"); // Texto del ganador
  const currentPlayerDiv = document.getElementById("currentPlayer"); // Indicador de turno actual

  // Limpiamos la interfaz para empezar un juego nuevo
  winnerMsgDiv.style.display = "none"; // Oculta mensaje de ganador
  winnerText.textContent = ""; // Borra texto previo
  boardDIV.innerHTML = ""; // Limpia el tablero
  // Muestra quién empieza a jugar
  currentPlayerDiv.textContent = startingPlayer === 1 ? "Turno: Jugador (rojo)" : "Turno: Computadora (azul)";

  // Construimos visualmente el tablero de damas
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      // Creamos cada casilla como un div
      const cell = document.createElement("div");
      // Le asignamos clases para identificarla por su posición
      cell.classList.add("cell", `cell-${r}-${c}`);
      
      // En damas, las casillas alternan colores
      if ((r + c) % 2 === 0) {
        cell.classList.add("light"); // Casillas claras (no jugables)
      } else {
        cell.classList.add("dark"); // Casillas oscuras (donde van las fichas)
      }
      
      // Añadimos la casilla al tablero
      boardDIV.appendChild(cell);
    }
  }
  
  // Guardamos todas las casillas en un array para manipularlas fácilmente
  const htmlCells = [...boardDIV.querySelectorAll('.cell')];
  let selectedPiece = null; // Variable para recordar qué ficha está seleccionada
  let validMoves = []; // Array para guardar los movimientos posibles de la ficha seleccionada

  // Función para mostrar el resultado cuando termina el juego
  function showResult() {
    // Verificamos si el juego ha terminado
    const res = board.isTerminal();
    if (!res) return; // Si no ha terminado, no hacemos nada
    
    // Mostramos el mensaje según quién ganó
    if (res.winner === "red") winnerText.textContent = "¡Jugador gana!";
    else if (res.winner === "blue") winnerText.textContent = "¡Computadora gana!";
    else winnerText.textContent = "¡Empate!";
    
    // Hacemos visible el mensaje
    winnerMsgDiv.style.display = "block";
  }

  // Función para actualizar el aspecto visual del tablero según el estado del juego
  function updateBoardUI() {
    // Primero limpiamos todas las marcas especiales de las casillas
    htmlCells.forEach(cell => {
      cell.classList.remove("red", "blue", "red_king", "blue_king", "selected", "valid-move");
    });

    // Colocamos las fichas según el estado actual del tablero
    board.state.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell) { // Si hay una ficha en esta posición
          const htmlCell = htmlCells[r * 8 + c];
          if (htmlCell) {
            htmlCell.classList.add(cell); // Añadimos la clase del color/tipo de la ficha
          }
        }
      });
    });

    // Si hay una ficha seleccionada, la marcamos visualmente
    if (selectedPiece) {
      const { row, col } = selectedPiece;
      const cellIndex = row * 8 + col;
      if (htmlCells[cellIndex]) {
        htmlCells[cellIndex].classList.add("selected"); // Resaltamos la ficha seleccionada
      }
    }

    // Resaltamos las casillas donde la ficha seleccionada puede moverse
    validMoves.forEach(move => {
      if (move && move.to) {
        const { row, col } = move.to;
        const cellIndex = row * 8 + col;
        if (htmlCells[cellIndex]) {
          htmlCells[cellIndex].classList.add("valid-move"); // Marcamos los movimientos posibles
        }
      }
    });
  }

  // Función para que la computadora realice su movimiento
  function computerMove() {
    // Verificamos si el juego ya terminó
    if (board.isTerminal()) {
      showResult();
      return;
    }

    // Informamos al jugador que la computadora está pensando
    currentPlayerDiv.textContent = "Computadora pensando...";

    // Agregamos un pequeño retraso para que el movimiento de la computadora no sea instantáneo
    setTimeout(() => {
      try {
        // La IA decide cuál es el mejor movimiento
        const move = computerAgent.getBestMove(board, "blue");

        // Verificamos que el movimiento sea válido
        if (!move || !move.from || !move.to) {
          console.error("No se encontró movimiento válido para la computadora");
          currentPlayerDiv.textContent = "Turno: Jugador (rojo)";
          return;
        }

        // Registramos el movimiento en la consola (para depuración)
        console.log(`Computadora realiza movimiento: de (${move.from.row}, ${move.from.col}) a (${move.to.row}, ${move.to.col})`);
        if (move.captured) {
          console.log(`Computadora captura ficha en (${move.captured.row}, ${move.captured.col})`);
        }

        // Guardamos la posición final para verificar si hay capturas adicionales después
        const toRow = move.to.row;
        const toCol = move.to.col;

        // Ejecutamos el movimiento en el tablero
        board.makeMove(move);
        // Actualizamos el aspecto visual
        updateBoardUI();

        // Verificamos si el juego terminó tras este movimiento
        if (board.isTerminal()) {
          showResult();
          return;
        }

        // Verificamos si hay capturas adicionales (saltos múltiples)
        if (move.type === 'capture') {
          // Buscamos movimientos adicionales que sean capturas desde la nueva posición
          const additionalCaptures = board.getValidMoves(toRow, toCol)
            .filter(m => m && m.type === 'capture');

          // Si hay capturas adicionales posibles
          if (additionalCaptures.length > 0) {
            console.log("Computadora tiene capturas adicionales disponibles");
            
            // La IA elige una de las capturas adicionales
            const captureMove = computerAgent.selectRandomMove(additionalCaptures);
            
            if (captureMove) {
              console.log(`Computadora realiza captura adicional: de (${captureMove.from.row}, ${captureMove.from.col}) a (${captureMove.to.row}, ${captureMove.to.col})`);
              
              // Añadimos otro pequeño retraso para la captura adicional
              setTimeout(() => {
                // Ejecutamos la captura adicional
                board.makeMove(captureMove);
                updateBoardUI();
                
                // Verificamos si el juego terminó tras la captura adicional
                if (board.isTerminal()) {
                  showResult();
                  return;
                }
                
                // Aseguramos que el turno pase al jugador después de todas las capturas
                board.currentPlayer = 'red';
                currentPlayerDiv.textContent = "Turno: Jugador (rojo)";
              }, 500);
              return;
            }
          }
        }

        // Si no hay capturas adicionales, cambiamos el turno al jugador humano
        board.currentPlayer = 'red';
        currentPlayerDiv.textContent = "Turno: Jugador (rojo)";
      } catch (error) {
        // Capturamos cualquier error durante el turno de la computadora
        console.error("Error en computerMove:", error);
        currentPlayerDiv.textContent = "Turno: Jugador (rojo)";
      }
    }, 500); // Esperamos medio segundo antes de que la computadora mueva
  }

  // Si la configuración indica que la computadora empieza primero
  if (startingPlayer === 0) {
    setTimeout(computerMove, 300); // Pequeño retraso inicial
  }

  // Configuramos el evento para cuando el jugador hace clic en el tablero
  boardDIV.addEventListener("click", (e) => {
    // Si el juego terminó o no es turno del jugador, ignoramos el clic
    if (board.isTerminal() || board.currentPlayer !== 'red') return;

    // Obtenemos la casilla donde se hizo clic
    const cell = e.target.closest('.cell');
    // Si no se hizo clic en una casilla o no es una casilla jugable (oscura), ignoramos
    if (!cell || !cell.classList.contains('dark')) return;

    // Encontramos el índice de la casilla en nuestro array
    const index = htmlCells.indexOf(cell);
    if (index === -1) return;

    // Calculamos la fila y columna de la casilla
    const row = Math.floor(index / 8);
    const col = index % 8;

    // Verificamos que la posición sea válida (debería serlo siempre)
    if (row < 0 || row >= 8 || col < 0 || col >= 8) return;

    // Obtenemos qué hay en esta posición del tablero
    const piece = board.state[row][col];

    // CASO 1: No hay ficha seleccionada y el jugador hace clic en una de sus fichas
    if (!selectedPiece && piece && piece.includes('red')) {
      // Seleccionamos esta ficha
      selectedPiece = { row, col };
      // Obtenemos todos los movimientos válidos para esta ficha
      validMoves = board.getValidMoves(row, col) || [];
      // Actualizamos el aspecto visual para mostrar la selección
      updateBoardUI();
      return;
    }

    // CASO 2: Ya hay una ficha seleccionada, verificamos si el clic es un movimiento válido
    if (selectedPiece) {
      // Buscamos si la posición del clic corresponde a un movimiento válido
      const move = validMoves.find(m => 
        m && m.to && m.to.row === row && m.to.col === col
      );
      
      // Si es un movimiento válido
      if (move) {
        // Ejecutamos el movimiento
        board.makeMove(move);
        // Reiniciamos la selección
        selectedPiece = null;
        validMoves = [];
        // Actualizamos el aspecto visual
        updateBoardUI();
        
        // Verificamos si el juego terminó tras este movimiento
        if (board.isTerminal()) {
          showResult();
          return;
        }

        // Cambiamos el indicador de turno
        currentPlayerDiv.textContent = "Turno: Computadora (azul)";

        // Verificamos si hay capturas múltiples disponibles
        if (move.type === 'capture') {
          // Buscamos capturas adicionales desde la nueva posición
          const additionalCaptures = board.getValidMoves(row, col)
            .filter(m => m && m.type === 'capture');
          
          // Si hay capturas adicionales
          if (additionalCaptures.length > 0) {
            // Permitimos al jugador realizar la captura adicional seleccionando automáticamente la ficha
            selectedPiece = { row, col };
            validMoves = additionalCaptures;
            updateBoardUI();
            return; // Esperamos a que el jugador decida el próximo movimiento
          }
        }

        // Si no hay capturas adicionales, finalizamos el turno del jugador
        selectedPiece = null;
        validMoves = [];
        updateBoardUI();

        // Verificamos si el juego terminó
        if (board.isTerminal()) {
          showResult();
          return;
        }

        // Cambiamos al turno de la computadora
        currentPlayerDiv.textContent = "Turno: Computadora (azul)";
        setTimeout(computerMove, 500); // La computadora piensa después de medio segundo
      } else {
        // Si el clic no es un movimiento válido pero es otra ficha del jugador
        if (piece && piece.includes('red')) {
          // Cambiamos la selección a esta nueva ficha
          selectedPiece = { row, col };
          // Obtenemos los movimientos válidos para esta nueva ficha
          validMoves = board.getValidMoves(row, col) || [];
          // Actualizamos el aspecto visual
          updateBoardUI();
        }
      }
    }
  });

  // Actualizamos la interfaz al iniciar el juego
  updateBoardUI();
}

// Código de inicialización cuando se carga la página
document.addEventListener("DOMContentLoaded", () => {
  // Obtenemos los elementos del HTML que necesitamos
  const startPlayerSel = document.getElementById("starting"); // Selector de quién empieza
  const btnNewGame = document.getElementById("newGame"); // Botón de nuevo juego

  // Iniciamos el primer juego al cargar la página
  newGame(
    parseInt(startPlayerSel.value), // Quién empieza (0=computadora, 1=jugador)
    'reactive' // Tipo de IA (por ahora solo hay reactiva)
  );

  // Configuramos el botón de nuevo juego
  btnNewGame.addEventListener("click", () => {
    // Cuando se hace clic en "Nuevo Juego", reiniciamos con la configuración actual
    newGame(
      parseInt(startPlayerSel.value),
      'reactive'
    );
  });
});