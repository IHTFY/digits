/**
 * Old vanilla JS + MaterializeCSS
 */
// /**
//  *
//  * @param {any} puzzle //TODO define type...
//  */
// const renderPuzzle = (puzzle) => {
// 	puzzle.target;
// 	puzzle.numList;
// 	puzzle.solution;
// 	puzzle.tabIndex; // 1-indexed
// 	puzzle.stars;

// 	const board = document.getElementById('game' + puzzle.tabIndex);
// 	board.innerHTML = `<div>
//     <h1 class="center">${puzzle.target}</h1>
//   </div>`;

// 	const buttonRow = document.createElement('div');
// 	buttonRow.className = 'row container center';
// 	board.appendChild(buttonRow);

// 	for (let i = 0; i < puzzle.numList.length; i++) {
// 		buttonRow.innerHTML += `<div class="col s4">
//     <a class="cyan black-text btn-floating btn-large waves-effect waves-light">
//         ${puzzle.numList[i]}
//     </a>`;
// 	}

// 	/* Load Stars */
// 	const tabInfo = document.querySelector(`a[href$="#tab${puzzle.tabIndex}`);
// 	tabInfo.innerHTML =
// 		puzzle.target +
// 		'<i class="material-icons">star</i>'.repeat(puzzle.stars) +
// 		'<i class="material-icons">star_outline</i>'.repeat(3 - puzzle.stars) +
// 		'</div>';
// };

// const renderProgress = (stars) => {
// 	document.getElementById('totalProgress').style.width = `${(100 * stars) / 15}%`;

// 	//<div id="totalProgress" class="determinate cyan" style="width: 25%"></div>
// };

// export { renderProgress, renderPuzzle };
