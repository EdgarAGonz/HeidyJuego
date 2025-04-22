export default class ReactivePlayer {
  constructor() {
    this.rules = {
      // Prioridad 1: Capturas disponibles
      capture: (board, color) => {
        const captures = [];
        for (let row = 0; row < board.size; row++) {
          for (let col = 0; col < board.size; col++) {
            const piece = board.state[row][col];
            if (piece && piece.includes(color)) {
              const moves = board.getValidMoves(row, col);
              moves.forEach(move => {
                if (move.type === 'capture') captures.push(move);
              });
            }
          }
        }
        return captures;
      },
      
      // Prioridad 2: Movimientos que coronan fichas
      promote: (board, color) => {
        const promotions = [];
        const lastRow = color === 'red' ? 0 : board.size - 1;
        
        for (let row = 0; row < board.size; row++) {
          for (let col = 0; col < board.size; col++) {
            const piece = board.state[row][col];
            if (piece === color) { // Solo fichas no coronadas
              const moves = board.getValidMoves(row, col);
              moves.forEach(move => {
                if (move.to.row === lastRow) promotions.push(move);
              });
            }
          }
        }
        return promotions;
      },
      
      // Prioridad 3: Movimientos defensivos
      defensive: (board, color) => {
        const defensiveMoves = [];
        for (let row = 0; row < board.size; row++) {
          for (let col = 0; col < board.size; col++) {
            const piece = board.state[row][col];
            if (piece && piece.includes(color)) {
              const moves = board.getValidMoves(row, col);
              defensiveMoves.push(...moves.filter(move => {
                // Preferir movimientos que no dejen la ficha en peligro
                return !this.isPositionUnderThreat(board, move.to.row, move.to.col, color);
              }));
            }
          }
        }
        return defensiveMoves;
      },
      
      // Prioridad 4: Movimientos ofensivos
      offensive: (board, color) => {
        const offensiveMoves = [];
        for (let row = 0; row < board.size; row++) {
          for (let col = 0; col < board.size; col++) {
            const piece = board.state[row][col];
            if (piece && piece.includes(color)) {
              const moves = board.getValidMoves(row, col);
              moves.forEach(move => {
                if ((color === 'red' && move.to.row < row) || 
                    (color === 'blue' && move.to.row > row)) {
                  offensiveMoves.push(move);
                }
              });
            }
          }
        }
        return offensiveMoves;
      },
      
      // Prioridad 5: Movimientos aleatorios
      random: (board, color) => {
        const allMoves = [];
        for (let row = 0; row < board.size; row++) {
          for (let col = 0; col < board.size; col++) {
            const piece = board.state[row][col];
            if (piece && piece.includes(color)) {
              const moves = board.getValidMoves(row, col);
              allMoves.push(...moves);
            }
          }
        }
        return allMoves;
      }
    };
  }

  isPositionUnderThreat(board, row, col, color) {
    const opponent = color === 'red' ? 'blue' : 'red';
    const directions = [[-1,-1],[-1,1],[1,-1],[1,1]];
    
    for (const [dr, dc] of directions) {
      const adjRow = row + dr;
      const adjCol = col + dc;
      const jumpRow = row - dr;
      const jumpCol = col - dc;
      
      if (board.isValidPosition(adjRow, adjCol) && 
          board.state[adjRow][adjCol] && 
          board.state[adjRow][adjCol].includes(opponent) &&
          board.isValidPosition(jumpRow, jumpCol) && 
          !board.state[jumpRow][jumpCol]) {
        return true;
      }
    }
    return false;
  }

  getBestMove(board, color) {
    // Aplicar reglas en orden de prioridad
    let moves = this.rules.capture(board, color);
    if (moves.length > 0) return this.selectRandomMove(moves);
    
    moves = this.rules.promote(board, color);
    if (moves.length > 0) return this.selectRandomMove(moves);
    
    moves = this.rules.defensive(board, color);
    if (moves.length > 0) return this.selectRandomMove(moves);
    
    moves = this.rules.offensive(board, color);
    if (moves.length > 0) return this.selectRandomMove(moves);
    
    moves = this.rules.random(board, color);
    return this.selectRandomMove(moves);
  }

  selectRandomMove(moves) {
    return moves.length > 0 ? moves[Math.floor(Math.random() * moves.length)] : null;
  }
}