/** Number remaining of a particular fruit */
export type FruitState = 0 | 1 | 2 | 3 | 4;
const fruitStates: readonly FruitState[] = [0,1,2,3,4];

/** Number of steps left until the raven eats all the fruit. */
export type RavenState = 0 | 1 | 2 | 3 | 4 | 5;
const ravenStates: readonly RavenState[] = [0,1,2,3,4,5];

/**
 * Remaining fruits and steps left for the raven.
 * Fruits are sorted descending.
 */
export type GameState = Readonly<[
	FruitState, FruitState, FruitState, FruitState, RavenState
]>;

/** Index of fruit within a game state */
export type FruitIndex = 0 | 1 | 2 | 3;
const fruitIndices: readonly FruitIndex[] = [0,1,2,3];

const initialState: GameState = [4,4,4,4,5];

/** The game is won if all the fruit is claimed. */
const isWinState = (state: GameState): boolean => {
	return state.slice(0,4).every(x => x === 0);
};

/** The game is lost if the raven reaches the orchard. */
const isLoseState = (state: GameState): boolean => {
	return state[4] === 0;
};

export type Strategy = (state: GameState) => FruitIndex;

/** Choose the emptiest fruit. */
export const greedyBasketStrategy: Strategy = state => {
	for (let i=3; i>0; i--) {
		if (state[i] > 0) return i as FruitIndex;
	}
	return 0;
};

/** Choose the fullest fruit. */
export const varietyBasketStrategy: Strategy = state => 0;

const decrement = <T extends RavenState | FruitState>(state: T): T => {
	return state - 1 as T;
};

const rollRaven = (state: GameState): GameState => {
	return [
		state[0],
		state[1],
		state[2],
		state[3],
		decrement(state[4])
	];
};

const rollFruit = (state: GameState, index: FruitIndex): GameState => {
	// Maintain descending sort
	while (index < 3 && state[index] == state[index+1]) index++;
	return [
		index == 0 ? decrement(state[0]) : state[0],
		index == 1 ? decrement(state[1]) : state[1],
		index == 2 ? decrement(state[2]) : state[2],
		index == 3 ? decrement(state[3]) : state[3],
		state[4]
	]
}

const memo = (state: GameState): string => state.toString();

export const calculateWinChangeWithStartegy_Recursive = (
	strategy: Strategy
): number => {
	return internal_calculateWinChangeWithStrategy_Recursive(strategy);
};
const internal_calculateWinChangeWithStrategy_Recursive = (
	strategy: Strategy,
	state: GameState = initialState,
	cache: Record<string, number> = {}
): number => {
	if (isWinState(state)) return 1;
	if (isLoseState(state)) return 0;
	const id = memo(state);
	if (id in cache) return cache[id];

	let sum: number = 0;
	let weight: number = 0;

	// Raven
	sum += internal_calculateWinChangeWithStrategy_Recursive(strategy, rollRaven(state), cache);
	weight++;

	// Fruits
	fruitIndices
		.filter(i => state[i] > 0)
		.forEach(i => {
			sum += internal_calculateWinChangeWithStrategy_Recursive(strategy, rollFruit(state, i), cache);
			weight++;
		});
	
	// Basket
	sum += internal_calculateWinChangeWithStrategy_Recursive(strategy, rollFruit(state, strategy(state)), cache);
	weight++;

	const p = sum / weight;
	cache[id] = p;
	return p;
};

/** Calculates the odds of winning if a particular strategy is follewed. */
export const calculateWinChanceWithStrategy_DP = (
	strategy: Strategy,
): number => {
	const cache: Record<string, number> = {};
	// Win states
	ravenStates
		.filter(r => r > 0)
		.forEach(r => cache[memo([0,0,0,0,r])] = 1);
	// Lose states
	fruitStates
		.filter(a => a > 0)
		.forEach(a => {
			fruitStates
				.filter(b => b <= a)
				.forEach(b => {
					fruitStates
						.filter(c => c <= b)
						.forEach(c => {
							fruitStates
								.filter(d => d <= c)
								.forEach(d => cache[memo([a,b,c,d,0])] = 0);
						});
				});
		});
	// intermediate states
	ravenStates
		.filter(r => r > 0)
		.forEach(r => {
			fruitStates
				.filter(a => a > 0)
				.forEach(a => {
					fruitStates
						.filter(b => b <= a)
						.forEach(b => {
							fruitStates
								.filter(c => c <= b)
								.forEach(c => {
									fruitStates
										.filter(d => d <= c)
										.forEach(d => {
											const state: GameState = [a,b,c,d,r];
											let sum: number = 0;
											let weight: number = 0;

											// Raven
											sum += cache[memo(rollRaven(state))];
											weight++;

											// Fruits
											fruitIndices
												.filter(i => state[i] > 0)
												.forEach(i => {
													sum += cache[memo(rollFruit(state, i))];
													weight++;
												});

											// Basket
											sum += cache[memo(rollFruit(state, strategy(state)))];
											weight++;

											const p = sum / weight;
											cache[memo(state)] = p;
										});
								});
						});
				});
		});

		return cache[memo(initialState)];
};

console.log("Greedy by DP:", calculateWinChanceWithStrategy_DP(greedyBasketStrategy));
console.log("Greedy by Recursive:", calculateWinChangeWithStartegy_Recursive(greedyBasketStrategy));
console.log("Variety by DP:", calculateWinChanceWithStrategy_DP(varietyBasketStrategy));
console.log("Variety by Recursive:", calculateWinChangeWithStartegy_Recursive(varietyBasketStrategy));
