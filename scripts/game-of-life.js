
// Conway's Game of Life rules:
// 1. Any live cell with two or three live neighbours survives.
// 2. Any dead cell with three live neighbours becomes a live cell.
// 3. All other live cells die in the next generation. Similarly, all other dead cells stay dead.

class GameOfLife extends HTMLElement {
  #frame = 0;

  #config = {
    CELL_SIZE: 16,
    INITIAL_DENSITY: 0.2,
    MAX_FPS: 12,
    COLORS_BY_AGE: [
      "#e65f5c", // age 1
      "#bd4e52",
      "#7d3242",
      "#451a34",
      "#0F0326",
    ],
    TRAIL_COLORS_BY_AGE: [
      "#9f9aa8",
      "#9f9aa8",
      "#9f9aa8",
      "#9f9aa8",
      "#c1bdc6",
      "#c1bdc6",
      "#c1bdc6",
      "#c1bdc6",
      "#c1bdc6",
      "#c1bdc6",
      "#c1bdc6",
      "#c1bdc6",
      "#e0dee3",
      "#e0dee3",
      "#e0dee3",
      "#e0dee3",
      "#e0dee3",
      "#e0dee3",
      "#e0dee3",
      "#e0dee3",
      "#e0dee3",
      "#e0dee3",
      "#e0dee3",
      "#e0dee3",
      "#e0dee3",
      "#e0dee3",
      "#e0dee3",
      "#e0dee3",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
      "#f3f0f7",
    ]
  }

  #canvas = {
    canvas: null,
    ctx: null,
    width: null,
    height: null,
  }

  #arena = {
    offsetX: null,
    offsetY: null,
    xCellCount: null,
    yCellCount: null,
  }

  #state = null;
  #history = []

  constructor() {
    super();

    this._shadowRoot = this.attachShadow({ mode: "open" });
    this._shadowRoot.innerHTML = `
      <style>
        * {
          box-sizing: border-box;
        }

        .container {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .panel {
          display: none;
          position: absolute;
          bottom: 10px;
          right: 10px
        }

        canvas {
          cursor: grab;
          box-sizing: border-box;
          background: #e8f5e9;
        }

        canvas.grabbing {
          cursor: grabbing;
        }
        
        button {
          min-width: 44px;
          min-height: 44px;
          user-select: none;
        }

      </style>
      <div class="container">
        <canvas>
          Your browser does not support HTML5 canvas.
        </canvas>

      </div>
    `;
  }

  connectedCallback () {
    this.#canvas = this.#getCanvas();
    this.#arena = this.#getArena(this.#canvas);
    this.#state = this.#getInitialState();

    // this.#canvas.canvas.addEventListener("click", () => {
    //   this.#step();
    // })

    // this.#canvas.canvas.addEventListener("contextmenu", (e) => {
    //   e.preventDefault();
    //   this.#back();
    // })

    // this.#draw(this.#state)
    this.#startAnimation();

    this.#canvas.canvas.addEventListener("mousedown", () => {
      this.#canvas.canvas.classList.add("grabbing")
    })

    this.#canvas.canvas.addEventListener("mouseup", () => {
      this.#canvas.canvas.classList.remove("grabbing")
    })

    this.#canvas.canvas.addEventListener("mouseout", () => {
      this.#canvas.canvas.classList.remove("grabbing")
    })

    let prevX = 0;
    let prevY = 0;

    this.#canvas.canvas.addEventListener("mousemove", (event) => {
      const currentX = event.clientX - this.#canvas.canvas.getBoundingClientRect().left;
      const currentY = event.clientY - this.#canvas.canvas.getBoundingClientRect().top;
      if (this.#canvas.canvas.classList.contains("grabbing")) {

        
        // Calculate the differences in mouse coordinates
        const diffX = currentX - prevX;
        const diffY = currentY - prevY;
    
        let offsetX = this.#arena.offsetX + diffX;
        let offsetY = this.#arena.offsetY + diffY;
        // Determine direction based on differences
        // if (Math.abs(diffX) > Math.abs(diffY)) {
        //   if (diffX > 0) {
        //     offsetX += diffX
        //   } else {
        //     offsetX--
        //   }
        // } else {
        //   if (diffY > 0) {
        //     offsetY++
        //   } else {
        //     offsetY--
        //   }
        // }

        this.#arena = {
          ...this.#arena,
          offsetX,
          offsetY,
        }
      }
      prevX = currentX;
      prevY = currentY;
    })

    window.addEventListener('resize', () => {
      this.#canvas = this.#getCanvas()
    });
  }

  #step () {
    this.#frame++;
    this.#history.push(this.#state);
    this.#state = this.#calculateState(this.#state);
    this.#draw(this.#state);
  }

  #back () {
    if (this.#history.length) {
      this.#state = this.#history.pop();
      this.#draw(this.#state);
      this.#frame--;
    }
  }

  #startAnimation () {
    this.#animate();
  }

  #animate () {
    const { MAX_FPS } = this.#config;

    const interval = 1000 / MAX_FPS;
    let lastTimestamp = 0;

    const throttledAnimationFrame = (timestamp) => {
      if (!lastTimestamp || timestamp - lastTimestamp >= interval) {
        this.#frame++
        this.#state = this.#calculateState(this.#state);
        lastTimestamp = timestamp;
      }

      this.#draw(this.#state);
      requestAnimationFrame(throttledAnimationFrame);
    }

    requestAnimationFrame(throttledAnimationFrame);
  }

  #calculateState = (prevState) => {
    const { TRAIL_COLORS_BY_AGE } = this.#config;

    const state = {};
    const checked = {};
  
    Object.entries(prevState).forEach(([key, age]) => {
      
      if (age > 0) {
        const coord = this.#stringToCoordinate(key);
        const neighboringCoords = this.#getNeighboringCoordinates(coord);
        const neighborCount = this.#getLiveCellsCount(neighboringCoords, prevState);
        const livesOn = neighborCount === 2 || neighborCount === 3;

        if (livesOn) {
          state[key] = age + 1;
        } else {
          state[key] = 0; // dies
        }

        checked[key] = true;

        for (const coord of neighboringCoords) {
          const neighborKey = String(coord);
          const isChecked = checked[neighborKey];
  
          checked[neighborKey] = true;
  
          if (isChecked) continue;
          const neighborNeighboringCoords = this.#getNeighboringCoordinates(coord)
          const count = this.#getLiveCellsCount(neighborNeighboringCoords, prevState)
  
  
          if (count === 3) {
            state[neighborKey] = 1 // born;
          }
  
        }
      } else {
        if (state[key] === undefined) {
          const maxTrailAge = TRAIL_COLORS_BY_AGE.length;
          const trailAge = (age * -1) + 1;
  
          if (trailAge < maxTrailAge) {
            state[key] = age - 1;
          }
        }
      }



    })

    return state;
  }

  #getNeighboringCoordinates = (coord) => {
    const coordinates = []
  
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const isSelf = i === 0 && j === 0;
        if (isSelf) continue;
  
        const nx = coord[0] + i;
        const ny = coord[1] + j;
  
        coordinates.push([nx, ny])
      }
    }
  
    return coordinates;
  }

  #getLiveCellsCount = (coordinates, state) => {
    let count = 0;
  
    coordinates.forEach((coordinate) => {
      const isAlive = state[String(coordinate)] > 0;
  
      if (isAlive) {
        count++;
      }
    })
  
    return count;
  }

  #draw (state) {
    const { canvas, width } = this.#canvas;
    
    canvas.width = width; // clear canvas
    
    // TODO do not draw if out of bound
    Object.entries(state).forEach(([key, age]) => {
      const [x, y] = this.#stringToCoordinate(key)

      this.#drawRectangle(x, y, age);
    });
  }

  #drawRectangle (x, y, age) {
    const { CELL_SIZE } = this.#config;
    const { ctx } = this.#canvas;
    const { offsetX, offsetY } = this.#arena;

    ctx.beginPath();
    ctx.fillStyle = this.#getColor(age);
    ctx.rect(
      offsetX + x * CELL_SIZE,
      offsetY + y * CELL_SIZE,
      CELL_SIZE,
      CELL_SIZE,
    );
    ctx.closePath();
    ctx.fill();
  }

  #getCanvas () {
    const { width, height } = this.parentElement.getBoundingClientRect();
    const canvas = this._shadowRoot.querySelector('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = width;
    canvas.height = height;

    return {
      canvas,
      ctx,
      width,
      height,
    }
  }

  #getArena (canvas) {
    const { CELL_SIZE } = this.#config;
    const { width, height } = canvas;

    const xCellCount = Math.floor(width / CELL_SIZE);
    const yCellCount = Math.floor(height / CELL_SIZE);  
  
    const offsetX = Math.floor((width % CELL_SIZE) / 2);
    const offsetY = Math.floor((height % CELL_SIZE) / 2);

    return {
      offsetX,
      offsetY,
      xCellCount,
      yCellCount,
    }
  }

  #getInitialState () {
    const { xCellCount, yCellCount } = this.#arena;
    const middleX = Math.floor(xCellCount / 2);
    const middleY = Math.floor(yCellCount / 2);

    const pattern = [
      "...................................................",
      "...................................................",
      "...................................................",
      "...................................................",
      "...................................................",
      "...................................................",
      "...................................................",
      "...................................................",
      "o.o.............................................o.o",
      "..o.............................................o..",
      "....o.........................................o....",
      "....o.o.....................................o.o....",
      "....o.oo...................................oo.o....",
      "......o.....................................o......",
    ]

    return this.#plainTextToStateObject(
      pattern,
      [middleX - Math.floor(pattern[0].length / 2), middleY - Math.floor(pattern.length / 2)],
    );

    const { INITIAL_DENSITY } = this.#config;

    const initialCellCount = Math.round(INITIAL_DENSITY * xCellCount * yCellCount);
    const state = {}

    for (let i = 0; i < initialCellCount; i++) {
      let coord = null;

      do {
        const x = this.#getRandomInt(0, xCellCount - 1);
        const y = this.#getRandomInt(0, yCellCount - 1);

        coord = [x, y];
      } while (state[String(coord)] !== undefined);
  
      state[String(coord)] = 1; // born
    }

    return state;
  }

  #getRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }


  #stringToCoordinate (str) {
    const arr = str.split(',')

    return [Number(arr[0]), Number(arr[1])];
  }

  #getColor (age) {
    if (age > 0) {
      const { COLORS_BY_AGE } = this.#config;
      const index = age - 1

      if (index > COLORS_BY_AGE.length - 1) {
        return COLORS_BY_AGE.at(-1)
      }
  
      return COLORS_BY_AGE[index];
    }
    // handle trail color
    const { TRAIL_COLORS_BY_AGE } = this.#config;
    const index = Math.abs((age));

    return TRAIL_COLORS_BY_AGE[index];
  }

  #plainTextToStateObject (arr, topLeft) {
    const [x, y] = topLeft;
    const obj = {}

    arr.forEach((rowStr, rowIndex) => {
      const row = rowStr.split("");
      row.forEach((col, colIndex) => {
        if (col === "o") {
          const key = String([x + colIndex, y + rowIndex])
          obj[key] = 1;
        }
      })
    })

    return obj
  }
}

customElements.define('game-of-life', GameOfLife);
