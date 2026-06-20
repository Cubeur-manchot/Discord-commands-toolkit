"use strict";

export default class CommandContexts {
	#isSlashCommand;
	#isUserContextMenuCommand;
	#isMessageContextMenuCommand;
	get isSlashCommand() {
		return this.#isSlashCommand;
	}
	get isUserContextMenuCommand() {
		return this.#isUserContextMenuCommand;
	}
	get isMessageContextMenuCommand() {
		return this.#isMessageContextMenuCommand;
	}
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
		CommandContexts.#validateContext(isSlashCommand);
		CommandContexts.#validateContext(isUserContextMenuCommand);
		CommandContexts.#validateContext(isMessageContextMenuCommand);
		CommandContexts.#validateContexts(isSlashCommand, isUserContextMenuCommand, isMessageContextMenuCommand);
		this.#isSlashCommand = isSlashCommand;
		this.#isUserContextMenuCommand = isUserContextMenuCommand;
		this.#isMessageContextMenuCommand = isMessageContextMenuCommand;
	};
};
