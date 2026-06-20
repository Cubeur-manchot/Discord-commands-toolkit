"use strict";

import Discord from "discord.js";
import CommandContexts from "./commandContexts.js";
import SlashCommandOption from "./slashCommandOption.js";

export default class Command {
	#name;
	#description;
	#contexts;
	#options;
	#allowDirectMessages;
	#memberPermissions;
	static #nameRegex = /^[-_a-z0-9\u00C0-\u017F]+$/i;
	static #validateName = name => {
		if (name === undefined || name === null) {
			throw new TypeError("Command name is required.");
		}
		if (typeof name !== "string") {
			throw new TypeError("Command name must be a string.");
		}
		if (name.length < 1 || name.length > 32) {
			throw new RangeError("Command name must be between 1 and 32 characters.");
		}
		if (!Command.#nameRegex.test(name)) {
			throw new RangeError(`Command name "${name}" is invalid because it must only contain letters, numbers, hyphens, and underscores.`);
		}
		if (name !== name.toLowerCase()) {
			throw new RangeError(`Command name "${name}" is invalid because it must be lowercase.`);
		}
	};
	static #validateDescription = (description, contexts) => {
		if (!contexts.isSlashCommand) {
			if (description !== undefined && description !== null) {
				throw new RangeError("Command is not a slash command and must not have a description.");
			}
			return;
		}
		if ((description === undefined || description === null) && contexts.isSlashCommand) {
			throw new TypeError("Command description for slash command is required.");
		}
		if (typeof description !== "string") {
			throw new TypeError("Command description for slash command must be a string.");
		}
		if (description.length < 1 || description.length > 100) {
			throw new RangeError("Command description for slash command must be between 1 and 100 characters.");
		}
	};
	static #validateContext = context => {
		if (!(context instanceof CommandContexts)) {
			throw new TypeError("Command contexts must be an instance of CommandContexts.");
		}
	};
	static #validateOptions = (options, contexts) => {
		if (!Array.isArray(options)) {
			throw new TypeError("Command options must be an array.");
		}
		if (options.length > 0 && !contexts.isSlashCommand) {
			throw new TypeError("Command options are not allowed because the command is not a slash command.");
		}
		if (options.length > 25) {
			throw new RangeError("Command options must be less than or equal to 25.");
		}
		if (options.some(option => !(option instanceof SlashCommandOption))) {
			throw new TypeError("Command options must be instances of SlashCommandOption.");
		}
	};
	static #validateAllowDirectMessages = allowDirectMessages => {
		if (typeof allowDirectMessages !== "boolean") {
			throw new TypeError("Command allowDirectMessages must be a boolean.");
		}
	};
	static #validateMemberPermissions = memberPermissions => {
		if (memberPermissions === null) {
			return;
		}
		if (typeof memberPermissions !== "bigint") {
			throw new TypeError("Command memberPermissions must be a bigint (Discord.PermissionFlagsBits).");
		}
	};
	constructor({
		name,
		description,
		contexts = new CommandContexts(),
		options = [],
		allowDirectMessages = false,
		memberPermissions = null
	} = {}) {
		Command.#validateName(name);
		this.#name = name;
		Command.#validateContext(contexts);
		this.#contexts = contexts;
		Command.#validateDescription(description, contexts);
		this.#description = description;
		Command.#validateOptions(options, contexts);
		this.#options = options;
		Command.#validateAllowDirectMessages(allowDirectMessages);
		this.#allowDirectMessages = allowDirectMessages;
		Command.#validateMemberPermissions(memberPermissions);
		this.#memberPermissions = memberPermissions;
	};
	#buildSlashCommand = () => {
		if (!this.#contexts.isSlashCommand) {
			return null;
		}
		let slashCommandBuilder = this.#buildApplicationCommand(Discord.SlashCommandBuilder)
			.setDescription(this.#description);
		this.#options.forEach(option => option.addToSlashCommandBuilder(slashCommandBuilder));
		return slashCommandBuilder;
	};
	#buildUserContextMenuCommand = () => {
		if (!this.#contexts.isUserContextMenuCommand) {
			return null;
		}
		return this.#buildContextMenuCommand(Discord.ApplicationCommandType.User);
	};
	#buildMessageContextMenuCommand = () => {
		if (!this.#contexts.isMessageContextMenuCommand) {
			return null;
		}
		return this.#buildContextMenuCommand(Discord.ApplicationCommandType.Message);
	};
	#buildContextMenuCommand = type => (this.#buildApplicationCommand(Discord.ContextMenuCommandBuilder))
		.setType(type);
	#buildApplicationCommand = applicationCommandBuilder => new applicationCommandBuilder()
		.setName(this.#name)
		.setContexts(Discord.InteractionContextType.Guild, ...(this.#allowDirectMessages ? [Discord.InteractionContextType.BotDM] : []))
		.setDefaultMemberPermissions(this.#memberPermissions);
	build = () => [
		this.buildSlashCommand(),
		this.buildUserContextMenuCommand(),
		this.buildMessageContextMenuCommand()
	].filter(builder => builder !== null);
};
