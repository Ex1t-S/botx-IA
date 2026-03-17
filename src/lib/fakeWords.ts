import { wordlists } from "bip39";

const bip39EnglishWords = wordlists.english as string[];

export const fakeWords = Array.from(new Set([
	...bip39EnglishWords
]));