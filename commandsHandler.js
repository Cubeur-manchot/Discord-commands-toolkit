"use strict";

import Discord from "discord.js";
import Command from "./command.js";

export default class CommandsHandler {
	#discordClient;
	#commands; // instances of Command
	#applicationCommandBuilders; // instances of Discord.js SlashCommandBuilder or ContextMenuCommandBuilder (to be deployed)
	#applicationCommands; // instances of Discord.js ApplicationCommand (deployed)
	get applicationCommands() {
		return this.#applicationCommands;
	}
	#guildApplicationCommands;
	#logger;
	#guildIds;
	static #validateDiscordClient = discordClient => {
		if (!(discordClient instanceof Discord.Client)) {
			throw new TypeError("Discord client must be an instance of Discord.Client.");
		}
	};
	static #validateCommands = commands => {
		if (!Array.isArray(commands)) {
			throw new TypeError("Commands must be an array.");
		}
		if (commands.some(command => !(command instanceof Command))) {
			throw new TypeError("Commands must be an array of Command instances.");
		}
		if (new Set(commands.map(command => command.name)).size !== commands.length) {
			throw new RangeError("Command names must be unique. Define multiple contexts for the same command instead of duplicating the command.");
		}
	};
	static #validateLogger = logger => {
		if (typeof logger !== "object" || logger === null) {
			throw new TypeError("Logger must be an object.");
		}
		for (const method of ["info", "warn", "error"]) {
			if (typeof logger[method] !== "function") {
				throw new TypeError(`Logger must have a "${method}" method.`);
			}
		}
	};
	static #validateDiscordClientApplicationId = discordClient => {
		if (typeof discordClient.application?.id !== "string") {
			throw new TypeError("Discord client must be ready (discordClient.application.id is not available).");
		}
	};
	static #validateGuildIds = guildIds => {
		if (guildIds === undefined || guildIds === null) {
			return;
		}
		if (!Array.isArray(guildIds)) {
			throw new TypeError("GuildIds must be an array.");
		}
		if (guildIds.length === 0) {
			throw new RangeError("GuildIds must have at least one element. To deploy commands globally, keep guildId null instead.");
		}
		if (guildIds.some(guildId => typeof guildId !== "string")) {
			throw new TypeError("GuildIds must be an array of strings (snowflakes).");
		}
	};
	constructor({discordClient, commands, logger, guildIds = null} = {}) {
		CommandsHandler.#validateDiscordClient(discordClient);
		this.#discordClient = discordClient;
		CommandsHandler.#validateCommands(commands);
		this.#applicationCommandBuilders = commands.flatMap(command => command.build());
		CommandsHandler.#validateLogger(logger);
		this.#logger = logger;
		CommandsHandler.#validateGuildIds(guildIds);
		this.#guildIds = guildIds;
		this.#commands = new Map(commands.map(command => [command.name, Object.assign(command, {commandsHandler: this, logger: this.#logger})]));
		this.#attachEventHandlers();
	};
	#attachEventHandlers = () => {
		this.#discordClient.once(Discord.Events.ClientReady, this.#deployCommands);
		this.#discordClient.on(Discord.Events.InteractionCreate, this.#handleInteraction);
	};
	#deployCommands = async () => {
		CommandsHandler.#validateDiscordClientApplicationId(this.#discordClient);
		if (this.#guildIds) {
			const missingGuilds = this.#guildIds.filter(guildId => !this.#discordClient.guilds.cache.has(guildId));
			if (missingGuilds.length > 0) {
				throw new Error(`Could not deploy guild application commands because some guilds cannot be found : ${missingGuilds.join(", ")}. The deployment of commands has been aborted.`);
			}
			this.#guildApplicationCommands = new Map();
			this.#logger.info("Start updating guild application commands.");
			await Promise.all(this.#guildIds.map(async guildId => {
				this.#guildApplicationCommands.set(guildId, await this.#discordClient.guilds.cache.get(guildId).commands.set(this.#applicationCommandBuilders));
				this.#logger.info(`Application commands have been deployed for guild "${guildId}".`);
			}));
			this.#logger.info(`Guild application commands have been deployed successfully to ${this.#guildIds.length} guild${this.#guildIds.length > 1 ? "s" : ""}.`);
		} else {
			this.#logger.info("Start updating global application commands.");
			this.#applicationCommands = await this.#discordClient.application.commands.set(this.#applicationCommandBuilders);
			this.#logger.info("Application commands have been deployed successfully at global scope.");
		}
	};
	#handleInteraction = async interaction => {
		if (!interaction.isCommand()) {
			return;
		}
		if (this.#guildIds && interaction.guildId && !this.#guildIds.includes(interaction.guildId)) { // interaction from different guild
			return;
		}
		const command = this.#commands.get(interaction.commandName);
		if (!command) {
			throw new Error(`Receiving a command interaction for unhandled command "${interaction.commandName}".`);
		}
		const answer = await command.handleInteraction(
			interaction,
			interaction.isChatInputCommand() ? command.parseOptions(interaction.options) : null
		);
		try {
			await interaction.reply(answer);
		} catch (interactionReplyError) {
			this.#logger.error(`Failed to reply interaction : ${interactionReplyError.stack}`);
		}
	};
};
