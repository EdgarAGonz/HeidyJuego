// app.js
import DamasBoard from './game/damasboard.js';
import ReactivePlayer from './game/playerReactive.js';

function newGame(startingPlayer = 1, agentType = 'reactive') {
  // Configuración inicial
  const board = new DamasBoard(8); // Tablero de 8x8
  const reactiveAgent = new ReactivePlayer();
  
  // Solo usamos el agente reactivo
  const computerAgent = reactiveAgent;
  
  const boardDIV = document.getElementById("board");
  const winnerMsgDiv = document.getElementById("winnerMessage");
  const winnerText = document.getElementById("winnerText");
  const currentPlayerDiv = document.getElementById("currentPlayer");

  // Reset UI
  winnerMsgDiv.style.display = "none";
  winnerText.textContent = "";
  boardDIV.innerHTML = "";
  currentPlayerDiv.textContent = startingPlayer === 1 ? "Turno: Jugador (rojo)" : "Turno: Computadora (azul)";

  // Crear celdas del tablero de damas
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const cell = document.createElement("div");
      cell.classList.add("cell", `cell-${r}-${c}`);
      
      // Alternar colores del tablero
      if ((r + c) % 2 === 0) {
        cell.classList.add("light");
      } else {
        cell.classList.add("dark");
      }
      
      boardDIV.appendChild(cell);
    }
  }
  
  const htmlCells = [...boardDIV.querySelectorAll('.cell')];
  let selectedPiece = null; // Para almacenar la pieza seleccionada
  let validMoves = []; // Para almacenar movimientos válidos

  function showResult() {
    const res = board.isTerminal();
    if (!res) return;
    
    if (res.winner === "red") winnerText.textContent = "¡Jugador gana!";
    else if (res.winner === "blue") winnerText.textContent = "¡Computadora gana!";
    else winnerText.textContent = "¡Empate!";
    winnerMsgDiv.style.display = "block";
  }

  function updateBoardUI() {
    // Limpiar todas las piezas y selecciones
    htmlCells.forEach(cell => {
      cell.classList.remove("red", "blue", "red_king", "blue_king", "selected", "valid-move");
    });

    // Actualizar piezas
    board.state.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell) {
          const htmlCell = htmlCells[r * 8 + c];
          if (htmlCell) {
            htmlCell.classList.add(cell);
          }
        }
      });
    });

    // Resaltar pieza seleccionada
    if (selectedPiece) {
      const { row, col } = selectedPiece;
      const cellIndex = row * 8 + col;
      if (htmlCells[cellIndex]) {
        htmlCells[cellIndex].classList.add("selected");
      }
    }

    // Mostrar movimientos válidos
    validMoves.forEach(move => {
      if (move && move.to) {
        const { row, col } = move.to;
        const cellIndex = row * 8 + col;
        if (htmlCells[cellIndex]) {
          htmlCells[cellIndex].classList.add("valid-move");
        }
      }
    });
  }

  function computerMove() {
  if (board.isTerminal()) {
    showResult();
    return;
  }

  currentPlayerDiv.textContent = "Computadora pensando...";

  setTimeout(() => {
    try {
      const move = computerAgent.getBestMove(board, "blue");

      if (!move || !move.from || !move.to) {
        console.error("No se encontró movimiento válido para la computadora");
        currentPlayerDiv.textContent = "Turno: Jugador (rojo)";
        return;
      }

      console.log(`Computadora realiza movimiento: de (${move.from.row}, ${move.from.col}) a (${move.to.row}, ${move.to.col})`);
      if (move.captured) {
        console.log(`Computadora captura ficha en (${move.captured.row}, ${move.captured.col})`);
      }

      // IMPORTANTE: Guardar la posición final del movimiento para comprobar capturas adicionales
      const toRow = move.to.row;
      const toCol = move.to.col;

      board.makeMove(move);
      updateBoardUI();

      if (board.isTerminal()) {
        showResult();
        return;
      }

      // Verificar capturas adicionales
      if (move.type === 'capture') {
        const additionalCaptures = board.getValidMoves(toRow, toCol)
          .filter(m => m && m.type === 'capture');

        if (additionalCaptures.length > 0) {
          console.log("Computadora tiene capturas adicionales disponibles");
          
          // En lugar de llamar recursivamente, usamos los movimientos adicionales directamente
          const captureMove = computerAgent.selectRandomMove(additionalCaptures);
          
          if (captureMove) {
            console.log(`Computadora realiza captura adicional: de (${captureMove.from.row}, ${captureMove.from.col}) a (${captureMove.to.row}, ${captureMove.to.col})`);
            
            setTimeout(() => {
              board.makeMove(captureMove);
              updateBoardUI();
              
              // Verificar si el juego ha terminado después de la captura adicional
              if (board.isTerminal()) {
                showResult();
                return;
              }
              
              // Asegurarse de que el turno pase al jugador después de todas las capturas
              board.currentPlayer = 'red';
              currentPlayerDiv.textContent = "Turno: Jugador (rojo)";
            }, 500);
            return;
          }
        }
      }

      // Si no hay capturas adicionales, cambiar el turno al jugador humano
      board.currentPlayer = 'red';
      currentPlayerDiv.textContent = "Turno: Jugador (rojo)";
    } catch (error) {
      console.error("Error en computerMove:", error);
      currentPlayerDiv.textContent = "Turno: Jugador (rojo)";
    }
  }, 500);
}

  // Si la computadora comienza primero
  if (startingPlayer === 0) {
    setTimeout(computerMove, 300);
  }

  // Manejador de eventos para el jugador humano
  boardDIV.addEventListener("click", (e) => {
    if (board.isTerminal() || board.currentPlayer !== 'red') return;

    const cell = e.target.closest('.cell');
    if (!cell || !cell.classList.contains('dark')) return;

    const index = htmlCells.indexOf(cell);
    if (index === -1) return;

    const row = Math.floor(index / 8);
    const col = index % 8;

    // Validar posición
    if (row < 0 || row >= 8 || col < 0 || col >= 8) return;

    const piece = board.state[row][col];

    // Si no hay pieza seleccionada y el jugador hace clic en una pieza suya
    if (!selectedPiece && piece && piece.includes('red')) {
      selectedPiece = { row, col };
      validMoves = board.getValidMoves(row, col) || [];
      updateBoardUI();
      return;
    }

    // Si hay una pieza seleccionada, verificar si el clic es un movimiento válido
    if (selectedPiece) {
      const move = validMoves.find(m => 
        m && m.to && m.to.row === row && m.to.col === col
      );
      
      if (move) {
        board.makeMove(move);
        selectedPiece = null;
        validMoves = [];
        updateBoardUI();
        
        if (board.isTerminal()) {
          showResult();
          return;
        }

        currentPlayerDiv.textContent = "Turno: Computadora (azul)";

        // Manejar capturas múltiples
        if (move.type === 'capture') {
        const additionalCaptures = board.getValidMoves(row, col)
          .filter(m => m && m.type === 'capture');
        
        if (additionalCaptures.length > 0) {
          // Permitir al jugador realizar la captura adicional
          selectedPiece = { row, col };
          validMoves = additionalCaptures;
          updateBoardUI();
          return;
        }
      }

      // Si no hay capturas adicionales, pasar el turno a la computadora
      selectedPiece = null;
      validMoves = [];
      updateBoardUI();

      if (board.isTerminal()) {
        showResult();
        return;
      }

      currentPlayerDiv.textContent = "Turno: Computadora (azul)";
      setTimeout(computerMove, 500);
      } else {
        // Si hace clic en otra pieza suya, seleccionarla
        if (piece && piece.includes('red')) {
          selectedPiece = { row, col };
          validMoves = board.getValidMoves(row, col) || [];
          updateBoardUI();
        }
      }
    }
  });

  // Actualizar la UI inicial
  updateBoardUI();
}

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
  const startPlayerSel = document.getElementById("starting");
  const btnNewGame = document.getElementById("newGame");

  // Primer juego
  newGame(
    parseInt(startPlayerSel.value),
    'reactive'
  );

  btnNewGame.addEventListener("click", () => {
    newGame(
      parseInt(startPlayerSel.value),
      'reactive'
    );
  });
});