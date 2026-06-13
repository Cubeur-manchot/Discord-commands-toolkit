"use strict";

export default class CommandContexts {
	#isSlashCommand;
	#isUserContextMenuCommand;
	#isMessageContextMenuCommand;
	static #validateContext = context => {
		if (typeof context !== "boolean") {
			throw new TypeError("Context must be a boolean.");
		}
	};
	static #validateContexts = (isSlashCommand, isUserContextMenuCommand, isMessageContextMenuCommand) => {
		if (!isSlashCommand && !isUserContextMenuCommand && !isMessageContextMenuCommand) {
			throw new RangeError("At least one context must be true.");
		}
	};
	constructor({isSlashCommand = true, isUserContextMenuCommand = false, isMessageContextMenuCommand = false} = {}) {
		[isSlashCommand, isUserContextMenuCommand, isMessageContextMenuCommand].forEach(CommandContexts.#validateContext);
		CommandContexts.#validateContexts(isSlashCommand, isUserContextMenuCommand, isMessageContextMenuCommand);
		this.#isSlashCommand = isSlashCommand;
		this.#isUserContextMenuCommand = isUserContextMenuCommand;
		this.#isMessageContextMenuCommand = isMessageContextMenuCommand;
	};
	isSlashCommand = () => this.#isSlashCommand;
	isUserContextMenuCommand = () => this.#isUserContextMenuCommand;
	isMessageContextMenuCommand = () => this.#isMessageContextMenuCommand;
};
